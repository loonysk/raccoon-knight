/* Сборка одной самодостаточной страницы для публикации.
   Заодно проставляет версию ассетов в index.html — без неё браузер после
   деплоя тянет из кеша старые js/css, и правки доезжают до игрока не сразу. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const R = __dirname;
const MODULES = ['i18n', 'pixel', 'art', 'art2', 'bg', 'level', 'game'];   // reach.js — только для разработки

const css = fs.readFileSync(path.join(R, 'css/style.css'), 'utf8');
const js = MODULES
  .map(m => '/* ===== ' + m + '.js ===== */\n' + fs.readFileSync(path.join(R, 'js/' + m + '.js'), 'utf8'))
  .join('\n\n');

/* ---------- версия ассетов в index.html ---------- */
const stamp = crypto.createHash('sha1').update(css + js).digest('hex').slice(0, 8);
let html = fs.readFileSync(path.join(R, 'index.html'), 'utf8');
const stamped = html.replace(
  /(src|href)="((?:js|css)\/[^"?]+)(\?v=[^"]*)?"/g,
  (_m, attr, file) => attr + '="' + file + '?v=' + stamp + '"'
);
if (stamped !== html) {
  fs.writeFileSync(path.join(R, 'index.html'), stamped);
  html = stamped;
}

/* ---------- однофайловая сборка ---------- */
const body = html
  .slice(html.indexOf('<body>') + 6, html.indexOf('<script src='))
  .trim();

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
console.log('версия ассетов:', stamp);
console.log('dist/raccoon-knight.html —', Math.round(out.length / 1024) + ' KB');
