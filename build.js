/* сборка одной самодостаточной страницы для публикации */
const fs = require('fs');
const path = require('path');
const R = __dirname;

const css = fs.readFileSync(path.join(R, 'css/style.css'), 'utf8');
const html = fs.readFileSync(path.join(R, 'index.html'), 'utf8');

/* тело страницы: всё между <body> и первым <script>, dev-модуль не берём */
const body = html
  .slice(html.indexOf('<body>') + 6, html.indexOf('<script src='))
  .trim();

const MODULES = ['i18n', 'pixel', 'art', 'art2', 'bg', 'level', 'game'];   // reach.js — только для разработки
const js = MODULES
  .map(m => '/* ===== ' + m + '.js ===== */\n' + fs.readFileSync(path.join(R, 'js/' + m + '.js'), 'utf8'))
  .join('\n\n');

const out = [
  '<title>Raccoon Knight</title>',
  '<style>',
  css,
  '</style>',
  '',
  body,
  '',
  '<script>',
  '(function () {',
  js,
  '})();',
  '<\/script>',
  ''
].join('\n');

fs.writeFileSync(path.join(R, 'dist/raccoon-knight.html'), out);
console.log('dist/raccoon-knight.html —', Math.round(out.length / 1024) + ' KB');
