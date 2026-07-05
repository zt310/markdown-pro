/**
 * TDD Tests for MarkDown Pro
 * Run: node tests/run.js
 * 
 * These tests verify the code structure and IPC chains.
 * RED phase: all tests should fail
 * GREEN phase: all tests should pass
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let failures = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
  } catch (e) {
    console.log(`  ❌ ${name}: ${e.message}`);
    failures++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

// ========== Cycle 1: GitHub Links ==========
console.log('\n📋 Cycle 1: GitHub 外部链接');

test('preload.js exposes openExternal API', () => {
  const preload = fs.readFileSync(path.join(ROOT, 'preload.js'), 'utf8');
  assert(preload.includes('openExternal'), 'openExternal not in preload.js');
  // Extract the method line and verify it's an IPC invoke
  const match = preload.match(/openExternal:.*/);
  assert(match, 'openExternal not exposed');
  assert(match[0].includes('ipcRenderer.invoke'), 'openExternal should use invoke');
});

test('main.js handles open-external IPC', () => {
  const main = fs.readFileSync(path.join(ROOT, 'main.js'), 'utf8');
  assert(main.includes('open-external'), 'open-external IPC handler missing');
  assert(main.includes('shell.openExternal'), 'shell.openExternal not used');
});

test('app.js uses mdAPI.openExternal for GitHub/report links', () => {
  const app = fs.readFileSync(path.join(ROOT, 'src/app.js'), 'utf8');
  assert(!app.includes("window.open('https://github.com"), 'still uses window.open for github');
  assert(!app.includes("window.open('https://github.com/zt310/markdown-pro/issues"), 'still uses window.open for issues');
  assert(app.includes("openExternal"), 'app.js missing openExternal calls');
});

// ========== Cycle 2: Menu Position ==========
console.log('\n📋 Cycle 2: 菜单位置');

test('index.html: menu-trigger appears after btn-filetree', () => {
  const html = fs.readFileSync(path.join(ROOT, 'src/index.html'), 'utf8');
  const filetreePos = html.indexOf('btn-filetree');
  const menuPos = html.indexOf('menu-trigger');
  assert(filetreePos > 0, 'btn-filetree not found');
  assert(menuPos > 0, 'menu-trigger not found');
  assert(menuPos > filetreePos, 'menu-trigger is before btn-filetree (should be after)');
});

// ========== Cycle 3: Vertical Menu ==========
console.log('\n📋 Cycle 3: 竖列菜单');

test('menu-bar and menu-panel are replaced by single dropdown', () => {
  const html = fs.readFileSync(path.join(ROOT, 'src/index.html'), 'utf8');
  // Should have a single dropdown container, not the horizontal bar
  assert(html.includes('dropdown-menu'), 'dropdown-menu container missing');
  // menu-bar should NOT exist anymore (removed horizontal bar)
  assert(!html.includes('id="menu-bar"'), 'menu-bar horizontal bar still exists');
});

test('menu items rendered as vertical list in CSS', () => {
  const css = fs.readFileSync(path.join(ROOT, 'src/style.css'), 'utf8');
  assert(css.includes('.dropdown-content'), 'dropdown-content class missing');
  assert(css.includes('flex-direction: column'), 'not vertical column');
});

// ========== Cycle 4: Editing ==========
console.log('\n📋 Cycle 4: .md 编辑功能');

test('edit button exists in toolbar', () => {
  const html = fs.readFileSync(path.join(ROOT, 'src/index.html'), 'utf8');
  assert(html.includes('btn-edit'), 'edit button missing in toolbar');
  assert(html.includes('✏️') || html.includes('编辑'), 'edit button label missing');
});

test('app.js has toggleEdit function', () => {
  const app = fs.readFileSync(path.join(ROOT, 'src/app.js'), 'utf8');
  assert(app.includes('toggleEdit') || app.includes('function editMode'), 'edit mode function missing');
  assert(app.includes('contenteditable') || app.includes('textarea'), 'editable element missing');
});

test('edit mode preserves markdown content', () => {
  const app = fs.readFileSync(path.join(ROOT, 'src/app.js'), 'utf8');
  assert(app.includes('currentContent'), 'currentContent reference missing in edit mode');
});

// ========== Cycle 5: PDF Export ==========
console.log('\n📋 Cycle 5: PDF 导出验证');

test('preload.js exposes exportPdf API', () => {
  const preload = fs.readFileSync(path.join(ROOT, 'preload.js'), 'utf8');
  assert(preload.includes('exportPdf:'), 'exportPdf missing from preload');
  const match = preload.match(/exportPdf:.*\)/);
  assert(match, 'exportPdf method not found');
  assert(match[0].includes('invoke'), 'exportPdf should use invoke');
});

test('main.js handles export-pdf IPC with printToPDF', () => {
  const main = fs.readFileSync(path.join(ROOT, 'main.js'), 'utf8');
  assert(main.includes('export-pdf'), 'export-pdf IPC handler missing');
  assert(main.includes('printToPDF'), 'printToPDF call missing');
  assert(main.includes('writeFileSync'), 'file write missing after PDF generation');
});

test('app.js has exportPDF function wired to button and menu', () => {
  const app = fs.readFileSync(path.join(ROOT, 'src/app.js'), 'utf8');
  assert(app.includes('function exportPDF'), 'exportPDF function missing');
  assert(app.includes('btn-export-pdf'), 'PDF button handler missing');
  assert(app.includes("export-pdf") || app.includes("export-pdf"), 'PDF menu action missing');
});

// ========== Summary ==========
console.log(`\n${'='.repeat(40)}`);
if (failures === 0) {
  console.log('🎉 ALL TESTS PASSED');
} else {
  console.log(`❌ ${failures} TEST(S) FAILED`);
}
process.exit(failures > 0 ? 1 : 0);
