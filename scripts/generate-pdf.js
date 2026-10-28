import { execFile } from 'node:child_process';
import { access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const BROWSER_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

async function findBrowser() {
  for (const candidate of BROWSER_CANDIDATES) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // continue
    }
  }
  throw new Error('Could not find Chrome or Edge binary to render PDF.');
}

async function generatePdf() {
  const browser = await findBrowser();
  const inputUrl = pathToFileURL(join(ROOT, 'cv.html')).href;
  const outputPdf = join(ROOT, 'Victor_Ogundipe_SWE_CV.pdf');

  await execFileAsync(browser, [
    '--headless=new',
    '--disable-gpu',
    '--no-pdf-header-footer',
    // Give web fonts time to load so the PDF never falls back to system fonts
    '--run-all-compositor-stages-before-draw',
    '--virtual-time-budget=8000',
    `--print-to-pdf=${outputPdf}`,
    inputUrl,
  ]);

  console.log(`Generated ATS-ready PDF: ${outputPdf}`);
}

generatePdf().catch((err) => {
  console.error(err);
  process.exit(1);
});
