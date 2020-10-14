const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const request = require('request-promise');
const Client = require('ftp');
const { execSync } = require('child_process');

const config = require('./config');

let win;

const createWindow = () => {
  win = new BrowserWindow({
    width: 200,
    height: 350,
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: true
    }
  });
  win.loadFile('index.html');
  //win.webContents.openDevTools();

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) createWindow();
});

// Merge pages
ipcMain.on('merge-pages', (event, { pageNumber, sentDirectory }) => {
  const files = fs.readdirSync(sentDirectory)
    .filter((f) => f.endsWith('.pdf'))
    .sort((a, b) => {
      return a.split('.').slice(-2, -1)[0] - b.split('.').slice(-2, -1)[0];
    })
    .map((filename) => `'${sentDirectory}/${filename}'`);
  const jointFilename = `${files[0].split('.').slice(0, 3).join('.')}.pdf'`;

  const onError = () => event.sender.send('merge-pages-res', { success: false });

  try {
    execSync(`pdftk ${files.join(' ')} cat output ${jointFilename}`, { env: { PATH: '/usr/local/bin/:/usr/bin/' } }).toString();
  } catch (e) {
    onError(e);
  }

  event.sender.send('merge-pages-res', { success: true });
});

// Send page
ipcMain.on('send-page', (event, { method, pageNumber, sentDirectory }) => {
  const filename = fs.readdirSync(sentDirectory)
    .filter((f) => f.endsWith(`A.${pageNumber}.pdf`))[0];
  const fullFilePath = `${sentDirectory}/${filename}`;

  const fn = method === 'pg' ? sendPagePG : sendPageSlack;
  fn(event, pageNumber, filename, fullFilePath);
});

// Send to PG
const sendPagePG = (event, pageNumber, filename, fullFilePath) => {
  const onFTPEvent = (success) => event.sender.send('send-page-res', { method: 'pg', pageNumber, success });

  const conn = new Client();
  const loadedSendFile = conn.put.bind(conn, fullFilePath, filename);

  conn.on('ready', () => {
    loadedSendFile((err) => {
      if (err) onFTPEvent(false);
      conn.end();
    });
  });

  conn.on('close', () => onFTPEvent(true));

  conn.connect(config.ftp_settings);
};

// Send to Slack
const sendPageSlack = (event, pageNumber, _, fullFilePath) => {
  request({
    method: 'POST',
    url: 'https://slack.com/api/files.upload',
    formData: Object.assign(
      {},
      { file: fs.createReadStream(fullFilePath) },
      config.slack_settings)
  }).then((res) => {
    const parsedRes = JSON.parse(res);
    event.sender.send('send-page-res', { method: 'slack', pageNumber, success: parsedRes.ok });
  });
};
