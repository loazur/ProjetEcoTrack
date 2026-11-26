const http = require('http');
const fs = require('fs');
const path = require('path');
const allowed = { '/': ['index.html', 'text/html; charset=utf-8'], '/app.js': ['app.js', 'text/javascript; charset=utf-8'] };
http.createServer((req, res) => {
  const entry = allowed[req.url.split('?')[0]];
  if (!entry) { res.writeHead(404); return res.end('Not found'); }
  fs.readFile(path.join(__dirname, 'public', entry[0]), (error, content) => {
    if (error) { res.writeHead(503); return res.end('Executez npm run build avant npm start.'); }
    res.writeHead(200, { 'Content-Type': entry[1] }); res.end(content);
  });
}).listen(3000, '0.0.0.0', () => console.log('Frontend sur le port 3000'));
