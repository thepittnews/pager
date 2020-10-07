const { ipcRenderer, remote } = require('electron');
const { dialog } = remote;

window.pager = {
  filePath: ''
};

$(document).ready(() => {
  $('button#btn-date').on('click', (e) => {
    e.preventDefault();

    dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    .then(({ filePaths }) => {
      window.pager.filePath = filePaths[0];
      $('h3#edition').text(filePaths[0].split("/").slice(-1)[0]);
    });
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
      filePath: window.pager.filePath,
      pageNumber
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
      filePath: window.pager.filePath,
      pageNumber: $('input#pageNumber').val()
    });
  });
});
