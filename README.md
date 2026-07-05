<div align="center">

# ◈ MarkDown Pro

**一个本地 Markdown 查看器**

[![GitHub Release](https://img.shields.io/github/v/release/zt310/markdown-pro?style=flat-square&color=4f6ef7)](https://github.com/zt310/markdown-pro/releases/latest)
[![License](https://img.shields.io/github/license/zt310/markdown-pro?style=flat-square&color=4f6ef7)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows-blue?style=flat-square&color=4f6ef7)](https://github.com/zt310/markdown-pro/releases/latest)
[![Electron](https://img.shields.io/badge/Electron-43.0-47848f?style=flat-square)](https://www.electronjs.org/)

支持 CommonMark · GFM · Mermaid · KaTeX · [[双链笔记]] · 完全离线 · 不依赖浏览器

</div>

---

## 📥 下载

| 版本 | 文件 | 说明 |
|------|------|------|
| **v1.0.0** | [📦 MarkDown-Pro-Portable.zip](https://github.com/zt310/markdown-pro/releases/download/v1.0.0/MarkDown-Pro-Portable.zip) | 便携版，解压即用（推荐） |
| **v1.0.0** | [⚙️ MarkDown-Pro-Setup.exe](https://github.com/zt310/markdown-pro/releases/download/v1.0.0/MarkDown-Pro-Setup.exe) | 安装版（网络原因暂未生成） |

> 💡 便携版下载后解压到任意目录，双击 `MarkDown Pro.exe` 即可运行，无需安装。

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
| **导出 HTML** | ✅ 保留样式和代码高亮 |
| **拖拽打开** | ✅ 支持 .md 文件拖入 |

## 🚀 快速使用

```bash
# 方式 1：下载便携版，解压后双击 MarkDown Pro.exe
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
| `Ctrl+T` | 切换主题 |
| `Ctrl+E` | 导出 HTML |

## 🏗️ 技术栈

- **Electron 43** — 桌面应用框架
- **markdown-it** — CommonMark / GFM 渲染引擎
- **KaTeX** — 数学公式渲染
- **Mermaid 11** — 图表渲染
- **highlight.js** — 代码语法高亮

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
