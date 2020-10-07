const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const request = require('request-promise');
const Client = require('ftp');

const config = require('./config');

let win;

const createWindow = () => {
  win = new BrowserWindow({
    width: 200,
    height: 320,
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: true
    }
  });
  win.loadFile('index.html');
  win.webContents.openDevTools();

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

// Send to PG
ipcMain.on('send-pg', (event, { filePath, pageNumber }) => {
  const file = fs.readdirSync(`${filePath}/Sent/`)
    .filter((f) => f.endsWith(`A.${pageNumber}.pdf`))[0];
  const fullFilePath = `${filePath}/Sent/${file}`;

  const onFTPError = () => event.sender.send('send-pg-res', { pageNumber, success: false });
  const onFTPSuccess = () => event.sender.send('send-pg-res', { pageNumber, success: true });

  const conn = new Client();
  conn.on('ready', () => {
    conn.put(fullFilePath, file, (err) => {
      if (err) return onFTPError();

      conn.end();
      onFTPSuccess();
    });
  });

  conn.connect(config.ftp_settings);
});

// Send to Slack
ipcMain.on('send-slack', (event, { filePath, pageNumber }) => {
  const file = fs.readdirSync(`${filePath}/Sent/`)
    .filter((f) => f.endsWith(`A.${pageNumber}.pdf`))[0];
  const fullFilePath = `${filePath}/Sent/${file}`;

  request({
    method: 'POST',
    url: 'https://slack.com/api/files.upload',
    formData: Object.assign(
      {},
      { file: fs.createReadStream(fullFilePath) },
      config.slack_settings)
  }).then((res) => {
    const parsedRes = JSON.parse(res);
    event.sender.send('send-slack-res', { pageNumber, success: parsedRes.ok });
  });
});
