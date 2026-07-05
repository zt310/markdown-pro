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
  getAppPath: (name) => ipcRenderer.invoke('app-get-path', name),

  // App events
  onFileOpened: (callback) => {
    ipcRenderer.on('file-opened', (event, data) => callback(data));
  },
  onFileSaved: (callback) => {
    ipcRenderer.on('file-saved', (event, data) => callback(data));
  },
  onFolderOpened: (callback) => {
    ipcRenderer.on('folder-opened', (event, data) => callback(data));
  },
  onToggleTheme: (callback) => {
    ipcRenderer.on('toggle-theme', () => callback());
  },
  onExportHtml: (callback) => {
    ipcRenderer.on('export-html', () => callback());
  },

  // Utility
  platform: process.platform,
});
