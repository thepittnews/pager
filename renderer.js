const { ipcRenderer, remote } = require('electron');
const { dialog } = remote;

window.pager = {
  sentDirectory: ''
};

$(document).ready(() => {
  $('button#btn-date').on('click', (e) => {
    e.preventDefault();

    dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    .then(({ filePaths }) => {
      window.pager.sentDirectory = `${filePaths[0]}/Sent`;
      $('h3#edition').text(filePaths[0].split("/").slice(-1)[0]);
    });
  });

  $('button#btn-merge').on('click', (e) => {
    e.preventDefault();

    ipcRenderer.on('merge-pages-res', (event, { success }) => {
      alert(`${success ? 'SUCCESS' : 'FAIL'}: Merge pages`);
    });

    ipcRenderer.send('merge-pages', { sentDirectory: window.pager.sentDirectory });
  });

  $('button#btn-pg').on('click', (e) => {
    e.preventDefault();

    if ($('input#pageNumber').val().length == 0) {
      alert('Need to enter a page number');
      return e.preventDefault();
    }

    const pageNumber = $('input#pageNumber').val();

    if (!confirm(`Send page ${pageNumber}`)) return;

    ipcRenderer.on('send-pg-res', (event, { pageNumber, success }) => {
      alert(`${success ? 'SUCCESS' : 'FAIL'}: ${pageNumber} to PG`);

      if (success) {
        $('input#pageNumber').val('');
      }
    });

    ipcRenderer.send('send-pg', {
      pageNumber,
      sentDirectory: window.pager.sentDirectory,
    });
  });

  $('button#btn-slack').on('click', (e) => {
    e.preventDefault();

    if ($('input#pageNumber').val().length == 0) {
      alert('Need to enter a page number');
      return e.preventDefault();
    }

    ipcRenderer.on('send-slack-res', (event, { pageNumber, success }) => {
      alert(`${success ? 'SUCCESS' : 'FAIL'}: ${pageNumber} to SLACK`);

      if (success) {
        $('input#pageNumber').val('');
      }
    });

    ipcRenderer.send('send-slack', {
      pageNumber: $('input#pageNumber').val(),
      sentDirectory: window.pager.sentDirectory
    });
  });
});
