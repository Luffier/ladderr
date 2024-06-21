// ==UserScript==
// @name         Ladderr
// @version      0.5.4
// @description  Access your remote files directly from qBittorrent Web UI, just like in the desktop app.
// @author       luffier
// @namespace    ladderr
// @license      MIT
// @copyright    2023, luffier (https://github.com/Luffier)
// @match        https://*/
// @match        http://*/
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAkFBMVEUAAAAxxP4xw/4wxP4uw/8xxP4ww/4xw/4py/8xxP4ww/4zxP4xxP8wxP4wxP4wxP4wxP4wxP4wxP4wxP4wxP4wxP8vw/8yw/8wxP4xxP4wxP4wxP8wxP4wxP4ww/4xxP4wxP4xxP8xwv8ws/8xxv8xxP8xxP8vxP4xxf4xxv4vxP4wxf4yw/8vx/8wwv4xxP/uOx+5AAAAL3RSTlMA65pkPIzXtQbJeicZxvn18d3PubCDUArl2r6ooJRuamBCHQUSwHZbWEhGNTMgFcZCVYAAAAD3SURBVDjLZZPZkoIwEACDCKtgkEM5VARl76v//+/2ZYXMpN+6qqkiyYx5MJCbmZij0Rwp0hnLxQsuCE5ecMImMxWdFxQki4zsvSBjXOQGv0ayg9tiKXyr4AuKeKaDWgU1bB0yriq4ErhaEqkgYuvqgbMKzhxc7bEqsJSRg6VVQYsim4zLBOHOoYa7CH5g7fpduVmrL6aMdxG8wVoQ8CqCBI9eBD1xKLDyXvybiyiNvnv9NsIDBu91G0cbyANBDqkRE/TyJKjEhJlPeDaSPaNjoT/FHYlYq9jfk5VYq3alKKicoAKf2Iht3rg0m2YgF78cGsXH/8H+ALCrJ8qsl2pUAAAAAElFTkSuQmCC
// @grant        GM.getValue
// @grant        GM.setValue
// @run-at       document-end
// @sandbox      raw
// @homepageURL  https://github.com/Luffier/ladderr
// @supportURL   https://github.com/Luffier/ladderr/issues
// ==/UserScript==

/* jshint esversion: 8 */

(() => {
    'use strict';

    /* VARIABLES */

    // Global styles
    const style = `
    <style>
        #ladderrSettingsMenu {
            font-family: 'proxima nova', 'Helvetica', 'Arial', 'sans-serif';
            position: absolute;
            z-index: 9999;
            top: 100px;
            width: 300px;
            height: 144px;
            left: 200px;
            background-color: white;
            font-size: 12px;
            color: black;
            box-shadow: rgba(0, 0, 0, 1) 1px 0 6px;
            border-radius: 10px;
        }
        #ladderrSettingsMenu .header {
            background-color: rgb(217, 217, 217);
            border-bottom: 1px solid #ebebeb;
            padding: 15px 0 10px 0;
            font-size: 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        #ladderrSettingsMenu .variable {
            margin: 8px 8px 8px 12px;
            display: flex;
        }
        #ladderrSettingsMenu .variable span {
            width: 90px;
            font-weight: bold;
        }
        #ladderrSettingsMenu .variable input[type="text"] {
            flex-grow: 1;
            border: 2px inset black;
        }
        #ladderrSettingsMenu .footer {
            display: flex;
            justify-content: center;
        }
        #ladderrSettingsMenu .footer button {
            background-color: rgb(240, 240, 240);
            margin: 0px 10px;
            cursor: pointer;
        }
    </style>
    `;

    // Helper for whenPageReady function
    const Ladderr = {
        url: location.protocol + location.hostname + location.port,
        basePathLocal: null,
        basePathRemote: null,
        pageTimeout: true,
        pageTimer: null,
        panelCollapsed: null,
        panelTabSelected: null,
    }

    /* FUNCTIONS */

    // Single element selector shorthand
    const $ = document.querySelector.bind(document);

    // Multiple elements selector shorthand
    const $$ = document.querySelectorAll.bind(document);

    // Create element
    function createElement(html) {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content.firstChild;
    }

    // Function to replicate the `on` function in jQuery
    function addEventListener(el, eventName, eventHandler, selector) {
        if (selector) {
            const wrappedHandler = (e) => {
                if (e.target && e.target.matches(selector)) {
                    eventHandler(e);
                }
            };
            el.addEventListener(eventName, wrappedHandler);
            return wrappedHandler;
        } else {
            el.addEventListener(eventName, eventHandler);
            return eventHandler;
        }
    }

    // Encode string to Base64 UTF-8
    function toBase64String(str) {
        return btoa(unescape(encodeURIComponent(str)));
    }

    // Checks if the current page is a qBittorrent Web UI page
    function isCurrentPageValid() {
        const appNameElement = document.getElementsByName('application-name');
        if (appNameElement.length > 0) {
            return appNameElement[0].getAttribute('content') === 'qBittorrent';
        }
        return false;
    }

    // Executes the callback after the page finishes loading
    function whenPageReady(callback, intervalTime, maxWaitTime = 2500) {
        Ladderr.pageTimer = Date.now();
        console.debug('[Ladderr] Waiting for page to load');
        const observerCallback = (mutations, observer) => {
            if (Ladderr.pageTimeout) {
                clearTimeout(Ladderr.pageTimeout);
                Ladderr.pageTimeout = setTimeout(() => {
                    clearTimeout(Ladderr.pageTimeout);
                    Ladderr.pageTimeout = null;
                    observer.disconnect();
                    if (isCurrentPageValid()) {
                        console.debug(`[Ladderr] Page ready in ${Date.now() - Ladderr.pageTimer}ms!`);
                        callback();
                    } else {
                        console.debug(`[Ladderr] Page is not a qBittorrent Web UI`);
                    }
                }, intervalTime)
            } else {
                observer.disconnect();
            }
        };
        const observer = new MutationObserver(observerCallback);
        observer.observe($('body'), {
            attributes: true,
            childList: true,
            subtree: true
        });
    }

    // Create menu items for the different context menus
    function createContextMenuItems() {
        // Torrents queue list ("Open destination folder" context menu item)
        const queueMenuItem = $('#queueingMenuItems');
        const openDestinationMenutItem = createElement(`
        <li>
            <a><img src="images/directory.svg" alt="Open destination folder">
                <span>Open destination folder</span>
            </a>
        </li>
        `);
        addEventListener(openDestinationMenutItem, 'click', openDestinationFolder);
        queueMenuItem.after(openDestinationMenutItem);

        // Torrent files ("Open" context menu item)
        const torrentFilesMenu = $('#torrentFilesMenu');
        const openMenuItem = createElement(`
        <li>
            <a><img src="images/folder-documents.svg" alt="Open"> Open</a>
        </li>
        `);
        addEventListener(openMenuItem, 'click', openFile);
        torrentFilesMenu.append(openMenuItem);

        // Torrent files ("Open containing folder" context menu item)
        const openContainingMenuItem = createElement(`
        <li>
            <a><img src="images/directory.svg" alt="Open containing folder"> Open containing folder</a>
        </li>
        `);
        addEventListener(openContainingMenuItem, 'click', openContainingFolder);
        torrentFilesMenu.append(openContainingMenuItem);
    }

    // Save Ladderr settings to localStorage
    async function saveSettings() {
        const basePathRemote = $('#ladderrSettingsMenu_pathRemote').value;
        const basePathLocal = $('#ladderrSettingsMenu_pathLocal').value;
        await GM.setValue(Ladderr.url + 'pathRemote', basePathRemote);
        await GM.setValue(Ladderr.url + 'pathLocal', basePathLocal);
        Ladderr.basePathRemote = basePathRemote;
        Ladderr.basePathLocal = basePathLocal;
    }

    // Load Ladderr settings from localStorage
    async function loadSettings() {
        const basePathRemote = await GM.getValue(Ladderr.url + 'pathRemote', Ladderr.basePathRemote);
        const basePathLocal = await GM.getValue(Ladderr.url + 'pathLocal', Ladderr.basePathLocal);
        $('#ladderrSettingsMenu_pathRemote').value = basePathRemote;
        $('#ladderrSettingsMenu_pathLocal').value = basePathLocal;
        Ladderr.basePathRemote = basePathRemote;
        Ladderr.basePathLocal = basePathLocal;
    }

    // Create Ladderr settings menu
    function createSettingsMenu() {
        // Settings menu
        const ladderrSettingsMenu = createElement(`
            <div id="ladderrSettingsMenu">
                <div class="header">Ladderr Settings Menu</div>
                <div class="variable">
                    <span>· Remote path:</span><input type="text" id="ladderrSettingsMenu_pathRemote" size="10" />
                </div>
                <div class="variable">
                    <span>· Local path:</span><input type="text" id="ladderrSettingsMenu_pathLocal" size="10" />
                </div>
                <div class="footer">
                    <button id="ladderrSettingsMenu_saveBtn" title="Save settings" class="saveclose_buttons">Save</button>
                    <button id="ladderrSettingsMenu_closeBtn" title="Close window" class="saveclose_buttons">Close</button>
                </div>
            </div>
        `);
        $('#desktop').append(ladderrSettingsMenu);
        ladderrSettingsMenu.style.display = 'none';

        addEventListener($('#ladderrSettingsMenu_saveBtn'), 'click', function() {
            saveSettings();
            $('#ladderrSettingsMenu').style.display = 'none';
        });
        addEventListener($('#ladderrSettingsMenu_closeBtn'), 'click', function() {
            $('#ladderrSettingsMenu').style.display = 'none';
        });

        // Open settings context menu item
        const ladderrSettingsIcon = createElement(`
            <li>
                <a id="ladderrOptions">
                    <img class="MyMenuIcon" src="images/configure.svg" alt="Ladderr Options" width="16" height="16" style="filter: hue-rotate(180deg);">Ladderr Options
                </a>
            </li>
        `);
        $('#preferencesLink').parentNode.after(ladderrSettingsIcon);
        addEventListener(ladderrSettingsIcon, 'click', function() {
            loadSettings();
            $('#ladderrSettingsMenu').style.display = 'block';
        });
    }

    // Get the remote path of the selected torrent
    function getTorrentRemotePath() {
        if (Ladderr.basePathRemote == null || Ladderr.basePathLocal == null) {
            console.log('[Ladderr] Please configure your local and remote paths');
            return;
        }

        // Get 'Save path' column index
        const torrentTable = $('#torrentsTableDiv table');
        const torrentTableHeader = torrentTable.querySelector('thead tr');
        const torrentTableHeaders = Array.from(torrentTableHeader.children);
        const doneHeader = torrentTableHeader.querySelector('th[title="Done"]');
        const doneHeaderIndex = torrentTableHeaders.indexOf(doneHeader);

        // Get torrent remote path
        const torrent = torrentTable.querySelector('tbody tr.selected');
        const done = torrent.querySelector(`td:nth-child(${doneHeaderIndex + 1}) div div`).textContent;
        if (done == '0.0%') {
            return null;
        }
        const pathHeader = torrentTableHeader.querySelector('th[title="Save path"]');
        const pathHeaderIndex = torrentTableHeaders.indexOf(pathHeader);
        return torrent.querySelector(`td:nth-child(${pathHeaderIndex + 1})`).textContent;
    }

    function openUriLink(fromFileList=false, action=null) {
        const pathRemote = getTorrentRemotePath();
        if (!pathRemote) {
            console.log('[Ladderr] Can\'t open folder or file for not initialized torrents');
            return;
        }

        // Get torrent filename
        const pathParts = [];
        let previousLevel = null;
        let fileIndex = null;
        let fileRow = null;
        let isRowFolder = null;
        while (fileIndex != 0) {
            if (fileRow == null) {
                fileRow = $('#torrentFilesTableDiv table tbody tr.selected');
                if (fromFileList === false) {
                    fileRow = $('#torrentFilesTableDiv table tbody tr[data-row-id="0"]');
                }
            } else {
                fileRow = fileRow.previousSibling;
            }
            fileIndex = fileRow.getAttribute('data-row-id');
            const fileName = fileRow.querySelector('span[id^="filesTablefileName"]');
            isRowFolder = (fileRow.querySelector('.filesTableCollapseIcon') != null);
            if (isRowFolder) {
                const rowCollapseIcon = fileRow.querySelector('.filesTableCollapseIcon');
                let folderLevel = getComputedStyle(rowCollapseIcon).marginLeft;
                folderLevel = parseInt(folderLevel.substring(0, folderLevel.length - 2));
                if (folderLevel < previousLevel || previousLevel == null) {
                    previousLevel = folderLevel;
                    pathParts.push(fileName.textContent);
                }
            } else if (pathParts.length === 0) {
                let folderLevel = getComputedStyle(fileName).marginLeft;
                folderLevel = parseInt(folderLevel.substring(0, folderLevel.length - 2)) - 39;
                previousLevel = folderLevel;
                pathParts.push(fileName.textContent);
            }
        }
        const fileNamePath = pathParts.reverse().join('\\');


        const pathLocal = pathRemote
            .replace(Ladderr.basePathRemote, Ladderr.basePathLocal)
            .replaceAll('/', '\\');

        let protocol = '';
        if (action === 'open') {
            protocol = 'ladderr-open:';
        } else if (action === 'select') {
            protocol = 'ladderr-select:';
        } else {
            if (fromFileList === false && isRowFolder) {
                protocol = 'ladderr-open:';
            } else {
                protocol = 'ladderr-select:';
            }
        }

        const remotePath = `${pathLocal}\\${fileNamePath}`;
        const encodedRemotePath = toBase64String(remotePath)
        const uri = `${protocol}${encodedRemotePath}`;

        console.debug('[Ladderr] Remote path: ', remotePath);
        console.debug('[Ladderr] URI created: ', uri);

        const opener = window.open(uri);
        opener.close();
    }

    function openContainingFolder() {
        openUriLink(true, 'select');
    }

    function openFile() {
        openUriLink(true, 'open');
    }

    function openDestinationFolder() {
        const panel = $('#propertiesPanel_wrapper');
        Ladderr.panelTabSelected = $('#propertiesTabs li.selected').id;
        Ladderr.panelCollapsed = panel.classList.contains('collapsed');
        if (Ladderr.panelCollapsed || Ladderr.panelTabSelected != 'PropFilesLink') {
            const filesTableObserver = new MutationObserver((mutations, observer) => {
                if ($('#filesTablefileName0')) {
                    observer.disconnect();
                    openUriLink(false, null);
                    $(`#${Ladderr.panelTabSelected}`).click();
                    if ($('#propertiesPanel_wrapper').classList.contains('expanded') && Ladderr.panelCollapsed) {
                        $('#propertiesPanel_collapseToggle').click();
                    }
                }
            });
            filesTableObserver.observe($('#torrentFilesTableDiv table tbody'), { childList: true });

            if (!panel.classList.contains('expanded')) {
                $('#propertiesPanel_collapseToggle').click();
            }
            if ($('#propertiesTabs li.selected').id != 'PropFilesLink'){
                $('#PropFilesLink').click();
            }
        } else {
            openUriLink(false, null);
        }
    }

    function createDoubleClickEvent() {
        addEventListener($('#torrentFilesTableDiv table'), 'dblclick', (e) => {
            const torrentFilesTable = $('#torrentFilesTableDiv table');
            let element = e.target;
            while (element) {
                if (element === torrentFilesTable) {
                    openFile();
                }
                element = element.parentNode;
            }
        });
    }

    function processPage() {
        createContextMenuItems();
        createSettingsMenu();
        createDoubleClickEvent();
        loadSettings();
    }

    whenPageReady(() => {
        $('head').append(createElement(style));
        processPage();
    }, 250);

})();
