// ===== MarkDown Pro — App Logic =====

(function() {
  'use strict';

  // ===== State =====
  let currentFilePath = null;
  let currentContent = '';
  let isDark = false;
  let fileTreeVisible = true;
  let mermaidId = 0;
  let menuOpen = false;
  let activeMenuIndex = -1;

  // ===== DOM Refs =====
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const renderedContent = document.getElementById('rendered-content');
  const viewerScroll = document.getElementById('viewer-scroll');
  const welcomeScreen = document.getElementById('welcome-screen');
  const filenameDisplay = document.getElementById('filename-display');
  const wordCount = document.getElementById('word-count');
  const statusFile = document.getElementById('status-file');
  const saveIndicator = document.getElementById('save-indicator');
  const fileTree = document.getElementById('file-tree');
  const fileTreeBody = document.getElementById('file-tree-body');

  // ===== Markdown-it Setup =====
  const md = markdownit({
    html: true,
    breaks: true,
    linkify: true,
    typographer: true,
    highlight: function(str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          const highlighted = hljs.highlight(str, { language: lang, ignoreIllegals: true }).value;
          return `<pre data-lang="${lang}"><code class="hljs language-${lang}">${highlighted}</code></pre>`;
        } catch (e) {}
      }
      // Mermaid diagram
      if (lang === 'mermaid') {
        const id = `mermaid-${++mermaidId}`;
        return `<div class="mermaid-container"><div class="mermaid-loading">⏳ 渲染图表中...</div><pre class="mermaid-src" id="${id}" style="display:none">${this.escapeHtml(str)}</pre></div>`;
      }
      // Default
      return `<pre data-lang="${lang || 'text'}"><code class="hljs">${md.utils.escapeHtml(str)}</code></pre>`;
    }
  });

  // GFM (task lists, strikethrough, tables, autolinks)
  // markdown-it already handles GFM tables, but let's add task list support
  md.use(function(md) {
    // Task list item support
    md.renderer.rules.list_item_open = function(tokens, idx) {
      const token = tokens[idx];
      // Check if next token is a task list
      const next = tokens[idx + 1];
      if (next && next.type === 'inline' && next.content) {
        const match = next.content.match(/^\[([ xX])\]\s*/);
        if (match) {
          const checked = match[1].toLowerCase() === 'x';
          next.content = next.content.slice(match[0].length);
          return `<li class="task-list-item"><input type="checkbox" disabled ${checked ? 'checked' : ''}> `;
        }
      }
      return '<li>';
    };
  });

  // Wikilinks plugin (custom, added to parser)
  md.use(function(md) {
    // Match [[file]] or [[file|display]]
    md.inline.ruler.before('link', 'wikilink', function(state, silent) {
      const pos = state.pos;
      const max = state.posMax;
      const src = state.src;

      if (src.charCodeAt(pos) !== 0x5B || pos + 1 >= max || src.charCodeAt(pos + 1) !== 0x5B) return false;

      let end = pos + 2;
      while (end < max) {
        if (src.charCodeAt(end) === 0x5D && end + 1 < max && src.charCodeAt(end + 1) === 0x5D) break;
        end++;
      }
      if (end >= max) return false;

      const content = src.slice(pos + 2, end);
      const match = content.match(/^([^|]+)(?:\|(.+))?$/);
      if (!match) return false;
      if (silent) return true;

      const fileName = match[1].trim();
      const displayText = (match[2] || fileName).trim();

      const token = state.push('wikilink_open', 'a', 1);
      token.attrs = [
        ['href', `#wikilink:${encodeURIComponent(fileName)}`],
        ['class', 'wikilink'],
        ['data-file', fileName],
      ];

      const textToken = state.push('text', '', 0);
      textToken.content = displayText;

      state.push('wikilink_close', 'a', -1);
      state.pos = end + 2;
      return true;
    });
  });

  // Math plugin (inline $...$ and display $$...$$)
  md.use(function(md) {
    // Inline math
    md.inline.ruler.before('escape', 'math_inline', function(state, silent) {
      let pos = state.pos;
      if (pos + 1 >= state.posMax) return false;
      if (state.src.charCodeAt(pos) !== 0x24) return false;
      if (state.src.charCodeAt(pos + 1) === 0x24) return false; // not $$

      let end = pos + 1;
      while (end < state.posMax) {
        if (state.src.charCodeAt(end) === 0x24 && state.src.charCodeAt(end - 1) !== 0x5C) break;
        end++;
      }
      if (end >= state.posMax) return false;
      if (silent) return true;

      const content = state.src.slice(pos + 1, end).trim();
      if (!content) return false;

      const token = state.push('math_inline', 'span', 0);
      token.content = content;
      token.attrs = [['class', 'math-inline']];
      state.pos = end + 1;
      return true;
    });

    // Display math
    md.block.ruler.before('fence', 'math_block', function(state, startLine, endLine, silent) {
      let pos = state.bMarks[startLine] + state.tShift[startLine];
      if (pos + 1 >= state.eMarks[startLine]) return false;
      if (state.src.charCodeAt(pos) !== 0x24 || state.src.charCodeAt(pos + 1) !== 0x24) return false;
      if (pos + 2 < state.eMarks[startLine] && state.src.charCodeAt(pos + 2) === 0x24) return false;
      if (silent) return true;

      let content = '';
      let line = startLine;
      let found = false;

      while (line < endLine) {
        const lineStart = state.bMarks[line] + state.tShift[line];
        const lineEnd = state.eMarks[line];
        const lineText = state.src.slice(lineStart, lineEnd).trim();
        if (lineText === '$$') { found = true; break; }
        if (line > startLine) content += '\n';
        content += lineText;
        line++;
      }
      if (!found) return false;

      const token = state.push('math_block', 'div', 0);
      token.content = content.trim();
      token.attrs = [['class', 'math-block']];
      token.block = true;
      state.line = line + 1;
      return true;
    });

    // Render math
    md.renderer.rules.math_inline = function(tokens, idx) {
      const content = tokens[idx].content;
      try {
        return katex.renderToString(content, { throwOnError: false, displayMode: false });
      } catch (e) {
        return `<span class="katex-error">${md.utils.escapeHtml(content)}</span>`;
      }
    };

    md.renderer.rules.math_block = function(tokens, idx) {
      const content = tokens[idx].content;
      try {
        return katex.renderToString(content, { throwOnError: false, displayMode: true });
      } catch (e) {
        return `<div class="katex-error">${md.utils.escapeHtml(content)}</div>`;
      }
    };
  });

  // ===== Mermaid Render Helper =====
  async function renderMermaid() {
    const containers = document.querySelectorAll('.mermaid-container');
    if (containers.length === 0) return;

    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? 'dark' : 'default',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        securityLevel: 'loose',
      });

      for (const container of containers) {
        const pre = container.querySelector('.mermaid-src');
        if (!pre) continue;
        const src = pre.textContent.trim();
        const id = pre.id;

        try {
          const { svg } = await mermaid.render(id, src);
          container.innerHTML = svg;
        } catch (e) {
          container.innerHTML = `<div class="katex-error">Mermaid 渲染失败: ${e.message}</div>`;
        }
      }
    } catch (e) {
      console.warn('Mermaid init error:', e.message);
    }
  }

  // ===== Render =====
  function render(content) {
    const text = content || currentContent;

    // Empty state
    if (!text || !text.trim()) {
      welcomeScreen.style.display = 'flex';
      renderedContent.innerHTML = '';
      welcomeScreen.style.display = 'flex';
      renderedContent.appendChild(welcomeScreen);
      wordCount.textContent = '0 字';
      return;
    }
    welcomeScreen.style.display = 'none';
    mermaidId = 0;

    // Parse markdown
    const html = md.render(text);
    renderedContent.innerHTML = html;

    // Word count (excluding spaces)
    const charCount = text.replace(/\s/g, '').length;
    wordCount.textContent = `${charCount} 字`;

    // Render Mermaid
    renderMermaid();

    // Handle wikilink clicks
    document.querySelectorAll('.wikilink').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const file = el.getAttribute('data-file');
        if (file && currentFilePath) {
          const dir = currentFilePath.substring(0, currentFilePath.lastIndexOf('\\'));
          const targetPath = dir + '\\' + file;
          openFileByPath(targetPath);
        }
      });
    });
  }

  // ===== Open File =====
  async function openFileByPath(filePath) {
    const result = await window.mdAPI.readFile(filePath);
    if (result && result.success) {
      currentFilePath = result.filePath;
      currentContent = result.content;
      filenameDisplay.textContent = result.filePath.split('\\').pop();
      statusFile.textContent = `📄 ${filenameDisplay.textContent}`;
      document.title = `MarkDown Pro — ${filenameDisplay.textContent}`;
      render(currentContent);
      updateFileTreeActive();
    }
  }

  async function openFile() {
    await window.mdAPI.openFileDialog();
  }

  async function saveFile() {
    if (!currentContent) return;
    await window.mdAPI.saveFile(currentContent, currentFilePath);
  }

  // ===== Export HTML =====
  function exportHTML() {
    const text = currentContent || '';
    const html = md.render(text);
    const name = (filenameDisplay.textContent || 'untitled').replace(/\.(md|markdown|txt)$/i, '') || 'document';
    const css = isDark ? 'body{background:#1a1b26;color:#c9d1d9;max-width:800px;margin:0 auto;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;line-height:1.6}' : 'body{max-width:800px;margin:0 auto;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;line-height:1.6;color:#1a1a2e}';

    const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${name}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css">
<style>${css}
h1,h2{border-bottom:1px solid #ddd;padding-bottom:8px}
code{background:#f0f2f5;padding:2px 6px;border-radius:4px;font-size:0.9em}
pre{background:#f6f8fa;padding:16px;border-radius:8px;overflow-x:auto}
pre code{background:transparent;padding:0}
blockquote{border-left:3px solid #4f6ef7;padding:8px 16px;margin:16px 0;background:#f8f9fa;color:#666}
table{border-collapse:collapse;width:100%}
th,td{border:1px solid #dfe2e6;padding:8px 14px}
img{max-width:100%;border-radius:8px}</style></head>
<body>${html}
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/gh/highlightjs/highlight.js@11.11.1/build/highlight.min.js"><\/script>
<script>document.querySelectorAll('pre code').forEach(b=>hljs.highlightElement(b))<\/script>
</body></html>`;

    // Create a blob and save via Electron
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ===== File Tree =====
  function buildFileTree(data) {
    if (!data || !data.files) {
      fileTreeBody.innerHTML = `<div class="file-tree-empty"><p>尚未打开文件夹</p><p class="hint">点击上方按钮或使用<br>Ctrl+Shift+O 打开</p></div>`;
      return;
    }

    let html = '';
    if (data.folders && data.folders.length > 0) {
      html += `<div class="folder-header">📁 文件夹</div>`;
      for (const folder of data.folders) {
        html += `<div class="file-item" data-path="${escapeAttr(folder.path)}" data-dir="true">
          <span class="icon">📁</span><span class="name">${escapeHtml(folder.name)}</span>
        </div>`;
      }
    }

    html += `<div class="folder-header">📄 Markdown 文件</div>`;
    for (const file of data.files) {
      const active = currentFilePath === file.path ? ' active' : '';
      html += `<div class="file-item${active}" data-path="${escapeAttr(file.path)}">
        <span class="icon">📄</span>
        <span class="name">${escapeHtml(file.name.replace(/\.(md|markdown|txt)$/i, ''))}</span>
        <span class="ext">.${file.name.split('.').pop()}</span>
      </div>`;
    }

    fileTreeBody.innerHTML = html || '<div class="file-tree-empty"><p>该文件夹内没有 Markdown 文件</p></div>';

    // Click handlers
    fileTreeBody.querySelectorAll('.file-item').forEach(el => {
      el.addEventListener('click', () => {
        const path = el.getAttribute('data-path');
        if (path) openFileByPath(path);
      });
    });
  }

  function updateFileTreeActive() {
    fileTreeBody.querySelectorAll('.file-item').forEach(el => {
      const path = el.getAttribute('data-path');
      el.classList.toggle('active', path === currentFilePath);
    });
  }

  // ===== Helpers =====
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  function escapeAttr(str) {
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ===== Theme =====
  function toggleTheme() {
    isDark = !isDark;
    document.body.classList.toggle('dark', isDark);
    document.getElementById('btn-theme').textContent = isDark ? '☀️' : '🌙';
    // Re-render mermaid with new theme
    renderMermaid();
  }

  function applyTheme(saved) {
    isDark = saved === 'dark';
    document.body.classList.toggle('dark', isDark);
    document.getElementById('btn-theme').textContent = isDark ? '☀️' : '🌙';
  }

  // ===== IPC Event Handlers =====
  // Get menu structure and build UI
  window.mdAPI.getMenuStructure().then(menuData => buildMenuUI(menuData));
  window.mdAPI.onFileOpened((data) => {
    currentFilePath = data.filePath;
    currentContent = data.content;
    filenameDisplay.textContent = data.fileName;
    statusFile.textContent = `📄 ${data.fileName}`;
    document.title = `MarkDown Pro — ${data.fileName}`;
    render(currentContent);

    // Build file tree for the directory
    window.mdAPI.readDirectory(data.dirPath).then(files => {
      buildFileTree(files);
    });
  });

  window.mdAPI.onFileSaved((data) => {
    saveIndicator.className = 'save-indicator saved';
    setTimeout(() => { saveIndicator.className = 'save-indicator'; }, 2000);
  });

  window.mdAPI.onFolderOpened((data) => {
    buildFileTree(data);
  });

  window.mdAPI.onToggleTheme(() => toggleTheme());

  window.mdAPI.onExportHtml(() => exportHTML());

  // ===== Update Status Handler =====
  const cleanupUpdateListener = window.mdAPI.onUpdateStatus((status, data) => {
    const el = document.getElementById('status-grammar');
    switch (status) {
      case 'checking': el.textContent = '⏳ 检查更新...'; break;
      case 'available': el.textContent = `⬇️ v${data.version} 可用`; setTimeout(() => el.textContent = 'CommonMark + GFM', 8000); break;
      case 'downloading': el.textContent = '📥 下载更新中...'; break;
      case 'progress': el.textContent = `📥 ${data.percent}%`; break;
      case 'downloaded': el.textContent = '✅ 更新已就绪，重启安装'; break;
      case 'up-to-date': el.textContent = '✅ 已是最新'; setTimeout(() => el.textContent = 'CommonMark + GFM', 4000); break;
      case 'error': el.textContent = '⚠️ 更新检查失败'; setTimeout(() => el.textContent = 'CommonMark + GFM', 4000); break;
    }
  });

  // ===== Menu System (vertical dropdown) =====

  // Build the full menu from structure
  window.mdAPI.getMenuStructure().then(menuData => {
    const content = document.getElementById('dropdown-content');
    let html = '';
    menuData.forEach((group, gi) => {
      if (gi > 0) html += '<div class="menu-separator"></div>';
      group.items.forEach(item => {
        if (item.type === 'separator') {
          html += '<div class="menu-separator"></div>';
        } else {
          html += `<div class="menu-item" data-action="${item.action}">
            <span>${item.label}</span>
            ${item.accelerator ? `<span class="shortcut">${item.accelerator}</span>` : ''}
          </div>`;
        }
      });
    });
    content.innerHTML = html;
    // Click handlers
    content.querySelectorAll('.menu-item').forEach(el => {
      el.addEventListener('click', () => {
        handleMenuAction(el.dataset.action);
        closeMenu();
      });
    });
  });

  function closeMenu() {
    menuOpen = false;
    document.getElementById('dropdown-content').classList.remove('open');
    document.getElementById('menu-trigger').classList.remove('active');
  }

  // Menu trigger toggle
  document.getElementById('menu-trigger').addEventListener('click', (e) => {
    e.stopPropagation();
    menuOpen = !menuOpen;
    document.getElementById('dropdown-content').classList.toggle('open', menuOpen);
    document.getElementById('menu-trigger').classList.toggle('active', menuOpen);
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown-menu') && !e.target.closest('.menu-trigger')) {
      closeMenu();
    }
  });

  // Remove duplicate menuOpen from state section
  // (menuOpen is already declared above in the new menu system)

  function handleMenuAction(action) {
    closeMenu();
    switch (action) {
      case 'open-file': window.mdAPI.openFileDialog(); break;
      case 'open-folder': window.mdAPI.openFolderDialog(); break;
      case 'save': window.mdAPI.saveFile(currentContent, currentFilePath); break;
      case 'save-as': window.mdAPI.saveAsDialog(currentContent); break;
      case 'export-html': exportHTML(); break;
      case 'export-pdf': exportPDF(); break;
      case 'quit': window.mdAPI.close(); break;
      case 'undo': document.execCommand('undo'); break;
      case 'redo': document.execCommand('redo'); break;
      case 'cut': document.execCommand('cut'); break;
      case 'copy': document.execCommand('copy'); break;
      case 'paste': document.execCommand('paste'); break;
      case 'select-all': document.execCommand('selectAll'); break;
      case 'toggle-theme': toggleTheme(); break;
      case 'toggle-filetree': toggleFileTree(); break;
      case 'fullscreen': document.querySelector('.win-btn-max').click(); break;
      case 'devtools': break; // Handled by Electron
      case 'check-update': window.mdAPI.checkForUpdates(); break;
      case 'about': window.mdAPI.getAppVersion().then(v => alert(`MarkDown Pro v${v}\n支持 CommonMark · GFM · Mermaid · KaTeX · 双链笔记\n\n完全离线，不依赖浏览器。`)); break;
      case 'github': window.mdAPI.openExternal('https://github.com/zt310/markdown-pro'); break;
      case 'report-issue': window.mdAPI.openExternal('https://github.com/zt310/markdown-pro/issues/new'); break;
    }
  }

  // Menu trigger button
  document.getElementById('menu-trigger').addEventListener('click', () => {
    menuOpen = !menuOpen;
    document.getElementById('menu-bar').classList.toggle('open', menuOpen);
    document.getElementById('menu-trigger').classList.toggle('active', menuOpen);
    if (!menuOpen) {
      document.getElementById('menu-panel').classList.remove('open');
      document.querySelectorAll('.menu-bar-item').forEach(i => i.classList.remove('active'));
      activeMenuIndex = -1;
    }
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown-menu') && !e.target.closest('.menu-trigger')) {
      menuOpen = false;
      document.getElementById('menu-bar').classList.remove('open');
      document.getElementById('menu-panel').classList.remove('open');
      document.getElementById('menu-trigger').classList.remove('active');
      document.querySelectorAll('.menu-bar-item').forEach(i => i.classList.remove('active'));
      activeMenuIndex = -1;
    }
  });

  // ===== Window Controls =====
  document.getElementById('btn-min').addEventListener('click', () => window.mdAPI.minimize());
  document.getElementById('btn-max').addEventListener('click', () => window.mdAPI.maximize());
  document.getElementById('btn-close').addEventListener('click', () => window.mdAPI.close());

  window.mdAPI.onWindowState((state) => {
    const btn = document.getElementById('btn-max');
    btn.textContent = state === 'maximized' ? '❐' : '□';
    btn.title = state === 'maximized' ? '还原' : '最大化';
  });

  // ===== File Tree Toggle =====
  function toggleFileTree() {
    fileTreeVisible = !fileTreeVisible;
    fileTree.classList.toggle('collapsed', !fileTreeVisible);
    document.getElementById('btn-filetree').style.opacity = fileTreeVisible ? '1' : '0.5';
  }

  // ===== WYSIWYG Edit Mode (contentEditable + turndown) =====
  let editMode = false;
  const editorContent = document.createElement('div');
  editorContent.id = 'editor-content';
  editorContent.className = 'editor-content';
  editorContent.contentEditable = true;

  // Turndown service for HTML→Markdown conversion
  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    bulletListMarker: '-',
    hr: '---',
  });

  function toggleEdit() {
    editMode = !editMode;
    const btn = document.getElementById('btn-edit');
    const toolbar = document.getElementById('editor-toolbar');
    const scroll = document.getElementById('viewer-scroll');
    btn.textContent = editMode ? '👁️ 预览' : '✏️ 编辑';

    if (editMode) {
      // Enter edit: render currentContent as HTML into contentEditable
      const html = md.render(currentContent || '');
      editorContent.innerHTML = html;
      editorContent.classList.add('show');
      toolbar.classList.add('show');
      renderedContent.style.display = 'none';
      scroll.innerHTML = '';
      scroll.appendChild(editorContent);
      editorContent.focus();
      document.getElementById('btn-save').style.borderColor = 'var(--accent)';
    } else {
      // Exit edit: convert editable HTML back to Markdown via turndown
      const rawHtml = editorContent.innerHTML;
      let mdText = '';
      try {
        mdText = td.turndown(rawHtml);
      } catch (e) {
        console.warn('Turndown error, falling back to raw HTML:', e);
        mdText = rawHtml;
      }
      currentContent = mdText;
      editorContent.classList.remove('show');
      toolbar.classList.remove('show');
      renderedContent.style.display = 'block';
      scroll.innerHTML = '';
      scroll.appendChild(renderedContent);
      render(currentContent);
      document.getElementById('btn-save').style.borderColor = '';
    }
  }

  // Toolbar button handlers
  document.getElementById('editor-toolbar').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const cmd = btn.dataset.cmd;

    // Ensure editor has focus
    if (cmd !== 'undo' && cmd !== 'redo') {
      editorContent.focus();
    }

    switch (cmd) {
      case 'h1': document.execCommand('formatBlock', false, 'h1'); break;
      case 'h2': document.execCommand('formatBlock', false, 'h2'); break;
      case 'h3': document.execCommand('formatBlock', false, 'h3'); break;
      case 'bold': document.execCommand('bold'); break;
      case 'italic': document.execCommand('italic'); break;
      case 'underline': document.execCommand('underline'); break;
      case 'strikeThrough': document.execCommand('strikeThrough'); break;
      case 'blockquote': document.execCommand('formatBlock', false, 'blockquote'); break;
      case 'code': document.execCommand('insertHTML', false, '<pre><code>代码</code></pre>'); break;
      case 'createLink': {
        const url = prompt('输入链接地址:', 'https://');
        if (url) document.execCommand('createLink', false, url);
        break;
      }
      case 'insertTable': {
        const cols = prompt('列数:', '3') || '3';
        const rows = prompt('行数:', '2') || '2';
        let table = '<table><thead><tr>' + '<th>标题</th>'.repeat(parseInt(cols)) + '</tr></thead><tbody>';
        for (let i = 1; i < parseInt(rows); i++) {
          table += '<tr>' + '<td>内容</td>'.repeat(parseInt(cols)) + '</tr>';
        }
        table += '</tbody></table>';
        document.execCommand('insertHTML', false, table);
        break;
      }
      case 'insertUnorderedList': document.execCommand('insertUnorderedList'); break;
      case 'insertOrderedList': document.execCommand('insertOrderedList'); break;
      case 'undo': document.execCommand('undo'); break;
      case 'redo': document.execCommand('redo'); break;
    }
  });

  // Handle paste: strip unwanted formatting
  editorContent.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, text);
  });

  // Handle Enter in headings/lists: insert proper block
  editorContent.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      // Save while staying in edit mode
      const rawHtml = editorContent.innerHTML;
      try {
        currentContent = td.turndown(rawHtml);
      } catch (err) {
        currentContent = rawHtml;
      }
      window.mdAPI.saveFile(currentContent, currentFilePath);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      toggleEdit();
    }
  });

  document.getElementById('btn-edit').addEventListener('click', toggleEdit);
  async function exportPDF() {
    const result = await window.mdAPI.exportPdf();
    if (result?.success) {
      showToast(`✅ PDF 已导出: ${result.filePath.split('\\').pop()}`);
    }
  }

  // ===== Keyboard Shortcuts (in-page) =====
  document.addEventListener('keydown', (e) => {
    const isCtrl = e.ctrlKey || e.metaKey;
    if (isCtrl && e.key === 'o' && !e.shiftKey) {
      e.preventDefault();
      openFile();
    }
    if (isCtrl && e.key === 'o' && e.shiftKey) {
      e.preventDefault();
      window.mdAPI.openFolderDialog();
    }
    if (isCtrl && e.key === 's') {
      e.preventDefault();
      saveFile();
    }
    if (isCtrl && e.key === 't') {
      e.preventDefault();
      toggleTheme();
    }
    if (isCtrl && e.key === 'e') {
      e.preventDefault();
      exportHTML();
    }
    if (isCtrl && e.key === 'p') {
      e.preventDefault();
      exportPDF();
    }
    if (isCtrl && e.key === 'b') {
      e.preventDefault();
      toggleFileTree();
    }
    if (isCtrl && e.key === 'd') {
      e.preventDefault();
      toggleEdit();
    }
  });

  // ===== UI Button Handlers =====
  document.getElementById('btn-open').addEventListener('click', openFile);
  document.getElementById('btn-save').addEventListener('click', saveFile);
  document.getElementById('btn-export-html').addEventListener('click', exportHTML);
  document.getElementById('btn-export-pdf').addEventListener('click', exportPDF);
  document.getElementById('btn-theme').addEventListener('click', toggleTheme);
  document.getElementById('btn-open-folder').addEventListener('click', () => window.mdAPI.openFolderDialog());
  document.getElementById('btn-filetree').addEventListener('click', toggleFileTree);

  // ===== Drag & Drop =====
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', async (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.path) {
        openFileByPath(file.path);
      } else if (file.name.match(/\.(md|markdown|txt)$/i)) {
        // Read as text
        const text = await file.text();
        currentContent = text;
        currentFilePath = null;
        filenameDisplay.textContent = file.name;
        statusFile.textContent = `📄 ${file.name}`;
        document.title = `MarkDown Pro — ${file.name}`;
        render(currentContent);
      }
    }
  });

  // ===== Handle window close prevention =====
  window.addEventListener('beforeunload', (e) => {
    // Nothing to do — renderer has no unsaved state awareness in simple mode
  });

  // ===== Init =====
  // Load saved theme
  const savedTheme = localStorage.getItem('mdpro-theme');
  applyTheme(savedTheme || 'light');

  // Handle command-line file (passed via URL hash)
  // Also check if there's a recent file
  const recent = localStorage.getItem('mdpro-recent-file');
  if (recent) {
    // Silently try to open it next time
    // For now, just show welcome screen
  }

  console.log('MarkDown Pro initialized ✓');

})();
