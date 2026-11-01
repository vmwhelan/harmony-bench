'use strict';
/* Harmony Bench server: serves the app and stores one shared library (saved tunings,
   progressions and songs) in DATA_DIR/library.json, so every browser and device sees
   the same saves. Single-user: there are no accounts and no passwords.
   It also serves HTTPS (needed for the tuner and MIDI keyboard input): it uses DATA_DIR/cert.pem and key.pem,
   creating a self-signed certificate with openssl on first start if they are missing.
   No dependencies beyond Node itself. */
const http = require('http');
const https = require('https');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = +process.env.PORT || 8080;
const HTTPS_PORT = process.env.HTTPS_PORT === undefined ? 8443 : +process.env.HTTPS_PORT;
const PUBLIC = path.join(__dirname, 'public');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const FILE = path.join(DATA_DIR, 'library.json');
const MAX_BODY = 25 * 1024 * 1024;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };

fs.mkdirSync(DATA_DIR, { recursive: true });
let store = { rev: 0, updated: null, library: { tunings: [], progressions: [], songs: [], deleted: {} } };
try { store = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) { /* first run: empty library */ }

// Write to a temporary file, then rename, so a crash never leaves a half-written library
function persist(){
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(store));
  fs.renameSync(tmp, FILE);
}
function send(res, code, body, type = 'application/json'){
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function handle(req, res){
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/health') return send(res, 200, { ok: true, rev: store.rev });
  if (url.pathname === '/api/library'){
    if (req.method === 'GET') return send(res, 200, store);
    if (req.method === 'PUT'){
      let size = 0;
      const chunks = [];
      req.on('data', c => {
        size += c.length;
        if (size > MAX_BODY){ send(res, 413, { error: 'Library is too large' }); req.destroy(); return; }
        chunks.push(c);
      });
      req.on('end', () => {
        if (res.writableEnded) return;
        let body;
        try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch (e) { return send(res, 400, { error: 'Not valid JSON' }); }
        if (!body || typeof body.library !== 'object') return send(res, 400, { error: 'Missing library' });
        // Someone else saved since this browser last loaded: it must merge first
        if (body.baseRev !== store.rev) return send(res, 409, store);
        store = { rev: store.rev + 1, updated: new Date().toISOString(), library: body.library };
        try { persist(); } catch (e) { return send(res, 500, { error: 'Could not write the library file: ' + e.message }); }
        send(res, 200, { rev: store.rev, updated: store.updated });
      });
      return;
    }
    return send(res, 405, { error: 'Method not allowed' });
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed' });
  const rel = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const file = path.join(PUBLIC, rel);
  if (!file.startsWith(PUBLIC + path.sep)) return send(res, 403, 'Forbidden', 'text/plain');
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, 'Not found', 'text/plain');
    send(res, 200, data, TYPES[path.extname(file)] || 'application/octet-stream');
  });
}

// Use DATA_DIR/cert.pem + key.pem (your own certificate), or create a self-signed one that lasts 10 years.
// HB_HOSTNAMES (comma-separated names or IP addresses of the server) are added to the certificate.
function certificate(){
  const cert = path.join(DATA_DIR, 'cert.pem'), key = path.join(DATA_DIR, 'key.pem');
  if (!fs.existsSync(cert) || !fs.existsSync(key)){
    const names = ['localhost', '127.0.0.1', ...(process.env.HB_HOSTNAMES || '').split(',').map(x => x.trim()).filter(Boolean)];
    const san = names.map(n => (/^[\d.]+$|:/.test(n) ? 'IP:' : 'DNS:') + n).join(',');
    try {
      execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-sha256', '-days', '3650', '-subj', '/CN=Harmony Bench', '-addext', 'subjectAltName=' + san, '-keyout', key, '-out', cert], { stdio: 'ignore' });
      console.log(`Created a self-signed certificate for ${names.join(', ')} in ${DATA_DIR}`);
    } catch (e) { console.log('HTTPS is off: could not create a certificate (is openssl installed?)'); return null; }
  }
  return { cert: fs.readFileSync(cert), key: fs.readFileSync(key) };
}

const servers = [http.createServer(handle).listen(PORT, () => console.log(`Harmony Bench on http port ${PORT}, library at ${FILE} (rev ${store.rev})`))];
if (HTTPS_PORT){
  const creds = certificate();
  if (creds) servers.push(https.createServer(creds, handle).listen(HTTPS_PORT, () => console.log(`Harmony Bench on https port ${HTTPS_PORT}`)));
}
for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => { servers.forEach(s => s.close()); setTimeout(() => process.exit(0), 300); });
