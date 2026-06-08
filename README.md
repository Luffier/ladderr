<p align="center">
  <img src="https://i.imgur.com/56zhYu9.png" width="350px" style="border: 1px solid black">
</p>

# ladderr
Access your remote files directly from qBittorrent Web UI, just like in the desktop app.

Current version: [v0.6](#Recent-changes)

💥 You will need to re-install the latest [`ladderr.reg`](https://github.com/Luffier/ladderr/blob/master/windows/ladderr.reg) if you had a version prior to v0.5.4 💥

⚠️ The script is enabled on all pages by default. See [section below](#security-concerns) if you want to change this ⚠️

⚠️ There's a bug in Windows 11 that keeps explorer.exe processes open even after closing their respective window, if you never restart your machine you may be filling your RAM inadvertently. This issue was fixed in the 24H2 update (see [related issue](https://github.com/Luffier/ladderr/issues/17)) ⚠️

## How does it work?

By leveraging protocol handlers, a File Explorer window can be opened directly
to a specified network path.

After mapping your remote and local path in the script settings, Ladderr can create a
protocol link pointing to your local files (by using information that's already available
in the Web UI). When opening a file or folder (by using the `Open destination folder`,
`Open` or `Open containing folder` menu items or by double-clicking the file or folder
in the `Content` tab), the protocol is invoked and an inline Powershell script is executed
to parse and open the target path.

The files in this repo:
- ladderr.user.js: the userscript itself
- ladderr.reg: the custom protocol handlers `ladderr-open:` and `ladderr-select:` for Windows
- linux/ladderr-handler.sh: Linux custom protocol handler script
- linux/install.sh: installs the protocol script and desktop entry
- linux/uninstall.sh: reverts the install script changes
- uninstall-ladderr.reg: removes the protocol handlers from the registry
- urlparser.ps1: Powershell script describing the one-line code that is executed when the protocols are invoked

To learn more about protocol handlers, you can read [MS-URI-Handlers](https://github.com/amartinsec/MS-URI-Handlers).

## How to install

- Install the custom protocol handlers:
  - For Windows: download and double-click [`ladderr.reg`](https://github.com/Luffier/ladderr/blob/master/windows/ladderr.reg) (can be easily removed with [`uninstall-ladderr.reg`](https://github.com/Luffier/ladderr/blob/master/windows/uninstall-ladderr.reg)).
  - For Linux: download the `ladderr-handler.sh` and `install.sh` ([linux dir](https://github.com/Luffier/ladderr/blob/master/linux/)) and execute the installer (can be easily removed with `uninstall.sh`).
- Install the userscript from [greasyfork](https://greasyfork.org/scripts/479135-ladderr), [openuserjs](https://openuserjs.org/scripts/luffier/Ladderr) or directly from the [repo](https://github.com/Luffier/ladderr/blob/master/ladderr.user.js).
- Configure the root path mapping in the settings menu (see section below).

### Path mapping

We need to map your qBittorrent remote paths to your local paths.
This can be done by going to the `Tools` navbar menu and clicking `Ladderr Options`.

<p align="center">
  <img src="https://i.imgur.com/5mCUqHI.png" width="500px" style="border: 1px solid black">
</p>

Each mapping pairs a **remote path** (a root folder you configured under
`Default Save Path` in `Options\Downloads\Saving Management`) with its **local path**
equivalent on your machine. When opening a file or folder, Ladderr translates the
torrent's save path using the **first mapping whose remote path matches** — so order
matters: put more specific paths above broader ones. Use `+ Add mapping` to add rows
and the `↑`/`↓` buttons to set their priority. If no mapping matches, nothing is opened.

<p align="center">
  <img src="https://i.imgur.com/8j3lf3g.png" width="500px" style="border: 1px solid black">
</p>

A single mapping is enough if all your downloads live under one root:
- *Default Save Path*: `/data/distros`
- **Remote path**: `/distros/`
- **Local path**: `D:\`

Add more mappings when your downloads are spread across multiple locations:
- `/data/downloads/distros` → `Z:\media\distros`
- `/data/downloads/centos` → `Y:\archive\centos`

Local paths can also point at an NFS\SMB\Samba server, e.g.:
- **Remote path**: `/downloads`
- **Local path**: `\\server_name_or_ip\very\long\path\downloads`

### Support in Linux

For the script to work, you'll need `xdg-utils` and `desktop-file-utils`,
which should be already installed with most popular DE.

The installer script copies the handler (`ladder-handler.sh`) and creates a
`.desktop` entry that registers the `ladderr-open:` and `ladderr-select:` schemes.
These files go to their respective dirs in the XDG data home folder (under
`~/.local/share`). You can remove them and revert the process with `./uninstall.sh`.

The handler uses `xdg-open` to open files/folders and the freedesktop
`org.freedesktop.FileManager1` D-Bus interface to open a folder with the file
preselected (if it's unavailable, it simply opens the containing folder).

## Limitations
- In Chromium-based browsers, and when using HTTP, it will ask for permission when opening a new file/folder.
For a more seamless experience, use HTTPS. If your server is local, look up self-signed certs with mkcert,
or use this [solution](https://www.youtube.com/watch?v=qlcVx-k-02E).

## Security concerns

Since everyone's Web UI will have a different URL, **the script is active on all pages by default**.
There's a check to detect when the page is a qBittorrent Web UI but to be safe you should change this.

For Tapermonkey:

1. Go to your `Dashboard`.
2. Hover over the Ladderr entry and click the `Edit` button in the rightmost column.
3. Go to the `Settings` tab (left side below the Ladderr logo).
4. Deselect `Original matches` in the `Includes/Excludes` section.
5. Add your qBittorrent Web UI URL by clicking `Add...` below the `User matches` box.

For Violentmonkey:

1. Go to your `Dashboard` (⚙️ icon).
2. Hover over the Ladderr entry and click the `Edit` button (`</>` icon).
3. Go to the `Settings` tab.
4. Deselect `Keep original` under `@match rules`.
5. Add your qBittorrent Web UI URL in the adjacent text box.

Alternatively, if your extension doesn't allow this, you can do it manually:

1. Remove the following lines: `// @match https://*/` and `// @match http://*/ `.
2. Add your custom URL. For example: `// @match https://192.168.1.100:8080/` or `// @match http://myserver.local/`.

Unfortunately, if done manually, you'll have to redo this with each update.

## Recent changes

#### Version 0.6
- Linux support.
- Added support for multiple path mappings.
- Fix for qBittorrent 5.2 Web UI changes.
- Fix "Open destination folder" behaviour.
- _Technical_: Improve page rediness detection (previously, the script would fail to load 10% of the time!).
- _Technical_: Improved dangerous file extension check (fix for uppercase extensions).
- _Technical_: Improved how settings keys are named (fix for edge cases).
- _Technical_: Added automatic settings migration.


#### Version 0.5
- Fix RCE vulnerability.
- Add unicode support and fix issue with whitespaces.
- 0.5.1: Fix for paths with depth (relative to the base path).
- 0.5.2: Fix for paths containing commas.
- 0.5.3: Fix for certain unicode characters.
- 0.5.4: Fix for paths longer than 259 characters.
- 0.5.5: Fix for Chromium browsers when opening a file/folder for the first time.
- 0.5.6: Fix for qBittorrent 5.0 Web UI changes.
- 0.5.7: Added ability to open parent folders of uninitialized files and folders.
- 0.5.8: Added ability to open files and folders directly from the torrent list by double-clicking (see the settings menu).
- 0.5.9: Added confirmation prompt for opening potentially harmful files. File extensions are configurable. 

#### Version 0.4
- Powershell popup window no longer appears.
- New browser window/tab closes itself immediately after opening a file/folder.
- Removed dependency from Python by replacing it with Powershell.

#### Version 0.3
- Added ability to open files and folders by double-clicking (in the `Content` tab).

#### Version 0.2
- Added `Open` and `Open containing folder` in the `Content` tab.
- _Technical_: splitted URI protocol into `ladderr-open:` and `ladderr-select:` to allow opening files directly. 
