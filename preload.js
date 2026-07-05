const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mdAPI', {
  // File operations
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
  saveFile: (content, filePath) => ipcRenderer.invoke('save-file', { content, filePath }),
  saveAsDialog: (content) => ipcRenderer.invoke('save-as-dialog', content),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  readDirectory: (dirPath) => ipcRenderer.invoke('read-directory', dirPath),
  getFileInfo: (filePath) => ipcRenderer.invoke('get-file-info', filePath),

  // Window controls
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  // Export
  exportPdf: () => ipcRenderer.invoke('export-pdf'),
  getMenuStructure: () => ipcRenderer.invoke('get-menu-structure'),

  // Update
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Events
  onFileOpened: (cb) => ipcRenderer.on('file-opened', (_e, d) => cb(d)),
  onFileSaved: (cb) => ipcRenderer.on('file-saved', (_e, d) => cb(d)),
  onFolderOpened: (cb) => ipcRenderer.on('folder-opened', (_e, d) => cb(d)),
  onToggleTheme: (cb) => ipcRenderer.on('toggle-theme', () => cb()),
  onExportHtml: (cb) => ipcRenderer.on('export-html', () => cb()),
  onWindowState: (cb) => ipcRenderer.on('window-state', (_e, s) => cb(s)),
  onUpdateStatus: (cb) => {
    const h = (_e, s, d) => cb(s, d);
    ipcRenderer.on('update-status', h);
    return () => ipcRenderer.removeListener('update-status', h);
  },

  // Menu actions
  onMenuAction: (cb) => ipcRenderer.on('menu-action', (_e, a) => cb(a)),

  platform: process.platform,
});
