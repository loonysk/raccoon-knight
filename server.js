/* статика + приём скриншотов канваса в файл */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };

http.createServer((req, res) => {
  if (req.method === 'POST' && req.url.startsWith('/shot')) {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      const name = (new URL(req.url, 'http://x').searchParams.get('n') || 'shot') + '.png';
      const b64 = body.replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync(path.join(ROOT, 'shots', name), Buffer.from(b64, 'base64'));
      res.writeHead(200, { 'access-control-allow-origin': '*' });
      res.end('ok ' + name);
    });
    return;
  }
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    res.writeHead(404); res.end('404'); return;
  }
  res.writeHead(200, {
    'content-type': MIME[path.extname(f)] || 'application/octet-stream',
    'cache-control': 'no-store'
  });
  fs.createReadStream(f).pipe(res);
}).listen(5179, () => console.log('http://localhost:5179'));
