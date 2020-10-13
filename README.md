# pager

Pager is responsible for sending pages to be checked, as well as final pages to the printer.

### Architecture

Pager is built as an Electron app. The only external dependency is
`pdftk` which handles PDF manipulation. Use [this link](https://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/pdftk_server-2.02-mac_osx-10.11-setup.pkg) to download for most Mac computers.

### Configuration

Create a `config.json` file with the following structure:

```json
{
  "ftp_settings": {
    "host": "",
    "user": "",
    "password": ""
  },
  "slack_settings": {
    "channels": "",
    "token": ""
  }
}

```

### Distribution

Run `node packager.js` to create a packaged Mac application.
