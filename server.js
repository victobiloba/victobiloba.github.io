import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4173;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.pdf': 'application/pdf',
  '.md': 'text/markdown; charset=utf-8',
  '.ico': 'image/x-icon',
};

export function createPortfolioServer() {
  return createServer(async (req, res) => {
    try {
      const parsed = new URL(req.url || '/', 'http://localhost');
      let pathname = decodeURIComponent(parsed.pathname);
      if (pathname === '/') pathname = '/index.html';
      if (pathname === '/cv') pathname = '/cv.html';

      let target = normalize(join(ROOT, pathname));
      if (!target.startsWith(ROOT)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Forbidden');
        return;
      }

      const info = await stat(target).catch(() => null);
      if (info?.isDirectory()) {
        target = join(target, 'index.html');
      }

      const data = await readFile(target);
      const ext = extname(target).toLowerCase();
      const headers = {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache',
      };

      if (ext === '.pdf' && parsed.searchParams.get('download') === '1') {
        headers['Content-Disposition'] = 'attachment; filename="Victor_Ogundipe_SWE_CV.pdf"';
      }

      res.writeHead(200, headers);
      res.end(data);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
    }
  });
}

if (process.argv[1] && normalize(process.argv[1]) === normalize(fileURLToPath(import.meta.url))) {
  const server = createPortfolioServer();
  server.listen(PORT, () => {
    console.log(`Victor Ogundipe Portfolio running at http://localhost:${PORT}`);
    console.log(`Standalone Printable CV at http://localhost:${PORT}/cv`);
  });
}
