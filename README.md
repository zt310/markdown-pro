<div align="center">

# ◈ MarkDown Pro

**一个本地 Markdown 查看器 — 支持 CommonMark · GFM · Mermaid · KaTeX · 双链笔记**

完全离线，不依赖浏览器，开箱即用。

</div>

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

## 🚀 快速开始

```bash
# 1. 直接使用（无需安装）
双击 build/win-unpacked/MarkDown Pro.exe

# 2. 或从源码运行
npm install
npm start
```

## 📦 下载

从 [Releases](https://github.com/YOUR_USERNAME/markdown-pro/releases) 页面下载最新版本。

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
- **markdown-it** — CommonMark/GFM 渲染
- **KaTeX** — 数学公式
- **Mermaid 11** — 图表渲染
- **highlight.js** — 代码高亮

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

## 🔧 构建

```bash
# 安装依赖
npm install

# 开发运行
npm start

# 打包为独立 exe
npm run dist
```

## 📜 许可证

MIT
