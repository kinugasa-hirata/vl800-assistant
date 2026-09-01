// Unified Server entrypoint for Vercel Node.js Server & Local Dev
const http = require('http');
const fs = require('fs');
const path = require('path');

// Static requires so Vercel bundler packages them together
const chatHandler = require('./api/chat.js');
const diagnoseHandler = require('./api/diagnose.js');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

// Shim Vercel Serverless Function helper methods res.status().json() / res.send()
function enrichResponse(res) {
  if (!res.status) {
    res.status = function(code) {
      this.statusCode = code;
      return this;
    };
  }
  if (!res.json) {
    res.json = function(data) {
      this.setHeader('Content-Type', 'application/json; charset=utf-8');
      this.end(JSON.stringify(data));
      return this;
    };
  }
  if (!res.send) {
    res.send = function(data) {
      this.end(data);
      return this;
    };
  }
}

const server = http.createServer(async (req, res) => {
  enrichResponse(res);
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = parsedUrl.pathname;

  // Handle Serverless API routes
  if (pathname === '/api/chat') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        req.body = body ? JSON.parse(body) : {};
        await chatHandler(req, res);
      } catch (err) {
        console.error('API /api/chat error:', err);
        res.status(500).json({ error: err.message || 'Internal Server Error' });
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
        await diagnoseHandler(req, res);
      } catch (err) {
        console.error('API /api/diagnose error:', err);
        res.status(500).json({ error: err.message || 'Internal Server Error' });
      }
    });
    return;
  }

  // Static file serving from public/ or root
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
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable'
      });
      res.end(content);
    }
  });
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Keyence VL-800 Assistant running on http://0.0.0.0:${PORT}`);
  });
}

module.exports = server;
