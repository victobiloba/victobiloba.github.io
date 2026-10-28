import { PROFILE, PROJECTS, SKILL_GROUPS, EXPERIENCE, CREDENTIALS } from './data.js';
import { confetti, countUp, decodeOnView, initDotField, initTilt, matrixRain, reducedMotion, revealOnView } from './fx.js';
import { createProgress } from './achievements.js';
import { initTerminal } from './terminal.js';
import { initPalette } from './palette.js';

const CV_PDF_URL = './Victor_Ogundipe_SWE_CV.pdf?download=1';
const wait = (ms) => new Promise((r) => setTimeout(r, reducedMotion.matches ? Math.min(ms, 80) : ms));

const progress = createProgress({
  toastRegion: document.getElementById('toasts'),
  projectIds: PROJECTS.map((p) => p.id),
});

/* ==========================================================================
   1. Two-State Dark Mode Toggle
   - Toggles to the opposite of the currently rendered scheme.
   - Removes the localStorage key when the target matches the OS preference so
     the site returns cleanly to "light dark" system tracking.
   - Never clears the stored value inside a matchMedia change listener.
   ========================================================================== */
const DEFAULT_SCHEME = 'light'; // Solarized Light unless the visitor picks dark
const schemeMeta = document.querySelector('meta[name="color-scheme"]');
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const themeBtn = document.getElementById('theme-toggle');

function getStoredScheme() {
  try {
    const val = localStorage.getItem('color-scheme');
    return val === 'light' || val === 'dark' ? val : null;
  } catch {
    return null;
  }
}

function getRenderedScheme() {
  return getStoredScheme() ?? DEFAULT_SCHEME;
}

function syncThemeColor() {
  themeColorMeta?.setAttribute('content', getRenderedScheme() === 'dark' ? '#002b36' : '#fdf6e3');
}

function applySchemeMeta(storedValue) {
  if (schemeMeta) {
    schemeMeta.content = storedValue ?? DEFAULT_SCHEME;
  }
  syncThemeColor();
}

function setTheme(requested) {
  const current = getRenderedScheme();
  const target = requested ?? (current === 'dark' ? 'light' : 'dark');
  if (target === current) return target;

  const apply = () => {
    if (target === DEFAULT_SCHEME) {
      try {
        localStorage.removeItem('color-scheme');
      } catch {}
      applySchemeMeta(null);
    } else {
      try {
        localStorage.setItem('color-scheme', target);
      } catch {}
      applySchemeMeta(target);
    }
  };

  if (document.startViewTransition && !reducedMotion.matches) {
    document.startViewTransition(apply);
  } else {
    apply();
  }
  progress.unlock('theme');
  return target;
}

themeBtn?.addEventListener('click', () => setTheme());
syncThemeColor();

window.addEventListener('storage', (event) => {
  if (event.key === 'color-scheme') {
    const next = event.newValue === 'light' || event.newValue === 'dark' ? event.newValue : null;
    applySchemeMeta(next);
  }
});

/* ==========================================================================
   2. Top-Layer <dialog> Exit Animation & Light-Dismiss Fallbacks
   ========================================================================== */
let supportsDisplayTransition;
function canTransitionDisplay() {
  if (supportsDisplayTransition !== undefined) return supportsDisplayTransition;
  if (!window.CSS?.supports?.('transition-behavior', 'allow-discrete') || !document.body) {
    return false;
  }
  const probe = document.createElement('div');
  probe.style.cssText = 'transition: display 1s allow-discrete !important; display: block;';
  document.body.appendChild(probe);
  getComputedStyle(probe).display;
  probe.style.display = 'none';
  supportsDisplayTransition = getComputedStyle(probe).display === 'block';
  probe.remove();
  return supportsDisplayTransition;
}

function supportsTopLayerExit() {
  return window.CSS?.supports?.('overlay', 'auto') && canTransitionDisplay();
}

async function closeTopLayer(dialogEl) {
  if (!dialogEl.open) return;
  if (!supportsTopLayerExit()) {
    dialogEl.setAttribute('data-closing', '');
    const animations = dialogEl.getAnimations({ subtree: true });
    if (animations.length > 0) {
      await Promise.race([
        Promise.allSettled(animations.map((a) => a.finished)),
        new Promise((r) => setTimeout(r, 400)),
      ]);
    }
    if (!dialogEl.hasAttribute('data-closing')) return;
    dialogEl.removeAttribute('data-closing');
  }
  dialogEl.close();
}

function wireDialog(dialogEl) {
  if (!dialogEl) return;
  dialogEl.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeTopLayer(dialogEl);
  });

  dialogEl.addEventListener('close', () => {
    dialogEl.returnValue = '';
    dialogEl.removeAttribute('data-closing');
  });

  // Fallback for browsers where <dialog closedby="any"> is not yet implemented
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    const isOutside = (e, dlg) => {
      const r = dlg.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    let pressedOutside = false;
    dialogEl.addEventListener('pointerdown', (e) => {
      pressedOutside = isOutside(e, dialogEl);
    });
    dialogEl.addEventListener('pointerup', (e) => {
      if (pressedOutside && isOutside(e, dialogEl)) {
        closeTopLayer(dialogEl);
      }
      pressedOutside = false;
    });
  }
}

const projectDialog = document.getElementById('project-dialog');
const paletteDialog = document.getElementById('palette');
wireDialog(projectDialog);
wireDialog(paletteDialog);

document.getElementById('dialog-close-btn')?.addEventListener('click', () => {
  if (projectDialog) closeTopLayer(projectDialog);
});

/* ==========================================================================
   3. Helpers
   ========================================================================== */
function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/* Decorative per-project tones from the Solarized blues (glows, dots and lines, never text) */
const SOLAR_BLUE = '#268bd2';
const SOLAR_CYAN = '#2aa198';
const SOLAR_VIOLET = '#6c71c4';
const TONES = {
  indigo: SOLAR_BLUE,
  emerald: SOLAR_CYAN,
  rose: SOLAR_VIOLET,
  amber: SOLAR_BLUE,
  cyan: SOLAR_CYAN,
  violet: SOLAR_VIOLET,
  teal: SOLAR_BLUE,
};

const ARROW_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const CHECK_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const EXTERNAL_ICON = '<span aria-hidden="true">↗</span>';

const SKILL_ICONS = {
  code: '<path d="m8 17-5-5 5-5M16 7l5 5-5 5M14 4l-4 16"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
  server:
    '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
  spark: '<path d="M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6-5.6-1.9 5.6-1.9Z"/><path d="M19 17v4M17 19h4"/>',
  shield: '<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
  bot: '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01M9.5 16.5h5"/>',
};

function skillIcon(name) {
  const paths = SKILL_ICONS[name] ?? SKILL_ICONS.code;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

function toneOf(proj) {
  return TONES[proj.accent] ?? TONES.indigo;
}

function repoBadge(proj) {
  // Links to the (public) profile page get no badge; only real repos are labelled
  if (proj.repoUrl === PROFILE.github) return '';
  return proj.isPublicRepo
    ? '<span class="repo-badge is-public">Public</span>'
    : '<span class="repo-badge">Private</span>';
}

function localTime({ full = false } = {}) {
  const opts = full
    ? { timeZone: 'Africa/Lagos', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }
    : { timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit' };
  return `${new Intl.DateTimeFormat('en-GB', opts).format(new Date())} WAT (UTC+1)`;
}

function downloadCv() {
  const a = document.createElement('a');
  a.href = CV_PDF_URL;
  a.download = 'Victor_Ogundipe_SWE_CV.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function copyEmail() {
  try {
    await navigator.clipboard.writeText(PROFILE.email);
    return true;
  } catch {
    return false;
  }
}

function celebrate(fromEl) {
  const rect = fromEl?.getBoundingClientRect?.();
  confetti(rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 3 } : {});
}

/* ==========================================================================
   4. Projects
   ========================================================================== */
const projectsGrid = document.getElementById('projects-grid');

function renderMetrics(metrics, cls = 'card-metric') {
  return metrics
    .map(
      (m) => `<div class="${cls}"><strong>${escapeHtml(m.value)}</strong><span>${escapeHtml(m.label)}</span></div>`,
    )
    .join('');
}

function renderPills(tech, limit = tech.length) {
  const shown = tech
    .slice(0, limit)
    .map((t) => `<li class="tech-pill">${escapeHtml(t)}</li>`)
    .join('');
  const extra = tech.length - limit;
  return extra > 0 ? `${shown}<li class="tech-pill more">+${extra} more</li>` : shown;
}

function renderCover(proj) {
  const nodes = proj.pipeline
    .map((s) => `<li><span class="node-dot"></span><span class="node-label">${escapeHtml(s.step)}</span></li>`)
    .join('');
  return `
    <div class="cover" aria-hidden="true">
      <span class="cover-num">${escapeHtml(proj.number)}</span>
      <span class="cover-tag">${proj.pipeline.length}-stage pipeline</span>
      <div class="flow" style="--n: ${proj.pipeline.length}">
        <span class="flow-track"><span class="flow-pulse"></span></span>
        <ol class="flow-nodes">${nodes}</ol>
      </div>
    </div>`;
}

function renderTrace(proj) {
  const steps = proj.pipeline
    .map(
      (s, i) => `
      <li>
        <span class="t-idx">${String(i + 1).padStart(2, '0')}</span>
        <span class="t-text"><strong>${escapeHtml(s.step)}</strong><span>${escapeHtml(s.detail)}</span></span>
      </li>`,
    )
    .join('');
  return `
    <div class="trace">
      <div class="trace-win" role="group" aria-label="${escapeHtml(proj.title)} system pipeline">
        <div class="trace-head" aria-hidden="true">
          <span>${escapeHtml(proj.id)} / pipeline</span>
          <span>${proj.pipeline.length} stages</span>
        </div>
        <ol class="trace-steps">${steps}</ol>
      </div>
    </div>`;
}

function openLabel(proj) {
  return progress.explored.has(proj.id) ? 'Explored · read again' : 'Read case study';
}

function renderProjectLink(proj) {
  if (proj.liveUrl) {
    return `
      <a class="repo-link is-live" href="${escapeHtml(proj.liveUrl)}" target="_blank" rel="noopener noreferrer">
        <span>${escapeHtml(proj.liveLabel ?? proj.liveUrl)}</span>
        <span class="repo-badge is-live"><span class="live-dot" aria-hidden="true"></span>Live</span>
        ${EXTERNAL_ICON}
      </a>`;
  }
  return `
      <a class="repo-link" href="${escapeHtml(proj.repoUrl)}" target="_blank" rel="noopener noreferrer">
        <span>${escapeHtml(proj.repoLabel)}</span>
        ${repoBadge(proj)}
        ${EXTERNAL_ICON}
      </a>`;
}

function renderCardFooter(proj) {
  return `
    <div class="card-footer">
      <button type="button" class="card-open" data-open-project="${escapeHtml(proj.id)}" aria-haspopup="dialog">
        <span class="explored-check" aria-hidden="true">${CHECK_ICON}</span>
        <span><span class="open-label">${openLabel(proj)}</span><span class="sr-only">: ${escapeHtml(proj.title)}</span></span>
        ${ARROW_ICON}
      </button>
      ${renderProjectLink(proj)}
    </div>`;
}

function renderProjectCard(proj, isFlagship) {
  const tone = toneOf(proj);
  const style = `--tone: ${tone}; view-transition-name: proj-${escapeHtml(proj.id)};`;
  const explored = progress.explored.has(proj.id) ? ' is-explored' : '';
  const meta = isFlagship
    ? `<span><span class="flagship-badge">Flagship</span> · ${escapeHtml(proj.categoryLabels.join(' / '))}</span>`
    : `<span>${escapeHtml(proj.categoryLabels[0])}</span>`;

  const body = `
    <div class="card-body">
      <div class="card-meta">${meta}<span>${escapeHtml(proj.period)}</span></div>
      <h3 class="proj-title">${escapeHtml(proj.title)}</h3>
      <p class="proj-tagline">${escapeHtml(proj.tagline)}</p>
      <p class="proj-summary">${escapeHtml(proj.summary)}</p>
      <div class="card-metrics">${renderMetrics(proj.metrics)}</div>
      <ul class="tech-pills" aria-label="Technologies">${renderPills(proj.tech, isFlagship ? 10 : 5)}</ul>
    </div>`;

  const cls = `project-card${isFlagship ? ' flagship' : ''}${explored} reveal`;
  const inner = isFlagship
    ? `${body}${renderCardFooter(proj)}${renderTrace(proj)}`
    : `${renderCover(proj)}${body}${renderCardFooter(proj)}`;
  return `<article class="${cls}" data-id="${escapeHtml(proj.id)}" style="${style}">${inner}</article>`;
}

function renderProjects(activeFilter = 'all') {
  if (!projectsGrid) return;
  const visible =
    activeFilter === 'all' ? PROJECTS : PROJECTS.filter((p) => p.categories.includes(activeFilter));

  projectsGrid.innerHTML = visible
    .map((proj, index) => renderProjectCard(proj, activeFilter === 'all' && index === 0))
    .join('');
}

function syncExploredCards() {
  projectsGrid?.querySelectorAll('.project-card[data-id]').forEach((card) => {
    const proj = PROJECTS.find((p) => p.id === card.dataset.id);
    if (!proj) return;
    card.classList.toggle('is-explored', progress.explored.has(proj.id));
    const label = card.querySelector('.open-label');
    if (label) label.textContent = openLabel(proj);
  });
}

/* Cursor spotlight + subtle 3D tilt on project cards */
initTilt(projectsGrid);

/* Filter chip counts derived from the data, so they never drift */
document.querySelectorAll('[data-count]').forEach((el) => {
  const k = el.getAttribute('data-count');
  el.textContent = String(k === 'all' ? PROJECTS.length : PROJECTS.filter((p) => p.categories.includes(k)).length);
});

/* Filter bar with View Transitions progressive enhancement */
const filterChips = document.querySelectorAll('.filter-chip');
filterChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    if (chip.getAttribute('aria-pressed') === 'true') return;
    const filter = chip.getAttribute('data-filter') || 'all';
    const update = () => {
      filterChips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      renderProjects(filter);
    };
    if (!document.startViewTransition || reducedMotion.matches) {
      update();
    } else {
      document.startViewTransition(update);
    }
  });
});

/* ==========================================================================
   5. Case-Study Modal: content, next/prev browsing, pipeline simulation
   ========================================================================== */
const pipelineEl = document.getElementById('dialog-pipeline');
const runBtn = document.getElementById('dialog-run');
const runLabel = runBtn?.querySelector('.run-label');
const runStatus = document.getElementById('dialog-run-status');
const nextBtn = document.getElementById('dialog-next');
const nextLabel = document.getElementById('dialog-next-label');
const prevBtn = document.getElementById('dialog-prev');
let currentIndex = -1;
let runToken = 0;

function resetSimulation() {
  runToken += 1;
  if (runBtn) runBtn.disabled = false;
  if (runLabel) runLabel.textContent = 'Simulate flow';
  if (runStatus) runStatus.textContent = '';
}

async function simulateFlow() {
  if (!pipelineEl) return;
  const token = ++runToken;
  const steps = [...pipelineEl.children];
  steps.forEach((s) => s.classList.remove('is-running', 'is-done'));
  pipelineEl.classList.add('is-simulating');
  runBtn.disabled = true;
  runLabel.textContent = 'Running…';

  for (let i = 0; i < steps.length; i += 1) {
    if (token !== runToken || !projectDialog?.open) return;
    const stepName = steps[i].querySelector('.step-text strong')?.textContent ?? '';
    steps[i].classList.add('is-running');
    runStatus.textContent = `Stage ${i + 1}/${steps.length} · ${stepName}…`;
    await wait(650);
    if (token !== runToken) return;
    steps[i].classList.remove('is-running');
    steps[i].classList.add('is-done');
  }

  pipelineEl.classList.remove('is-simulating');
  runStatus.textContent = `✓ All ${steps.length} stages passed. End-to-end flow simulated.`;
  runBtn.disabled = false;
  runLabel.textContent = 'Run again';
  progress.unlock('pipeline');
}

runBtn?.addEventListener('click', simulateFlow);

function fillProjectModal(proj) {
  projectDialog.style.setProperty('--tone', toneOf(proj));
  document.getElementById('dialog-meta').textContent = `${proj.number} / ${String(PROJECTS.length).padStart(2, '0')} · ${proj.categoryLabels.join(' · ')} · ${proj.period}`;
  document.getElementById('dialog-title').textContent = proj.title;
  document.getElementById('dialog-tagline').textContent = proj.tagline;
  document.getElementById('dialog-metrics').innerHTML = renderMetrics(proj.metrics, 'modal-metric');
  document.getElementById('dialog-problem').textContent = proj.problem;
  pipelineEl.innerHTML = proj.pipeline
    .map(
      (s, i) => `
      <li>
        <span class="step-num" aria-hidden="true"><span class="step-n">${String(i + 1).padStart(2, '0')}</span>${CHECK_ICON}</span>
        <span class="step-text"><strong>${escapeHtml(s.step)}</strong><span>${escapeHtml(s.detail)}</span></span>
      </li>`,
    )
    .join('');
  document.getElementById('dialog-highlights').innerHTML = proj.highlights
    .map((h) => `<li>${escapeHtml(h)}</li>`)
    .join('');
  document.getElementById('dialog-verification').textContent = proj.verification;
  document.getElementById('dialog-tech').innerHTML = renderPills(proj.tech);

  const liveLink = document.getElementById('dialog-live-link');
  const liveLabel = document.getElementById('dialog-live-label');
  if (liveLink && liveLabel) {
    liveLink.hidden = !proj.liveUrl;
    if (proj.liveUrl) {
      liveLink.href = proj.liveUrl;
      liveLabel.textContent = `Visit ${proj.liveLabel ?? 'live site'} ↗`;
    }
  }

  const repoLink = document.getElementById('dialog-repo-link');
  const repoLabel = document.getElementById('dialog-repo-label');
  if (repoLink && repoLabel) {
    // A private repo link only 404s for visitors, so hide it when a live site exists
    repoLink.hidden = Boolean(proj.liveUrl) && !proj.isPublicRepo;
    repoLink.href = proj.repoUrl;
    repoLabel.textContent = proj.isPublicRepo ? 'View source on GitHub ↗' : `${proj.repoLabel} ↗`;
  }

  const walkthrough = document.getElementById('dialog-walkthrough');
  if (walkthrough) {
    walkthrough.hidden = proj.isPublicRepo;
    walkthrough.textContent = proj.liveUrl ? 'Request a code walkthrough' : 'Request a walkthrough';
    walkthrough.href = `mailto:${PROFILE.email}?subject=${encodeURIComponent(`Walkthrough request: ${proj.title}`)}`;
  }

  const next = PROJECTS[(currentIndex + 1) % PROJECTS.length];
  if (nextLabel) nextLabel.textContent = `Next: ${next.title}`;
}

function openProjectModal(projectId) {
  const index = PROJECTS.findIndex((p) => p.id === projectId);
  if (index < 0 || !projectDialog) return;
  const proj = PROJECTS[index];
  currentIndex = index;
  resetSimulation();
  fillProjectModal(proj);

  if (projectDialog.open) {
    projectDialog.classList.remove('is-swapping');
    void projectDialog.offsetWidth;
    projectDialog.classList.add('is-swapping');
  } else {
    projectDialog.showModal();
  }
  projectDialog.scrollTop = 0;

  const isNew = progress.markExplored(proj.id);
  if (isNew && progress.explored.size === PROJECTS.length) {
    progress.unlock('all-cases');
    setTimeout(() => {
      celebrate(projectDialog);
      progress.toast({
        icon: '🎉',
        title: 'You’ve explored every system!',
        desc: 'Thanks for reading this far. Want to talk about a role?',
        action: { label: 'Email Victor', run: () => (window.location.href = `mailto:${PROFILE.email}`) },
      });
    }, 350);
  }
}

function stepProject(delta) {
  if (currentIndex < 0) return;
  const nextIndex = (currentIndex + delta + PROJECTS.length) % PROJECTS.length;
  openProjectModal(PROJECTS[nextIndex].id);
}

nextBtn?.addEventListener('click', () => stepProject(1));
prevBtn?.addEventListener('click', () => stepProject(-1));

projectDialog?.addEventListener('keydown', (event) => {
  if (event.target.closest('input, textarea')) return;
  if (event.key === 'ArrowRight') {
    event.preventDefault();
    stepProject(1);
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault();
    stepProject(-1);
  }
});

projectDialog?.addEventListener('close', resetSimulation);

document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-open-project]');
  if (!trigger) return;
  openProjectModal(trigger.getAttribute('data-open-project'));
});

/* ==========================================================================
   6. Skills, Experience, Credentials & Embedded CV
   ========================================================================== */
const projectByTitle = new Map(PROJECTS.map((p) => [p.title.toLowerCase(), p]));

function renderProvenIn(provenIn) {
  return provenIn
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => {
      const proj = projectByTitle.get(name.toLowerCase());
      return proj
        ? `<button type="button" class="proven-chip" data-open-project="${escapeHtml(proj.id)}" aria-haspopup="dialog">${escapeHtml(name)}</button>`
        : `<span class="proven-text">${escapeHtml(name)}</span>`;
    })
    .join('');
}

function timelineCaseLink(entry) {
  const proj = entry.projectId && PROJECTS.find((p) => p.id === entry.projectId);
  if (!proj) return '';
  return `<button type="button" class="timeline-link" data-open-project="${escapeHtml(proj.id)}" aria-haspopup="dialog">Read the ${escapeHtml(proj.title)} case study ${ARROW_ICON}</button>`;
}

function renderStaticSections() {
  const skillsEl = document.getElementById('skills-matrix');
  if (skillsEl) {
    skillsEl.innerHTML = SKILL_GROUPS.map(
      (g) => `
      <article class="skill-card reveal">
        <div class="skill-top">
          <span class="skill-icon">${skillIcon(g.icon)}</span>
          <h3>${escapeHtml(g.title)}</h3>
        </div>
        <ul class="tech-pills" aria-label="${escapeHtml(g.title)} tools">${renderPills(g.items)}</ul>
        <div class="skill-proven">
          <span class="proven-label">Proven in</span>
          ${renderProvenIn(g.provenIn)}
        </div>
      </article>`,
    ).join('');
  }

  const expEl = document.getElementById('experience-timeline');
  if (expEl) {
    expEl.innerHTML = EXPERIENCE.map(
      (e) => `
      <li class="timeline-item reveal">
        <p class="timeline-period">${escapeHtml(e.period)}</p>
        <h4>${escapeHtml(e.role)}</h4>
        <p class="timeline-org">${escapeHtml(e.org)}</p>
        <p class="timeline-stack">${escapeHtml(e.stack)}</p>
        <ul class="timeline-points">
          ${e.points.map((pt) => `<li>${escapeHtml(pt)}</li>`).join('')}
        </ul>
        ${timelineCaseLink(e)}
      </li>`,
    ).join('');
  }

  const credEl = document.getElementById('credentials-list');
  if (credEl) {
    credEl.innerHTML = CREDENTIALS.map(
      (c) => `
      <li class="cred-card reveal">
        <span class="cred-badge">${escapeHtml(c.badge)}</span>
        <h4>${escapeHtml(c.title)}</h4>
        <p class="cred-meta">${escapeHtml(c.meta)}</p>
        <p class="cred-detail">${escapeHtml(c.detail)}</p>
      </li>`,
    ).join('');
  }

  /* Embedded CV sections */
  const cvProjEl = document.getElementById('embedded-cv-projects');
  if (cvProjEl) {
    cvProjEl.innerHTML = PROJECTS.map(
      (p, idx) => `
      <div class="cv-item ${idx === 5 ? 'cv-extra' : ''}">
        <div class="cv-item-head">
          <h3>${escapeHtml(p.title)} — ${escapeHtml(p.tagline)}</h3>
          <span class="cv-item-date">${escapeHtml(p.period)}</span>
        </div>
        <p class="cv-item-tech">${escapeHtml(p.tech.slice(0, 7).join(' · '))}</p>
        <ul>
          ${p.highlights
            .map((h, hIdx) => `<li class="${hIdx === 2 ? 'cv-extra' : ''}">${escapeHtml(h)}</li>`)
            .join('')}
        </ul>
      </div>`,
    ).join('');
  }

  const cvExpEl = document.getElementById('embedded-cv-experience');
  if (cvExpEl) {
    cvExpEl.innerHTML = EXPERIENCE.map(
      (e, idx) => `
      <div class="cv-item ${idx === 2 ? 'cv-extra' : ''}">
        <div class="cv-item-head">
          <h3>${escapeHtml(e.role)} — ${escapeHtml(e.org)}</h3>
          <span class="cv-item-date">${escapeHtml(e.period)}</span>
        </div>
        <p class="cv-item-tech">${escapeHtml(e.stack)}</p>
        <ul>
          ${e.points.map((pt) => `<li>${escapeHtml(pt)}</li>`).join('')}
        </ul>
      </div>`,
    ).join('');
  }

  const cvCredEl = document.getElementById('embedded-cv-credentials');
  if (cvCredEl) {
    cvCredEl.innerHTML = CREDENTIALS.map(
      (c) => `
      <div class="cv-item">
        <div class="cv-item-head">
          <h3>${escapeHtml(c.title)}</h3>
          <span class="cv-item-date">${escapeHtml(c.meta)}</span>
        </div>
        <p class="cv-item-detail">${escapeHtml(c.detail)}</p>
      </div>`,
    ).join('');
  }
}

/* ==========================================================================
   7. View Switcher (Portfolio <-> Embedded CV) with Focus Routing,
      roving-tabindex keyboard support and a #cv deep link
   ========================================================================== */
const tabPortfolio = document.getElementById('tab-portfolio');
const tabCv = document.getElementById('tab-cv');
const viewPortfolio = document.getElementById('portfolio-view');
const viewCv = document.getElementById('cv-view');
const tabs = [tabPortfolio, tabCv].filter(Boolean);

function switchPrimaryView(targetView, { focusHeading = true, animate = true } = {}) {
  const isCv = targetView === 'cv';
  if (viewCv && viewCv.hidden === !isCv) return;

  const applyUpdate = () => {
    tabPortfolio?.setAttribute('aria-selected', String(!isCv));
    tabCv?.setAttribute('aria-selected', String(isCv));
    tabPortfolio?.setAttribute('tabindex', isCv ? '-1' : '0');
    tabCv?.setAttribute('tabindex', isCv ? '0' : '-1');
    if (viewPortfolio) viewPortfolio.hidden = isCv;
    if (viewCv) viewCv.hidden = !isCv;
    document.documentElement.dataset.view = isCv ? 'cv' : 'portfolio';
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const url = new URL(window.location.href);
  url.hash = isCv ? 'cv' : '';
  history.replaceState(null, '', isCv ? url.href : url.href.replace(/#$/, ''));

  const targetHeadingId = isCv ? 'cv-view-heading' : 'portfolio-heading';
  const focusTarget = () => {
    if (focusHeading) document.getElementById(targetHeadingId)?.focus({ preventScroll: true });
  };

  if (!animate || !document.startViewTransition || reducedMotion.matches) {
    applyUpdate();
    focusTarget();
    return;
  }

  const transition = document.startViewTransition(applyUpdate);
  transition.finished.finally(focusTarget);
}

tabPortfolio?.addEventListener('click', () => switchPrimaryView('portfolio'));
tabCv?.addEventListener('click', () => switchPrimaryView('cv'));

tabs.forEach((tab, index) => {
  tab.addEventListener('keydown', (event) => {
    let next = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = tabs[(index + 1) % tabs.length];
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = tabs[(index - 1 + tabs.length) % tabs.length];
    if (event.key === 'Home') next = tabs[0];
    if (event.key === 'End') next = tabs[tabs.length - 1];
    if (!next) return;
    event.preventDefault();
    next.focus();
    switchPrimaryView(next === tabCv ? 'cv' : 'portfolio', { focusHeading: false });
  });
});

document.getElementById('hero-open-cv')?.addEventListener('click', () => switchPrimaryView('cv'));
document.getElementById('cv-back-btn')?.addEventListener('click', () => switchPrimaryView('portfolio'));
document.getElementById('brand-home')?.addEventListener('click', (e) => {
  if (viewCv && !viewCv.hidden) {
    e.preventDefault();
    switchPrimaryView('portfolio');
  }
});

function goToSection(id) {
  if (viewCv && !viewCv.hidden) switchPrimaryView('portfolio', { focusHeading: false, animate: false });
  const el = document.getElementById(id);
  el?.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
}

/* Embedded CV concise toggle */
const conciseBtn = document.getElementById('cv-concise-toggle');
const cvPaper = document.getElementById('embedded-cv-paper');
conciseBtn?.addEventListener('click', () => {
  const isConcise = cvPaper?.classList.toggle('concise');
  conciseBtn.setAttribute('aria-pressed', String(Boolean(isConcise)));
  conciseBtn.textContent = isConcise ? 'Switch to full detail' : 'Switch to 1-page concise mode';
});

/* ==========================================================================
   8. Section-aware navigation highlight
   ========================================================================== */
const navLinks = new Map(
  [...document.querySelectorAll('.nav-links a[data-nav]')].map((a) => [a.getAttribute('data-nav'), a]),
);

if ('IntersectionObserver' in window && navLinks.size > 0) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const link = navLinks.get(entry.target.id);
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach((l) => l.removeAttribute('aria-current'));
          link.setAttribute('aria-current', 'true');
        } else if (link.getAttribute('aria-current') === 'true') {
          link.removeAttribute('aria-current');
        }
      });
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  navLinks.forEach((_, id) => {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  });
}

/* ==========================================================================
   9. Local time & copy email
   ========================================================================== */
const timeEls = document.querySelectorAll('[data-local-time]');
function tickClock() {
  const label = localTime();
  timeEls.forEach((el) => {
    el.textContent = label;
  });
}
if (timeEls.length > 0) {
  tickClock();
  setInterval(tickClock, 30_000);
}

const copyBtn = document.getElementById('copy-email-btn');
const copyStatus = document.getElementById('copy-status');
const copyLabel = copyBtn?.querySelector('.copy-label');
let copyTimer;
copyBtn?.addEventListener('click', async () => {
  const copied = await copyEmail();
  if (copyStatus) copyStatus.textContent = copied ? `✓ Copied ${PROFILE.email} to clipboard` : `Email: ${PROFILE.email}`;
  if (copied && copyLabel) copyLabel.textContent = 'Copied';
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => {
    if (copyLabel) copyLabel.textContent = 'Copy email';
  }, 2200);
});

/* ==========================================================================
   10. Exploration progress pill
   ========================================================================== */
const explorerPill = document.getElementById('explorer-pill');
const explorerCount = document.getElementById('explorer-count');
const explorerNext = document.getElementById('explorer-next');
const ringFill = document.getElementById('explorer-ring-fill');
const RING_CIRCUMFERENCE = 2 * Math.PI * 15;

function nextUnexplored() {
  const start = Math.max(0, currentIndex);
  for (let i = 0; i < PROJECTS.length; i += 1) {
    const p = PROJECTS[(start + i) % PROJECTS.length];
    if (!progress.explored.has(p.id)) return p;
  }
  return null;
}

function syncExplorer() {
  const done = progress.explored.size;
  const total = PROJECTS.length;
  if (explorerCount) explorerCount.textContent = `${done}/${total} explored`;
  const next = nextUnexplored();
  if (explorerNext) {
    explorerNext.textContent = next ? (done === 0 ? `Start with ${next.title}` : `Next: ${next.title}`) : 'All explored · say hi';
  }
  if (ringFill) {
    ringFill.style.strokeDasharray = String(RING_CIRCUMFERENCE);
    ringFill.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - done / total));
  }
  explorerPill?.classList.toggle('is-complete', done === total);
  explorerPill?.setAttribute(
    'aria-label',
    next ? `${done} of ${total} case studies explored. Open ${next.title}` : `All ${total} case studies explored. Go to contact`,
  );
}

explorerPill?.addEventListener('click', () => {
  const next = nextUnexplored();
  if (next) openProjectModal(next.id);
  else goToSection('contact');
});

const heroEl = document.querySelector('.hero');
if (explorerPill && heroEl && 'IntersectionObserver' in window) {
  explorerPill.hidden = false;
  new IntersectionObserver(([entry]) => {
    explorerPill.classList.toggle('is-visible', !entry.isIntersecting);
  }).observe(heroEl);
}

progress.onChange(() => {
  syncExplorer();
  syncExploredCards();
});

/* ==========================================================================
   11. Command palette
   ========================================================================== */
const isMac = /Mac|iPhone|iPad/i.test(navigator.userAgentData?.platform ?? navigator.platform ?? '');
document.querySelectorAll('[data-mod-key]').forEach((el) => {
  el.textContent = isMac ? '⌘K' : 'Ctrl K';
});

const terminalRoot = document.querySelector('.terminal');
let terminal = null;

function focusTerminal(cmd) {
  goToSection('top');
  setTimeout(() => {
    if (cmd) terminal?.typeAndRun(cmd);
    else document.getElementById('term-input')?.focus({ preventScroll: true });
  }, reducedMotion.matches ? 0 : 450);
}

function paletteItems() {
  const isCv = viewCv && !viewCv.hidden;
  const other = getRenderedScheme() === 'dark' ? 'light' : 'dark';
  let order = 0;
  const projectItems = PROJECTS.map((p) => ({
    group: 'Case studies',
    order: order++,
    icon: escapeHtml(p.number),
    label: p.title,
    hint: progress.explored.has(p.id) ? '✓ explored' : p.categoryLabels[0],
    keywords: `${p.tagline} ${p.summary} ${p.tech.join(' ')} ${p.categoryLabels.join(' ')} ${p.categories.join(' ')}`,
    run: () => openProjectModal(p.id),
  }));
  const sections = [
    ['Work', 'projects', 'projects case studies portfolio'],
    ['Stack & capabilities', 'skills', 'skills tools languages'],
    ['Experience & education', 'experience', 'jobs work education degree paper ieee'],
    ['Contact', 'contact', 'email hire reach'],
  ].map(([label, id, keywords]) => ({
    group: 'Jump to',
    order: order++,
    icon: '#',
    label,
    keywords,
    run: () => goToSection(id),
  }));
  const actionsList = [
    { icon: '◐', label: `Switch to ${other} theme`, keywords: 'theme dark light mode', run: () => setTheme() },
    isCv
      ? { icon: '←', label: 'Back to portfolio', keywords: 'portfolio home', run: () => switchPrimaryView('portfolio') }
      : { icon: '▤', label: 'View CV', keywords: 'cv resume curriculum vitae', run: () => switchPrimaryView('cv') },
    { icon: '⇩', label: 'Download CV (PDF)', keywords: 'resume pdf download', run: downloadCv },
    {
      icon: '⧉',
      label: 'Copy email address',
      hint: PROFILE.email,
      keywords: 'email copy contact',
      run: async () => {
        const copied = await copyEmail();
        progress.toast({ icon: copied ? '✓' : '✉', title: copied ? 'Email copied' : PROFILE.email, desc: copied ? PROFILE.email : '' });
      },
    },
    { icon: '✉', label: 'Email Victor', keywords: 'email mail contact hire', run: () => (window.location.href = `mailto:${PROFILE.email}`) },
    { icon: '↗', label: 'Open GitHub', keywords: 'github code repos', run: () => window.open(PROFILE.github, '_blank', 'noopener') },
    { icon: '↗', label: 'Open LinkedIn', keywords: 'linkedin profile', run: () => window.open(PROFILE.linkedin, '_blank', 'noopener') },
    { icon: '❯', label: 'Play with the terminal', keywords: 'terminal shell commands cli fun', run: () => focusTerminal() },
    {
      icon: '✦',
      label: 'Surprise me',
      hint: 'random case study',
      keywords: 'random surprise lucky',
      run: () => {
        const pool = PROJECTS.filter((p) => !progress.explored.has(p.id));
        const pick = (pool.length ? pool : PROJECTS)[Math.floor(Math.random() * (pool.length || PROJECTS.length))];
        openProjectModal(pick.id);
      },
    },
    {
      icon: '🏆',
      label: 'View achievements',
      hint: `${progress.unlocked.size}/${progress.total}`,
      keywords: 'achievements progress secrets easter eggs',
      run: () => focusTerminal('achievements'),
    },
  ].map((a) => ({ group: 'Actions', order: order++, ...a }));
  const liveItems = PROJECTS.filter((p) => p.liveUrl || p.isPublicRepo).map((p) => ({
    group: 'Live demos & open source',
    order: order++,
    icon: p.liveUrl ? '●' : '⌥',
    label: p.liveUrl ? `Visit ${p.title} live` : `View ${p.title} source`,
    hint: p.liveUrl ? p.liveLabel : 'GitHub',
    keywords: `${p.title} live demo site open source code repo github ${p.liveLabel ?? ''}`,
    run: () => window.open(p.liveUrl ?? p.repoUrl, '_blank', 'noopener'),
  }));
  return [...projectItems, ...liveItems, ...sections, ...actionsList];
}

initPalette({
  dialog: paletteDialog,
  input: document.getElementById('palette-input'),
  list: document.getElementById('palette-list'),
  triggers: [document.getElementById('palette-open')],
  getItems: paletteItems,
  closeTopLayer,
  onOpen: () => progress.unlock('palette'),
});

/* ==========================================================================
   12. Terminal, hero effects & easter eggs
   ========================================================================== */
terminal = initTerminal({
  root: terminalRoot,
  data: { PROFILE, PROJECTS, SKILL_GROUPS, EXPERIENCE },
  progress,
  actions: {
    openProject: openProjectModal,
    switchView: (view) => switchPrimaryView(view),
    setTheme,
    downloadCv,
    localTime,
    celebrate,
    matrix: (root) => matrixRain(root),
  },
});

const statsEl = document.querySelector('.stats');
initDotField(document.getElementById('dot-field'), {
  heightFrom: () => (statsEl ? statsEl.getBoundingClientRect().bottom + window.scrollY + 40 : 900),
});

revealOnView('[data-count-to]', countUp);
decodeOnView('[data-scramble]');

/* Konami code: toggles a layout-debug overlay, a classic dev joke */
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiPos = 0;
document.addEventListener('keydown', (event) => {
  if (event.target?.closest?.('input, textarea')) return;
  const keyName = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  konamiPos = keyName === KONAMI[konamiPos] ? konamiPos + 1 : keyName === KONAMI[0] ? 1 : 0;
  if (konamiPos < KONAMI.length) return;
  konamiPos = 0;
  const on = document.documentElement.classList.toggle('debug-layout');
  if (on) confetti();
  progress.unlock('konami');
  progress.toast({
    icon: '🎮',
    title: on ? 'Layout debug mode: on' : 'Layout debug mode: off',
    desc: on ? 'Every box is outlined, like a dev-tools overlay. Enter the code again to exit.' : 'Back to normal.',
  });
});

/* ==========================================================================
   13. Initial mount
   ========================================================================== */
renderProjects('all');
renderStaticSections();
syncExplorer();

if (window.location.hash === '#cv') {
  switchPrimaryView('cv', { focusHeading: false, animate: false });
}

window.addEventListener('hashchange', () => {
  if (window.location.hash === '#cv') switchPrimaryView('cv');
});
