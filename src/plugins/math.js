/**
 * Math formula plugin for markdown-it
 * Renders $...$ (inline) and $$...$$ (block) math with KaTeX
 * Acts as a markdown-it plugin that delegates to KaTeX
 */

function mathPlugin(md, options = {}) {
  // Inline math: $...$
  md.inline.ruler.before('escape', 'math_inline', function(state, silent) {
    let pos = state.pos;
    const max = state.posMax;
    
    if (pos + 1 >= max) return false;
    if (state.src.charCodeAt(pos) !== 0x24 /* $ */) return false;
    
    // Check for display math $$
    if (state.src.charCodeAt(pos + 1) === 0x24) return false;
    
    // Find closing $
    let end = pos + 1;
    while (end < max) {
      if (state.src.charCodeAt(end) === 0x24 && state.src.charCodeAt(end - 1) !== 0x5C) {
        break;
      }
      end++;
    }
    if (end >= max) return false;
    
    if (silent) return true;
    
    const content = state.src.slice(pos + 1, end);
    if (!content.trim()) return false;
    
    const token = state.push('math_inline', 'span', 0);
    token.content = content;
    token.attrs = [['class', 'math-inline']];
    token.markup = '$';
    
    state.pos = end + 1;
    return true;
  });

  // Display math: $$...$$
  md.block.ruler.before('fence', 'math_block', function(state, startLine, endLine, silent) {
    let pos = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];
    
    if (pos + 1 >= max) return false;
    if (state.src.charCodeAt(pos) !== 0x24) return false;
    if (state.src.charCodeAt(pos + 1) !== 0x24) return false;
    
    // Check for third $ (this is a code fence)
    if (pos + 2 < max && state.src.charCodeAt(pos + 2) === 0x24) return false;
    
    if (silent) return true;
    
    // Find closing $$
    const startContent = pos + 2;
    let content = '';
    let line = startLine;
    let found = false;
    
    while (line < endLine) {
      const lineStart = state.bMarks[line] + state.tShift[line];
      const lineEnd = state.eMarks[line];
      const lineText = state.src.slice(lineStart, lineEnd).trim();
      
      if (lineText === '$$') {
        found = true;
        break;
      }
      
      if (line > startLine) content += '\n';
      content += state.src.slice(lineStart, lineEnd);
      line++;
    }
    
    if (!found) return false;
    
    const token = state.push('math_block', 'div', 0);
    token.content = content.trim();
    token.attrs = [['class', 'math-block']];
    token.markup = '$$';
    token.block = true;
    
    state.line = line + 1;
    return true;
  });
}

module.exports = mathPlugin;
