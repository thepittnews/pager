const { remote } = require('electron');
const { dialog } = remote;

window.pager = {
  filePaths: []
};

$(document).ready(() => {
  $('button#btn-date').on('click', (e) => {
    e.preventDefault();

    dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    .then(({ filePaths }) => {
      window.pager.filePaths = filePaths;
      $('h3#edition').text(filePaths[0].split("/").slice(-1)[0]);
    });
  });
});
