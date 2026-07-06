<div align="center">

# ◈ MarkDown Pro

**一个本地 Markdown 查看器**

![版本](https://img.shields.io/badge/版本-1.3.0-4f6ef7?style=flat-square)
![许可](https://img.shields.io/badge/许可-MIT-4f6ef7?style=flat-square)
![平台](https://img.shields.io/badge/平台-Windows-blue?style=flat-square)
![Electron](https://img.shields.io/badge/Electron-43.0-47848f?style=flat-square)

支持 CommonMark · GFM · Mermaid · KaTeX · [[双链笔记]] · 完全离线 · 不依赖浏览器

</div>

---

## 📥 下载

| 版本 | 文件 | 说明 |
|------|------|------|
| **v1.3.0** | [📦 MarkDown-Pro-Portable-v1.3.0.zip](https://github.com/zt310/markdown-pro/releases/download/v1.3.0/MarkDown-Pro-Portable-v1.3.0.zip) | 便携版，解压即用 |
| **v1.3.0** | [⚙️ MarkDown-Pro-v1.3.0.exe](https://github.com/zt310/markdown-pro/releases/download/v1.3.0/MarkDown-Pro-v1.3.0.exe) | 自解压单文件版 |

> 💡 便携版解压后双击 `MarkDown Pro.exe` 即可运行，无需安装。

---

## ✨ 特性

| 标准 | 支持情况 |
|------|---------|
| **CommonMark** | ✅ 标准 Markdown 语法 |
| **GFM** | ✅ 任务列表、删除线、表格、自动链接 |
| **代码高亮** | ✅ highlight.js 190+ 语言自动识别 |
| **Mermaid 图表** | ✅ 流程图、时序图、甘特图、类图等 |
| **KaTeX 数学公式** | ✅ 行内 `$...$` 和块级 `$$...$$` |
| **[[双链]]笔记** | ✅ Obsidian 风格双向链接，点击跳转文件 |
| **文件树** | ✅ 打开文件夹后自动浏览 |
| **暗色/亮色主题** | ✅ 一键切换 |
| **导出 HTML / PDF** | ✅ 保留样式和代码高亮 |
| **自动更新** | ✅ 检测 GitHub 新版本 |
| **拖拽打开** | ✅ 支持 .md 文件拖入 |

## 🚀 快速使用

```bash
# 方式 1：下载便携版 / 自解压版，双击运行
# 方式 2：从源码运行
git clone https://github.com/zt310/markdown-pro.git
cd markdown-pro
npm install
npm start
```

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+O` | 打开文件 |
| `Ctrl+Shift+O` | 打开文件夹 |
| `Ctrl+S` | 保存文件 |
| `Ctrl+P` | 导出 PDF |
| `Ctrl+E` | 导出 HTML |
| `Ctrl+T` | 切换主题 |
| `Ctrl+B` | 切换文件树 |
| `Ctrl+U` | 检查更新 |

## 🏗️ 技术栈

- **Electron 43** — 桌面应用框架
- **markdown-it** — CommonMark / GFM 渲染引擎
- **KaTeX** — 数学公式渲染
- **Mermaid 11** — 图表渲染
- **highlight.js** — 代码语法高亮
- **electron-updater** — 自动更新

## 📁 项目结构

```
md-viewer/
├── main.js               # Electron 主进程
├── preload.js            # 安全桥接
├── src/
│   ├── index.html        # UI 布局
│   ├── style.css         # 主题和排版样式
│   ├── app.js            # 核心渲染逻辑
│   └── plugins/
│       ├── wikilinks.js  # [[链接]] 插件
│       └── math.js       # 数学公式插件
├── build/                # 编译输出
└── package.json
```

## 🔧 自行构建

```bash
# 安装依赖
npm install

# 开发运行
npm start

# 打包
npm run dist              # 便携版 .exe
npm run dist-installer    # 安装版 .exe
```

## 📜 许可证

[MIT](LICENSE) © 2026 zt310
