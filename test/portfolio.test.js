import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPortfolioServer } from '../server.js';
import { PROFILE, PROJECTS, SKILL_GROUPS, EXPERIENCE, CREDENTIALS } from '../js/data.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('Portfolio Data Integrity', () => {
  it('contains the exact 7 selected software engineering projects and excludes unchecked projects', () => {
    const ids = PROJECTS.map((p) => p.id);
    assert.deepEqual(ids, [
      'thesisbridge',
      'farmpay',
      'medroute',
      'abujastory',
      'netshare',
      'codebasedna',
      'herdsense',
    ]);

    const serialized = JSON.stringify({ PROFILE, PROJECTS, SKILL_GROUPS, EXPERIENCE, CREDENTIALS });
    assert.equal(/EagleView/i.test(serialized), false, 'Should not include unchecked NRS EagleView project');
    assert.equal(/HealthTrace/i.test(serialized), false, 'Should not include unchecked HealthTrace project');
  });

  it('populates complete case-study metadata for every project', () => {
    for (const p of PROJECTS) {
      assert.ok(p.title.length > 0);
      assert.ok(p.pipeline.length >= 4);
      assert.ok(p.highlights.length >= 2);
      assert.ok(p.metrics.length === 3);
      assert.ok(p.tech.length >= 5);
    }
  });
});

describe('Modern Web Standards & Accessibility Contracts', () => {
  it('index.html enforces FOUC-free color-scheme meta, aria-hidden scroll progress, and native <dialog>', async () => {
    const html = await readFile(join(ROOT, 'index.html'), 'utf8');
    assert.match(html, /<meta name="color-scheme" content="light dark"\s*\/?>/);
    assert.match(html, /<div id="progress" aria-hidden="true"><\/div>/);
    assert.match(html, /<dialog id="project-dialog" closedby="any" aria-labelledby="dialog-title">/);
    assert.doesNotMatch(html, /<dialog[^>]*role=/);
    assert.doesNotMatch(html, /<dialog[^>]*aria-modal=/);
  });

  it('styles.css implements light-dark(), dialog scroll containment, top-layer discrete transitions, and forced-colors', async () => {
    const css = await readFile(join(ROOT, 'styles.css'), 'utf8');
    assert.match(css, /color-scheme:\s*light dark;/);
    assert.match(css, /@supports\s*\(color:\s*light-dark\(white,\s*black\)\)/);
    assert.match(css, /dialog:modal\s*\{[\s\S]*?overscroll-behavior:\s*contain;/);
    assert.match(css, /transition-behavior:\s*allow-discrete;/);
    assert.match(css, /@starting-style/);
    assert.match(css, /@media\s*\(forced-colors:\s*active\)/);
  });

  it('compiled ATS PDF exists and has valid PDF header', async () => {
    const pdfPath = join(ROOT, 'Victor_Ogundipe_SWE_CV.pdf');
    const info = await stat(pdfPath);
    assert.ok(info.size > 20_000, 'PDF should be non-trivial in size');
    const buf = await readFile(pdfPath);
    assert.equal(buf.subarray(0, 5).toString('ascii'), '%PDF-');
  });
});

describe('HTTP Server Routes & Security', () => {
  let server;
  let baseUrl;

  before(async () => {
    server = createPortfolioServer();
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const addr = server.address();
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it('serves portfolio index, standalone /cv, and downloadable PDF attachment', async () => {
    const homeRes = await fetch(`${baseUrl}/`);
    assert.equal(homeRes.status, 200);
    assert.match(homeRes.headers.get('content-type') || '', /text\/html/);

    const cvRes = await fetch(`${baseUrl}/cv`);
    assert.equal(cvRes.status, 200);
    const cvText = await cvRes.text();
    assert.match(cvText, /VICTOR OLUWATOBILOBA OGUNDIPE/);

    const pdfRes = await fetch(`${baseUrl}/Victor_Ogundipe_SWE_CV.pdf?download=1`);
    assert.equal(pdfRes.status, 200);
    assert.equal(pdfRes.headers.get('content-type'), 'application/pdf');
    assert.match(pdfRes.headers.get('content-disposition') || '', /attachment; filename="Victor_Ogundipe_SWE_CV\.pdf"/);
  });
});
