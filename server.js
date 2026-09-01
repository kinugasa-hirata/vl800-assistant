// Local Preview & Development Server for VL-800 Assistant (with Vercel Serverless Shim)
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Shim Vercel Serverless Function res.status().json()
function enrichResponse(res) {
  res.status = function(code) {
    this.statusCode = code;
    return this;
  };
  res.json = function(data) {
    this.setHeader('Content-Type', 'application/json; charset=utf-8');
    this.end(JSON.stringify(data));
    return this;
  };
}

const server = http.createServer(async (req, res) => {
  enrichResponse(res);
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = parsedUrl.pathname;

  // Handle Serverless API routes locally
  if (pathname === '/api/chat') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        req.body = body ? JSON.parse(body) : {};
        delete require.cache[require.resolve('./api/chat.js')];
        const handler = require('./api/chat.js');
        await handler(req, res);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
    return;
  }

  if (pathname === '/api/diagnose') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        req.body = body ? JSON.parse(body) : {};
        delete require.cache[require.resolve('./api/diagnose.js')];
        const handler = require('./api/diagnose.js');
        await handler(req, res);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
    return;
  }

  // Static file serving
  if (pathname === '/') pathname = '/index.html';
  let filePath = path.join(__dirname, 'public', pathname);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, pathname);
  }
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 VL-800 Mobile Assistant Dev Server is running!`);
  console.log(`👉 Local:   http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
