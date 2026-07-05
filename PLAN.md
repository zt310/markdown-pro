# MarkDown Pro — 架构与开发计划

## 技术栈
| 层 | 选型 | 理由 |
|----|------|------|
| 框架 | **Electron 33** | 真正的桌面 .exe，自带 Chromium，不依赖系统浏览器 |
| 渲染引擎 | **markdown-it + 插件** | CommonMark 兼容、GFM 支持、插件生态丰富 |
| 数学公式 | **KaTeX** | 比 MathJax 快 10 倍，轻量 |
| 图表 | **Mermaid 11** | 流程图、时序图、甘特图等 |
| 代码高亮 | **highlight.js** | 190+ 语言，自动检测 |
| 双链 | **自定义插件** | [[wikilink]] 解析 + 文件导航 |
| MDX | **部分支持**（JSX 组件渲染为代码块）| 完整 MDX 需要 React 运行时 |
| 打包 | **electron-builder** | 生成单个安装包 / 便携版 .exe |

## 功能规划（优先级排序）

### P0 — 核心（必须有）
- [x] 打开 .md / .markdown / .txt 文件
- [x] 保存 / 另存为 .md
- [x] CommonMark 全语法（标题、列表、表格、代码块等）
- [x] GFM 扩展（任务列表、删除线、自动链接、emoji）
- [x] 实时渲染预览
- [x] 暗色/亮色主题
- [x] 代码语法高亮
- [x] 导出 HTML

### P1 — 增强（本周要）
- [x] LaTeX 数学公式（行内 $...$ 和块级 $$...$$）
- [x] Mermaid 图表渲染
- [x] [[双链]] 笔记（点击跳转同目录 .md 文件）
- [x] 文件树侧栏
- [x] 拖拽打开文件
- [x] 自动滚动同步（编辑 ↔ 预览）

### P2 — 锦上添花
- [ ] TOC 目录大纲侧栏
- [ ] 搜索（全文搜索当前文件 / 目录）
- [ ] 图片粘贴 / 拖拽
- [ ] PDF 导出（通过 Electron printToPDF）
- [ ] 多标签页
- [ ] MDX 基本支持（JSX 内容展示）

## 项目结构
```
C:\pcb\md-viewer\
├── package.json
├── main.js              # Electron 主进程
├── preload.js           # 安全桥接
├── src/
│   ├── index.html       # UI 布局
│   ├── style.css        # 主题样式
│   ├── app.js           # 应用逻辑
│   ├── plugins/
│   │   ├── wikilinks.js # [[链接]] 插件
│   │   └── math.js      # KaTeX 集成
│   └── assets/
│       └── icon.png
├── build/               # 打包输出
└── .electron-builder.yml# 打包配置
```

## 数据流
```
用户操作 (打开文件 / 输入)
    │
    ▼
main.js (Electron 主进程)
    │  ├── 文件 I/O (fs)
    │  ├── 窗口管理
    │  └── 原生菜单/对话框
    │
    ▼
renderer (index.html)
    │  ├── markdown-it 解析 → HTML
    │  ├── KaTeX 渲染公式
    │  ├── Mermaid 渲染图表
    │  └── 自定义 CSS 美化
    │
    ▼
    WebView 渲染显示
```

## 关键依赖版本
| 包 | 版本 | 大小 |
|----|------|------|
| electron | ^33.x | ~60MB |
| markdown-it | ^14.x | ~200KB |
| markdown-it-gfm | ^0.x | ~50KB |
| katex | ^0.16.x | ~500KB |
| mermaid | ^11.x | ~2MB |
| highlight.js | ^11.x | ~1MB |
| electron-builder (dev) | ^25.x | — |
