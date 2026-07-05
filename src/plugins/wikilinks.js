/**
 * [[双链]] 插件 for markdown-it
 * 解析 [[文件名]] 或 [[文件名|显示文字]]
 * 渲染为可点击的链接，点击触发文件导航
 */

const path = require('path');
const fs = require('fs');

function wikilinksPlugin(md, options = {}) {
  const defaultOptions = {
    basePath: '',
    onClick: null, // callback(filename, displayText)
  };

  const opts = { ...defaultOptions, ...options };

  // Match [[file]] or [[file|display text]]
  const WIKILINK_RE = /\[\[([^\[\]|]+)(?:\|([^\[\]]+))?\]\]/;

  md.inline.ruler.before('link', 'wikilink', function stateInline(state, silent) {
    const pos = state.pos;
    const max = state.posMax;
    const src = state.src;

    if (src.charCodeAt(pos) !== 0x5B /* [ */) return false;
    if (pos + 1 >= max) return false;
    if (src.charCodeAt(pos + 1) !== 0x5B /* [ */) return false;

    // Find closing ]]
    let end = pos + 2;
    while (end < max) {
      if (src.charCodeAt(end) === 0x5D /* ] */ &&
          end + 1 < max &&
          src.charCodeAt(end + 1) === 0x5D /* ] */) {
        break;
      }
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
      ['title', `打开 ${fileName}`],
    ];
    token.markup = '[[';

    const textToken = state.push('text', '', 0);
    textToken.content = displayText;

    state.push('wikilink_close', 'a', -1);

    state.pos = end + 2;
    return true;
  });
}

module.exports = wikilinksPlugin;
