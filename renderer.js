const { ipcRenderer, remote } = require('electron');
const { dialog } = remote;

window.pager = { sentDirectory: '' };

ipcRenderer.on('merge-pages-res', (event, { success }) => {
  alert(`${success ? 'SUCCESS' : 'FAIL'}: Merge pages`);
});

ipcRenderer.on('send-page-res', (event, { method, pageNumber, success }) => {
  alert(`${success ? 'SUCCESS' : 'FAIL'}: ${pageNumber} to ${method.toUpperCase()}`);
  if (success) $('input#pageNumber').val('');
});

$(document).ready(() => {
  $('button#btn-date').on('click', (e) => {
    e.preventDefault();

    dialog.showOpenDialog({ properties: ['openDirectory'] })
    .then(({ filePaths }) => {
      window.pager.sentDirectory = `${filePaths[0]}/Sent`;
      $('h3#edition').text(filePaths[0].split("/").slice(-1)[0]);
    });
  });

  $('button#btn-merge').on('click', (e) => {
    e.preventDefault();
    ipcRenderer.send('merge-pages', { sentDirectory: window.pager.sentDirectory });
  });

  $('button.btn-send').on('click', (e) => {
    e.preventDefault();
    const { method } = e.target.dataset;
    const pageNumber = $('input#pageNumber').val();

    if (pageNumber.length == 0) return alert('Need to enter a page number');
    if (method === 'pg' && !confirm(`Send page ${pageNumber}`)) return;

    ipcRenderer.send('send-page', {
      method,
      pageNumber,
      sentDirectory: window.pager.sentDirectory
    });
  });
});
