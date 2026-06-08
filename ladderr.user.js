// ==UserScript==
// @name         Ladderr
// @version      0.6
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
// @grant        GM.deleteValue
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
            --ladderr-actions-w: 84px;
            position: absolute;
            z-index: 9999;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            width: 520px;
            max-width: calc(100vw - 40px);
            color: var(--color-text-default);
            background-color: var(--color-background-popup);
            border: 1px solid var(--color-border-default);
            border-radius: 3px;
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
        }
        #ladderrSettingsMenu * {
            box-sizing: border-box;
        }
        #ladderrSettingsMenu .header {
            padding: 8px 12px;
            font-weight: bold;
            background-color: var(--color-background-default);
            border-bottom: 1px solid var(--color-border-default);
        }
        #ladderrSettingsMenu .main {
            padding: 10px 12px;
        }
        #ladderrSettingsMenu fieldset.settings {
            margin: 0 0 10px;
        }
        #ladderrSettingsMenu fieldset.settings:last-child {
            margin-bottom: 0;
        }
        #ladderrSettingsMenu .mappings-header,
        #ladderrSettingsMenu .mapping-row {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) var(--ladderr-actions-w);
            gap: 6px;
            align-items: center;
            margin-bottom: 5px;
        }
        #ladderrSettingsMenu .mappings-header {
            font-weight: bold;
            padding: 0 2px 2px;
        }
        #ladderrSettingsMenu .mapping-row input[type="text"],
        #ladderrSettingsMenu .field input[type="text"] {
            width: 100%;
        }
        #ladderrSettingsMenu .mapping-actions {
            display: flex;
            gap: 3px;
        }
        #ladderrSettingsMenu .mapping-actions button {
            padding: 2px 6px;
        }
        #ladderrSettingsMenu_addMapping {
            margin-top: 2px;
        }
        #ladderrSettingsMenu .option {
            padding: 2px 0;
        }
        #ladderrSettingsMenu .field {
            margin-top: 8px;
        }
        #ladderrSettingsMenu .field label {
            display: block;
            margin-bottom: 3px;
        }
        #ladderrSettingsMenu .footer {
            padding: 8px 12px;
            text-align: right;
            border-top: 1px solid var(--color-border-default);
        }
        #ladderrSettingsMenu .footer button {
            margin-left: 8px;
        }
    </style>
    `;

    // Helper for whenPageReady function
    const Ladderr = {
        url: location.origin,
        // Path separator for the OS the browser (and thus the protocol handler) runs on.
        sep: /win/i.test(navigator.userAgentData?.platform || navigator.platform || '') ? '\\' : '/',
        pathMappings: [],
        dClickOpen: null,
        pageTimer: null,
        panelCollapsed: null,
        panelTabSelected: null,
        warnDangerousFiles: true,
        dangerousExtensions: '.exe,.com,.cmd,.bat,.pif,.scr,.vbs,.js,.wsf,.wsh,.hta,.cpl,.dll,.msi,.msp,.cab,.ps1,.py,.reg,.inf,.url,.vbe,.jse,.lnk,.scf,.application,.gadget,.appref-ms,.shb,.shs'
    }

    /* FUNCTIONS */

    // Get setting storage key from setting name
    const settingKey = (name) => `${Ladderr.url}_${name}`;

    // Single element selector shorthand
    const $ = document.querySelector.bind(document);

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
            el.addEventListener(eventName, wrappedHandler, true);
            return wrappedHandler;
        } else {
            el.addEventListener(eventName, eventHandler, true);
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

    // Executes the callback once the elements the script depends on are ready.
    function whenPageReady(callback, timeout) {
        if (!isCurrentPageValid()) {
            console.debug('[Ladderr] Page is not a qBittorrent Web UI');
            return;
        }
        Ladderr.pageTimer = Date.now();
        console.debug('[Ladderr] Waiting for page to load');

        const isPageReady = () => (
            $('#desktop') &&
            $('#preferencesLink') &&
            $('#queueingMenuItems') &&
            $('#torrentFilesMenu') &&
            $('#torrentsTableDiv table') &&
            $('#torrentFilesTableDiv table')
        );

        const executeCallback = () => {
            observer.disconnect();
            clearTimeout(fallbackTimer);
            console.debug(`[Ladderr] Page ready in ${Date.now() - Ladderr.pageTimer}ms!`);
            callback();
        };

        const observer = new MutationObserver(() => {
            if (isPageReady()) executeCallback();
        });
        const fallbackTimer = setTimeout(() => {
            observer.disconnect();
            console.debug('[Ladderr] Gave up waiting for the page to become ready');
        }, timeout);

        if (isPageReady()) {
            executeCallback();
        } else {
            observer.observe($('body'), {
                childList: true,
                subtree: true
            });
        }
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
        addEventListener(openMenuItem, 'click', openDirectly);
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

    // Save Ladderr settings to GM storage
    async function saveSettings() {
        const pathMappings = getPathMappings();
        const dClickOpen = $('#ladderrSettingsMenu_dClickOpen').checked;
        const warnDangerousFiles = $('#ladderrSettingsMenu_warnDangerous').checked;
        const dangerousExtensions = $('#ladderrSettingsMenu_dangerousExtensions').value;
        await GM.setValue(settingKey('pathMappings'), JSON.stringify(pathMappings));
        await GM.setValue(settingKey('dClickOpen'), `${dClickOpen}`);
        await GM.setValue(settingKey('warnDangerousFiles'), `${warnDangerousFiles}`);
        await GM.setValue(settingKey('dangerousExtensions'), dangerousExtensions);
        Ladderr.pathMappings = pathMappings;
        Ladderr.dClickOpen = dClickOpen;
        Ladderr.warnDangerousFiles = warnDangerousFiles;
        Ladderr.dangerousExtensions = dangerousExtensions;
        $('#torrentsTableDiv table').removeEventListener('dblclick', handleMainDClick, true);
        if (dClickOpen) {
            addEventListener($('#torrentsTableDiv table'), 'dblclick', handleMainDClick);
        }
    }

    // List of setting migrations
    async function migrateSettings() {
        // Migrate settings format when the prefix didn't use location.origin (v0.5.9 and earlier)
        async function legacyOriginPrefix() {
            const settingKeys = ['pathRemote', 'pathLocal', 'dClickOpen', 'warnDangerousFiles', 'dangerousExtensions'];
            const legacyUrl = location.protocol + location.hostname + location.port;
            for (const name of settingKeys) {
                if ((await GM.getValue(settingKey(name), undefined)) !== undefined) continue;
                const oldValue = await GM.getValue(legacyUrl + name, undefined);
                if (oldValue === undefined) continue;
                await GM.setValue(settingKey(name), oldValue);
                await GM.deleteValue(legacyUrl + name);
                console.debug(`[Ladderr] [migration:legacyOriginPrefix] moved '${name}'`);
            }
        }

        // Migrate the single remote/local path pair to the path mappings list (v0.5.9 and earlier)
        async function singleToMultiMapping() {
            if ((await GM.getValue(settingKey('pathMappings'), undefined)) !== undefined) return;
            const remote = await GM.getValue(settingKey('pathRemote'), undefined);
            const local = await GM.getValue(settingKey('pathLocal'), undefined);
            if ((remote === undefined) && (local === undefined)) return;
            const mappings = [{ remote: remote || '', local: local || '' }];
            await GM.setValue(settingKey('pathMappings'), JSON.stringify(mappings));
            await GM.deleteValue(settingKey('pathRemote'));
            await GM.deleteValue(settingKey('pathLocal'));
            console.debug('[Ladderr] [migration:singleToMultiMapping] converted single mapping to list');
        }

        const migrations = [legacyOriginPrefix, singleToMultiMapping];
        for (const migration of migrations) {
            await migration();
        }
    }

    // Load Ladderr settings from GM storage
    async function loadSettings() {
        let pathMappings = [];
        try {
            pathMappings = JSON.parse(await GM.getValue(settingKey('pathMappings'), '[]'));
        } catch (e) {
            console.warn('[Ladderr] Could not parse stored path mappings', e);
        }
        if (!Array.isArray(pathMappings)) pathMappings = [];
        const dClickOpen = (await GM.getValue(settingKey('dClickOpen'), Ladderr.dClickOpen)) === 'true';
        const warnDangerousFiles = (await GM.getValue(settingKey('warnDangerousFiles'), Ladderr.warnDangerousFiles)) === 'true';
        const dangerousExtensions = await GM.getValue(settingKey('dangerousExtensions'), Ladderr.dangerousExtensions);
        loadPathMappings(pathMappings);
        $('#ladderrSettingsMenu_dClickOpen').checked = dClickOpen;
        $('#ladderrSettingsMenu_warnDangerous').checked = warnDangerousFiles;
        $('#ladderrSettingsMenu_dangerousExtensions').value = dangerousExtensions;
        Ladderr.pathMappings = pathMappings;
        Ladderr.dClickOpen = dClickOpen;
        Ladderr.warnDangerousFiles = warnDangerousFiles;
        Ladderr.dangerousExtensions = dangerousExtensions;
        if (dClickOpen) {
            addEventListener($('#torrentsTableDiv table'), 'dblclick', handleMainDClick);
        }
    }

    // Create Ladderr settings menu
    function createSettingsMenu() {
        // Settings menu
        const ladderrSettingsMenu = createElement(`
            <div id="ladderrSettingsMenu">
                <div class="header">Ladderr Options</div>
                <div class="main">
                    <fieldset class="settings">
                        <legend>Path mappings</legend>
                        <div class="mappings-header">
                            <span>Remote path</span>
                            <span>Local path</span>
                            <span></span>
                        </div>
                        <div id="ladderrSettingsMenu_mappings"></div>
                        <button type="button" id="ladderrSettingsMenu_addMapping">+ Add mapping</button>
                    </fieldset>
                    <fieldset class="settings">
                        <legend>Options</legend>
                        <div class="option">
                            <input type="checkbox" id="ladderrSettingsMenu_dClickOpen"/>
                            <label for="ladderrSettingsMenu_dClickOpen">Open destination folder with double-click</label>
                        </div>
                        <div class="option">
                            <input type="checkbox" id="ladderrSettingsMenu_warnDangerous"/>
                            <label for="ladderrSettingsMenu_warnDangerous">Warn when opening dangerous file types</label>
                        </div>
                        <div class="field">
                            <label for="ladderrSettingsMenu_dangerousExtensions">Dangerous file extensions:</label>
                            <input type="text" id="ladderrSettingsMenu_dangerousExtensions" />
                        </div>
                    </fieldset>
                </div>
                <div class="footer">
                    <button type="button" id="ladderrSettingsMenu_saveBtn" title="Save settings">Save</button>
                    <button type="button" id="ladderrSettingsMenu_closeBtn" title="Close window">Close</button>
                </div>
            </div>
        `);
        $('#desktop').append(ladderrSettingsMenu);
        ladderrSettingsMenu.style.display = 'none';

        addEventListener($('#ladderrSettingsMenu_saveBtn'), 'click', () => {
            saveSettings();
            $('#ladderrSettingsMenu').style.display = 'none';
        });
        addEventListener($('#ladderrSettingsMenu_closeBtn'), 'click', () => {
            $('#ladderrSettingsMenu').style.display = 'none';
        });

        // Add a new mapping row at the bottom
        addEventListener($('#ladderrSettingsMenu_addMapping'), 'click', () => {
            $('#ladderrSettingsMenu_mappings').append(createMappingRow());
        });

        // Remove and reorder mapping rows.
        addEventListener($('#ladderrSettingsMenu_mappings'), 'click', (e) => {
            const row = e.target.closest('.mapping-row');
            if (!row) return;
            if (e.target.classList.contains('mapping-remove')) {
                if (row.parentNode.querySelectorAll('.mapping-row').length > 1) {
                    row.remove();
                } else {
                    row.querySelector('.mapping-remote').value = '';
                    row.querySelector('.mapping-local').value = '';
                }
            } else if (e.target.classList.contains('mapping-up')) {
                const prev = row.previousElementSibling;
                if (prev) row.parentNode.insertBefore(row, prev);
            } else if (e.target.classList.contains('mapping-down')) {
                const next = row.nextElementSibling;
                if (next) row.parentNode.insertBefore(next, row);
            }
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
        addEventListener(ladderrSettingsIcon, 'click', () => {
            loadSettings();
            $('#ladderrSettingsMenu').style.display = 'block';
        });
    }

    // Create a single mapping row
    function createMappingRow(remote = '', local = '') {
        const row = createElement(`
            <div class="mapping-row">
                <input type="text" class="mapping-remote" placeholder="/distros/" />
                <input type="text" class="mapping-local" placeholder="${Ladderr.sep === '\\' ? 'D:\\' : '/mnt/storage'}" />
                <div class="mapping-actions">
                    <button type="button" class="mapping-up" title="Move up (higher priority)">↑</button>
                    <button type="button" class="mapping-down" title="Move down">↓</button>
                    <button type="button" class="mapping-remove" title="Remove mapping">✕</button>
                </div>
            </div>
        `);
        row.querySelector('.mapping-remote').value = remote;
        row.querySelector('.mapping-local').value = local;
        return row;
    }

    function loadPathMappings(mappings) {
        const container = $('#ladderrSettingsMenu_mappings');
        container.innerHTML = '';
        const rows = (Array.isArray(mappings) && mappings.length > 0) ? mappings : [{ remote: '', local: '' }];
        for (const mapping of rows) {
            container.append(createMappingRow(mapping.remote || '', mapping.local || ''));
        }
    }

    function getPathMappings() {
        const container = $('#ladderrSettingsMenu_mappings');
        return Array.from(container.querySelectorAll('.mapping-row'))
            .map((row) => ({
                remote: row.querySelector('.mapping-remote').value.trim(),
                local: row.querySelector('.mapping-local').value.trim()
            }))
            .filter((mapping) => mapping.remote || mapping.local);
    }

    function resolveLocalPath(remotePath) {
        for (const mapping of Ladderr.pathMappings) {
            if (!mapping.remote || !mapping.local) continue;
            const remote = mapping.remote.replace(/[\/\\]+$/, '');
            if ((remotePath === remote) || remotePath.startsWith(`${remote}/`)) {
                const local = mapping.local.replace(/[\/\\]+$/, '');
                const remainder = remotePath.slice(remote.length);
                return (local + remainder).replaceAll('/', Ladderr.sep);
            }
        }
        return null;
    }

    function getDangerousFileExtension(filename) {
        const extensions = Ladderr.dangerousExtensions?.split(',');
        return extensions?.find(x => filename?.toLowerCase().endsWith(x.trim().toLowerCase()));
    }


    function openUriLink(action=null) {
        if (Ladderr.pathMappings.length === 0) {
            console.log('[Ladderr] Please configure at least one path mapping');
            return;
        }

        // Get 'Save path' column index
        const torrentTable = $('#torrentsTableDiv table');
        const torrentTableHeader = $('#torrentsTableFixedHeaderDiv thead tr');
        const torrentTableHeaders = Array.from(torrentTableHeader.children);

        // Get torrent remote path
        const torrentRow = torrentTable.querySelector('tbody tr.selected');
        const pathHeader = torrentTableHeader.querySelector('th.column_save_path');
        const pathHeaderIndex = torrentTableHeaders.indexOf(pathHeader);
        const pathRemote = torrentRow.querySelector(`td:nth-child(${pathHeaderIndex + 1})`).textContent;

        // Get torrent filename path
        const fileTableHeader = $('#torrentFilesTableFixedHeaderDiv table thead tr');
        const fileTableHeaders = Array.from(fileTableHeader.children);
        const fileProgressHeader = fileTableHeader.querySelector('th.column_progress');
        const fileProgressHeaderIndex = fileTableHeaders.indexOf(fileProgressHeader);
        const pathParts = [];
        let previousLevel = null;
        let fileIndex = null;
        let fileRow = null;
        let isRowFolder = null;
        let isTreeDone = true;
        let isTargetDone = true;
        while (fileIndex != 0) {
            if (fileRow == null) {
                fileRow = $('#torrentFilesTableDiv table tbody tr.selected');
                if (action === 'openDestination') {
                    fileRow = $('#torrentFilesTableDiv table tbody tr[data-row-id="0"]');
                }
                isTargetDone = (fileRow.querySelector(`td:nth-child(${fileProgressHeaderIndex + 1}) progress-bar`).getValue() !== 0);
            } else {
                fileRow = fileRow.previousSibling;
            }
            fileIndex = fileRow.getAttribute('data-row-id');
            const fileName = fileRow.querySelector('span[id^="filesTablefileName"]');
            const rowCollapseIcon = fileRow.querySelector('.filesTableCollapseIcon');
            isRowFolder = (rowCollapseIcon !== null) && (getComputedStyle(rowCollapseIcon).display !== 'none');
            if (isRowFolder) {
                let folderLevel = getComputedStyle(rowCollapseIcon).marginLeft;
                folderLevel = parseInt(folderLevel.substring(0, folderLevel.length - 2));
                if (folderLevel < previousLevel || previousLevel == null) {
                    if (previousLevel !== null) {
                        isTreeDone = isTreeDone && (fileRow.querySelector(`td:nth-child(${fileProgressHeaderIndex + 1}) progress-bar`).getValue() !== 0);
                    }
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

        if ((action === 'openFolder' && !isTreeDone) ||
            (action === 'openDirectly' && !isTargetDone) ||
            (action === 'openDestination' && isRowFolder && !isTargetDone)) {
            console.log('[Ladderr] Can\'t open folder or file for not initialized torrents');
            return;
        }

        let protocol = '';
        if (action === 'openDirectly') {
            protocol = 'ladderr-open:';
        } else if (action === 'openFolder') {
            if (isTargetDone) {
                protocol = 'ladderr-select:';
            } else {
                protocol = 'ladderr-open:';
                pathParts.shift();
            }
        } else if (action === 'openDestination') {
            if (isRowFolder) {
                protocol = 'ladderr-open:';
            } else {
                protocol = 'ladderr-select:';
            }
        }

        const pathLocal = resolveLocalPath(pathRemote);
        if (pathLocal === null) {
            console.log(`[Ladderr] No path mapping matches "${pathRemote}"`);
            return;
        }
        let fileNamePath = pathParts.reverse().join(Ladderr.sep);
        if (fileNamePath.length > 0) {
            fileNamePath = `${Ladderr.sep}${fileNamePath}`;
        }
        const remotePath = pathLocal + fileNamePath;
        const encodedRemotePath = toBase64String(remotePath)
        const uri = `${protocol}${encodedRemotePath}`;

        const dangerousFileExtension = getDangerousFileExtension(fileNamePath);
        if (Ladderr.warnDangerousFiles && dangerousFileExtension && protocol === 'ladderr-open:') {
            if (!confirm(`Are you sure you want to open this ${dangerousFileExtension} file? This file type could potentially be harmful.`)) {
                return;
            }
        }

        console.debug('[Ladderr] Remote path: ', remotePath);
        console.debug('[Ladderr] URI created: ', uri);
        window.open(uri, '_self');
    }

    function openContainingFolder() {
        openUriLink('openFolder');
    }

    function openDirectly() {
        openUriLink('openDirectly');
    }

    function openDestinationFolder() {
        const panel = $('#propertiesPanel_wrapper');
        Ladderr.panelTabSelected = $('#propertiesTabs li.selected').id;
        Ladderr.panelCollapsed = panel.classList.contains('collapsed');
        if (Ladderr.panelCollapsed || Ladderr.panelTabSelected != 'propFilesLink') {
            const filesTableObserver = new MutationObserver((mutations, observer) => {
                if ($('#filesTablefileName0')) {
                    observer.disconnect();
                    openUriLink('openDestination');
                    $(`#${Ladderr.panelTabSelected}`).click();
                    if ($('#propertiesPanel_wrapper').classList.contains('expanded') && Ladderr.panelCollapsed) {
                        $('#propertiesPanel_collapseToggle').click();
                    }
                }
            });
            filesTableObserver.observe(document.querySelector('#torrentFilesTableDiv table tbody'), { childList: true });

            if (!panel.classList.contains('expanded')) {
                $('#propertiesPanel_collapseToggle').click();
            }
            if ($('#propertiesTabs li.selected').id != 'propFilesLink'){
                $('#propFilesLink').click();
            }
        } else {
            openUriLink('openDestination');
        }
    }

    function handleContentDClick(event) {
        let element = event.target;
        while (element) {
            if (element === this) {
                openDirectly();
                break;
            }
            element = element.parentNode;
        }
    }

    function handleMainDClick(event) {
        event.stopPropagation();
        let element = event.target;
        while (element) {
            if (element === this) {
                openDestinationFolder();
                break;
            }
            element = element.parentNode;
        }
    }

    async function processPage() {
        createSettingsMenu();
        await migrateSettings();
        await loadSettings();
        createContextMenuItems();
        addEventListener(document.querySelector('#torrentFilesTableDiv table'), 'dblclick', handleContentDClick);
    }

    whenPageReady(() => {
        $('head').append(createElement(style));
        processPage();
    }, 30000);

})();
