<p align="center">
  <img src="https://i.imgur.com/56zhYu9.png" width="350px" style="border: 1px solid black">
</p>

# ladderr
Access your remote files directly from qBittorrent Web UI, just like in the desktop app.

## How does it work?

Basically, by leveraging protocol handlers, we can open a File Explorer window directly
to your network drive, exactly mimicking the desktop behavior.

After mapping your remote and local path in the script settings, Ladderr can create a
protocol link pointing to your local files (by using the information already available
in the Web UI). When opening a file or folder (by using the `Open destination folder`,
`Open` or `Open containing folder` menu items or by double-clicking the file or folder 
in the `Content` tab), the protocol is invoked, and a console window (which opens
and closes rapidly) executes a Python script that parses the path and opens it.

The files in this repo:
- ladderr.js: the userscript itself
- ladderr.reg: the custom protocol handlers `ladderr-open:` and `ladderr-select:`
- uninstall-ladderr.reg: removes the protocol handlers from the registry
- urlparser.py: Python script describing the one-line code that is executed when the protocols are invoked

To learn more about protocol handlers, you can read [MS-URI-Handlers](https://github.com/amartinsec/MS-URI-Handlers).

## How to use

- Install [Python 3](https://www.python.org/downloads/) (make sure to check `Add python.exe to PATH` during installation. Afterwards, you'll have to restart your session or PC).
- Install the custom protocol handlers by double-clicking `ladderr.reg` (can be easily removed with `uninstall-ladderr.reg`).
- Install the userscript from [greasyfork](https://greasyfork.org/scripts/479135-ladderr), [openuserjs](https://openuserjs.org/scripts/luffier/Ladderr) or directly from the [repo](https://github.com/Luffier/ladderr).
- Configure the root path mapping in the script settings menu (see section below).

### Path mapping

We need to map your qBittorrent remote root path to your local network root path. 
This can be done by going to the `Tools` navbar menu and clicking `Ladderr Options`.

<p align="center">
  <img src="https://i.imgur.com/QieOGul.png" width="250px" style="border: 1px solid black">
</p>

The remote path should be the root folder that you configured 
in `Default Save Path` (`Options\Downloads\Saving Management`) and your local root
path the equivalent in your local machine.

<p align="center">
  <img src="https://i.imgur.com/ZjmngnB.png" width="250px" style="border: 1px solid black">
</p>


For example, if you have a network location:
- *Default Save Path*: `/data/downloads`
- **Remote root server path**: `/data/`
- **Local root path**: `D:\`

And if you have an NFS\SMB\Samba server:
- *Default Save Path*: `/downloads`
- **Remote root server path**: `/downloads`
- **Local root path**: `\\server_name_or_ip\very\long\path\downloads`

## What's next

- Fix problems with torrents containing whitespaces or non-ASCII characters.
- Drop Python dependency (I don't know if it's possible, in theory, VB could be used; any help would be appreciated).
- Linux support (any help would be appreciated).

## Limitations

- Only works in Windows.
- If your Web UI uses HTTP, it will open a new tab and ask for permission. **For a more seamless experience, use HTTPS** (if your server is local, look up self-signed certs with mkcert).
- File paths containing whitespaces or non-ASCII characters may not work.

## Security concerns

Since everyone's Web UI will have a different URL, **the script is active by default on all pages**,
but it will only do its thing when it detects that the page is indeed a qBittorrent Web UI. You can always change this in the script metadata block: 

Remove the following lines: `// @match https://*/` and `// @match http://*/ `.

And add your URL, for example: `// @match https://192.168.1.100:8080/` or `// @match http://myserver.local/`.

Unfortunately, you'll have to do this with each update.

## Changelog

#### Version 0.3
- Added hability to open files and folders by double-clicking (in the `Content` tab).

#### Version 0.2
- Added `Open` and `Open containing folder` in the `Content` tab.
- _Technical_: splitted URI protocol into two `ladderr-open:` and `ladderr-select:` to allow opening files directly. **If you installed v0.1, you need to reinstall `ladderr.reg`.**

#### Version 0.1
- Initial version.
