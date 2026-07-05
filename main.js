const { app, BrowserWindow, dialog, ipcMain, Menu, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

// ===== Window Management =====
let mainWindow = null;
let currentFilePath = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 500,
    title: 'MarkDown Pro',
    icon: path.join(__dirname, 'src', 'assets', 'icon.png'),
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    backgroundColor: '#ffffff',
    show: false,
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('maximize', () => mainWindow.webContents.send('window-state', 'maximized'));
  mainWindow.on('unmaximize', () => mainWindow.webContents.send('window-state', 'normal'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Initialize auto-updater
  setupAutoUpdater();
}

// ===== Auto Updater =====
function setupAutoUpdater() {
  autoUpdater.autoDownload = false; // Let user choose when to download
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'zt310',
    repo: 'markdown-pro',
  });

  // Check for updates silently on startup (after 5s delay)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {});
  }, 5000);

  // Event handlers
  autoUpdater.on('checking-for-update', () => {
    mainWindow?.webContents.send('update-status', 'checking');
  });

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update-status', 'available', info);
    // Show a dialog asking if user wants to download
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: '发现新版本',
      message: `MarkDown Pro ${info.version} 可用`,
      detail: `当前版本：v${app.getVersion()}\n新版本：${info.version}\n\n是否下载更新？`,
      buttons: ['下载更新', '稍后再说'],
      defaultId: 0,
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.downloadUpdate();
        mainWindow?.webContents.send('update-status', 'downloading');
      }
    });
  });

  autoUpdater.on('update-not-available', () => {
    mainWindow?.webContents.send('update-status', 'up-to-date');
  });

  autoUpdater.on('download-progress', (progress) => {
    const pct = Math.round(progress.percent);
    mainWindow?.webContents.send('update-status', 'progress', { percent: pct, bytesPerSecond: progress.bytesPerSecond, total: progress.total, transferred: progress.transferred });
  });

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow?.webContents.send('update-status', 'downloaded', info);
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: '更新已下载',
      message: `MarkDown Pro ${info.version} 已下载完成`,
      detail: '是否立即安装并重启？',
      buttons: ['立即安装', '稍后'],
      defaultId: 0,
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  autoUpdater.on('error', (err) => {
    console.error('Auto-updater error:', err.message);
    mainWindow?.webContents.send('update-status', 'error', { message: err.message });
  });
}

// Manually trigger update check (from menu)
function checkForUpdates() {
  mainWindow?.webContents.send('update-status', 'checking');
  autoUpdater.checkForUpdates().catch((err) => {
    mainWindow?.webContents.send('update-status', 'error', { message: err.message });
  });
}

// ===== Menu =====
function buildMenu() {
  return [
    {
      label: '文件',
      submenu: [
        {
          label: '打开文件...',
          accelerator: 'CmdOrCtrl+O',
          click: () => openFileDialog(),
        },
        {
          label: '打开文件夹...',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => openFolderDialog(),
        },
        { type: 'separator' },
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => saveFile(),
        },
        {
          label: '另存为...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => saveAsFile(),
        },
        { type: 'separator' },
        {
          label: '导出 HTML...',
          accelerator: 'CmdOrCtrl+E',
          click: () => mainWindow.webContents.send('export-html'),
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' },
      ],
    },
    {
      label: '视图',
      submenu: [
        {
          label: '切换主题',
          accelerator: 'CmdOrCtrl+T',
          click: () => mainWindow.webContents.send('toggle-theme'),
        },
        { type: 'separator' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { role: 'reload', label: '刷新' },
        { role: 'togglefullscreen', label: '全屏' },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '检查更新...',
          accelerator: 'CmdOrCtrl+U',
          click: () => checkForUpdates(),
        },
        { type: 'separator' },
        {
          label: '关于 MarkDown Pro',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于 MarkDown Pro',
              message: `MarkDown Pro v${app.getVersion()}`,
              detail: '一个本地 Markdown 查看器\n\n支持 CommonMark + GFM + Mermaid + KaTeX + 双链笔记\n\n完全离线，不依赖浏览器。\n\n' + (autoUpdater.isUpdating ? '更新已就绪' : ''),
            });
          },
        },
        { type: 'separator' },
        {
          label: 'GitHub 主页',
          click: () => shell.openExternal('https://github.com/zt310/markdown-pro'),
        },
        {
          label: '报告问题',
          click: () => shell.openExternal('https://github.com/zt310/markdown-pro/issues/new'),
        },
      ],
    },
  ];
}

// ===== IPC Handlers =====
ipcMain.handle('open-file-dialog', async () => {
  return openFileDialog();
});

ipcMain.handle('open-folder-dialog', async () => {
  return openFolderDialog();
});

ipcMain.handle('save-file', async (event, { content, filePath }) => {
  return saveFile(content, filePath);
});

ipcMain.handle('save-as-dialog', async (event, content) => {
  return saveAsFile(content);
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, content, filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('read-directory', async (event, dirPath) => {
  return readDirectory(dirPath);
});

ipcMain.handle('get-file-info', async (event, filePath) => {
  try {
    const stat = fs.statSync(filePath);
    return {
      name: path.basename(filePath),
      dir: path.dirname(filePath),
      size: stat.size,
      modified: stat.mtime.toISOString(),
    };
  } catch (err) {
    return null;
  }
});

ipcMain.handle('app-get-path', (event, name) => {
  return app.getPath(name);
});

ipcMain.handle('check-for-updates', () => {
  checkForUpdates();
  return true;
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Window controls
ipcMain.handle('window-minimize', () => mainWindow?.minimize());
ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.handle('window-close', () => mainWindow?.close());
ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized());

// PDF export
ipcMain.handle('export-pdf', async () => {
  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: (currentFilePath || 'untitled').replace(/\.\w+$/, '') + '.pdf',
    filters: [{ name: 'PDF 文件', extensions: ['pdf'] }],
  });
  if (canceled || !filePath) return { success: false, canceled: true };

  try {
    const pdfData = await mainWindow.webContents.printToPDF({
      printBackground: true,
      preferCSSPageSize: true,
      margins: { top: 20, bottom: 20, left: 20, right: 20 },
    });
    fs.writeFileSync(filePath, pdfData);
    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Send menu structure to renderer
ipcMain.handle('get-menu-structure', () => {
  return buildMenuStructure();
});

function buildMenuStructure() {
  return [
    {
      label: '文件', items: [
        { label: '打开文件...', accelerator: 'Ctrl+O', action: 'open-file' },
        { label: '打开文件夹...', accelerator: 'Ctrl+Shift+O', action: 'open-folder' },
        { type: 'separator' },
        { label: '保存', accelerator: 'Ctrl+S', action: 'save' },
        { label: '另存为...', accelerator: 'Ctrl+Shift+S', action: 'save-as' },
        { type: 'separator' },
        { label: '导出 HTML...', accelerator: 'Ctrl+E', action: 'export-html' },
        { label: '导出 PDF...', accelerator: 'Ctrl+P', action: 'export-pdf' },
        { type: 'separator' },
        { label: '退出', accelerator: 'Ctrl+Q', action: 'quit' },
      ],
    },
    {
      label: '编辑', items: [
        { label: '撤销', action: 'undo' },
        { label: '重做', action: 'redo' },
        { type: 'separator' },
        { label: '剪切', action: 'cut' },
        { label: '复制', action: 'copy' },
        { label: '粘贴', action: 'paste' },
        { label: '全选', action: 'select-all' },
      ],
    },
    {
      label: '视图', items: [
        { label: '切换主题', accelerator: 'Ctrl+T', action: 'toggle-theme' },
        { label: '切换文件树', accelerator: 'Ctrl+B', action: 'toggle-filetree' },
        { type: 'separator' },
        { label: '全屏', accelerator: 'F11', action: 'fullscreen' },
        { label: '开发者工具', accelerator: 'Ctrl+Shift+I', action: 'devtools' },
      ],
    },
    {
      label: '帮助', items: [
        { label: '检查更新...', accelerator: 'Ctrl+U', action: 'check-update' },
        { type: 'separator' },
        { label: '关于 MarkDown Pro', action: 'about' },
        { type: 'separator' },
        { label: 'GitHub 主页', action: 'github' },
        { label: '报告问题', action: 'report-issue' },
      ],
    },
  ];
}

// ===== File Operations =====
async function openFileDialog() {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Markdown 文件', extensions: ['md', 'markdown', 'mdown', 'mkd', 'mdx'] },
      { name: '文本文件', extensions: ['txt'] },
      { name: '所有文件', extensions: ['*'] },
    ],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    return await readAndSendFile(filePath);
  }
  return null;
}

async function openFolderDialog() {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const dirPath = result.filePaths[0];
    const files = readDirectory(dirPath);
    mainWindow.webContents.send('folder-opened', { dirPath, files });
    return { dirPath, files };
  }
  return null;
}

function readDirectory(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const files = [];
    const folders = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        folders.push({ name: entry.name, path: fullPath, isDir: true });
      } else if (entry.name.match(/\.(md|markdown|mdown|mkd|mdx|txt)$/i)) {
        const stat = fs.statSync(fullPath);
        files.push({
          name: entry.name,
          path: fullPath,
          isDir: false,
          size: stat.size,
          modified: stat.mtime.toISOString(),
        });
      }
    }

    // Sort: folders first, then files (alphabetically)
    folders.sort((a, b) => a.name.localeCompare(b.name));
    files.sort((a, b) => a.name.localeCompare(b.name));

    return { folders, files, dirPath };
  } catch (err) {
    return { folders: [], files: [], dirPath, error: err.message };
  }
}

async function readAndSendFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    currentFilePath = filePath;
    mainWindow.webContents.send('file-opened', {
      content,
      filePath,
      fileName: path.basename(filePath),
      dirPath: path.dirname(filePath),
    });
    mainWindow.setTitle(`MarkDown Pro — ${path.basename(filePath)}`);
    return { success: true, content, filePath };
  } catch (err) {
    dialog.showErrorBox('打开失败', `无法读取文件: ${err.message}`);
    return { success: false, error: err.message };
  }
}

function saveFile(content, filePath) {
  const targetPath = filePath || currentFilePath;
  if (!targetPath) return saveAsFile(content);

  try {
    fs.writeFileSync(targetPath, content, 'utf-8');
    mainWindow.webContents.send('file-saved', { filePath: targetPath });
    return { success: true, filePath: targetPath };
  } catch (err) {
    dialog.showErrorBox('保存失败', err.message);
    return { success: false, error: err.message };
  }
}

async function saveAsFile(content) {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: currentFilePath || 'untitled.md',
    filters: [
      { name: 'Markdown 文件', extensions: ['md'] },
      { name: '所有文件', extensions: ['*'] },
    ],
  });

  if (!result.canceled && result.filePath) {
    try {
      fs.writeFileSync(result.filePath, content, 'utf-8');
      currentFilePath = result.filePath;
      mainWindow.setTitle(`MarkDown Pro — ${path.basename(result.filePath)}`);
      mainWindow.webContents.send('file-saved', { filePath: result.filePath });
      return { success: true, filePath: result.filePath };
    } catch (err) {
      dialog.showErrorBox('保存失败', err.message);
      return { success: false, error: err.message };
    }
  }
  return null;
}

// ===== Handle file open from OS (double-click .md file) =====
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  if (mainWindow) {
    readAndSendFile(filePath);
  }
});

// ===== App Lifecycle =====
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // Handle file opened via command line or double-click
  const fileArg = process.argv.find(arg => arg.endsWith('.md'));
  if (fileArg && fs.existsSync(fileArg)) {
    mainWindow.webContents.once('did-finish-load', () => {
      readAndSendFile(path.resolve(fileArg));
    });
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
