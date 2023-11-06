<p align="center">
  <img src="https://i.imgur.com/56zhYu9.png" width="350px">
</p>

# ladderr
Access your remote files directly from qBittorrent Web UI, just like in the desktop app.

## How does it work?

Basically, by leveraging protocol handlers, we can open a File Explorer window directly
to your network drive, exactly mimicking the desktop behavior.

After mapping your remote and local path in the script settings, Ladderr can 
create a protocol link pointing to your local files (by using the information already 
available in the Web UI). When the `Open destination folder` link is clicked, the
protocol is invoked, and a console window (which opens and closes rapidly) executes
a Python script that parses the path and opens it.

The files in this repo:
- ladderr.js: the userscript itself
- ladderr.reg: the custom protocol handler `ladderr:`
- uninstall-ladderr.reg: removes the `ladderr:` protocol handler
- urlparser.py: Python script describing the one-line code that is executed when the protocol is invoked

To learn more about protocol handlers, you can read [MS-URI-Handlers](https://github.com/amartinsec/MS-URI-Handlers).

## How to use

- Install [Python 3](https://www.python.org/downloads/) (make sure to check `Add python.exe to PATH` during installation. Afterwards, you'll have to restart your session or PC).
- Install the custom protocol handler by double clicking `ladderr.reg` (can be easily removed with `uninstall-ladderr.reg`).
- Install the userscript from [openuserjs](https://openuserjs.org/scripts/luffier/Ladderr), [greasyfork](https://greasyfork.org/scripts/479135-ladderr) or directly from this repo.
- Configure the root path mapping in the script settings menu (see section below).

### Path mapping

We need to map your qBittorrent remote root path to your local network root path. 
This can be done by going to the `Tools` navbar menu and clicking `Ladderr Options`.

The remote path should be the root folder that you configured 
in `Default Save Path` (`Options\Downloads\Saving Management`) and your local root
path the equivalent in your local machine.

For example, if you have a network location:
- *Default Save Path*: `/data/downloads`
- **Remote root server path**: `/data/`
- **Local root path**: `D:\`

And if you have an NFS\SMB\Samba server:
- *Default Save Path*: `/downloads`
- **Remote root server path**: `/downloads`
- **Local root path**: `\\server_name_or_ip\very\long\path\downloads`

## What's next

- Add `Open` and `Open containing folder` for the `Content` tab.
- Fix problems with torrents containing whitespaces or non-ASCII characters
- Drop Python dependency (I don't know if it's possible, in theory, VB could be used; any help would be appreciated)
- Linux support (low priority as I don't use it daily; any help would be appreciated)

## Limitations

- If your Web UI uses HTTP, it will open a new tab and ask for permission. For a more seamless experience, use HTTPS (if your server is local, look up self-signed certs with mkcert)
- Only works in Windows.
- File paths containing whitespaces or non-ASCII characters may not work

## Security concerns

Since everyone's Web UI will have a different URL, the script is active by default on all pages,
but it will only do its thing when it detects that the page is indeed a qBittorrent Web UI. You can always change this in the script metadata block: 

Remove the following lines: `// @match https://*/` and `// @match http://*/ `.

And add your URL, for example: `// @match https://192.168.1.100:8080/` or `// @match http://myserver.local/`.
