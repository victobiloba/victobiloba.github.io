/* ==========================================================================
   Visual effects: confetti, count-up, text decode, hero dot field,
   matrix rain and card tilt. Every effect respects prefers-reduced-motion.
   ========================================================================== */

export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(pointer: fine)');

/* Resolve a CSS custom property (including light-dark() values) to rgb() */
const probe = document.createElement('span');
probe.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;';
export function resolveColor(cssVar) {
  if (!probe.isConnected) document.body.appendChild(probe);
  probe.style.color = `var(${cssVar})`;
  return getComputedStyle(probe).color;
}

function parseRgb(str) {
  const m = str.match(/[\d.]+/g) || ['0', '0', '0'];
  return m.slice(0, 3).map(Number);
}

/* Fire a callback whenever the rendered colour scheme may have changed */
export function onSchemeChange(callback) {
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) new MutationObserver(callback).observe(meta, { attributes: true, attributeFilter: ['content'] });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', callback);
}

/* --------------------------------------------------------------------------
   Confetti burst
   -------------------------------------------------------------------------- */
export function confetti({ x = window.innerWidth / 2, y = window.innerHeight * 0.35, count = 160 } = {}) {
  if (reducedMotion.matches) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const colors = [resolveColor('--accent'), '#f59e0b', '#10b981', '#6366f1', '#f43f5e', '#06b6d4', '#8b5cf6'];
  const parts = Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 9;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6,
      w: 5 + Math.random() * 6,
      h: 3 + Math.random() * 5,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.35,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 0,
    };
  });

  const start = performance.now();
  const duration = 2800;
  function frame(now) {
    const t = now - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of parts) {
      p.vx *= 0.985;
      p.vy = p.vy * 0.985 + 0.32;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - t / duration);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (t < duration) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}

/* --------------------------------------------------------------------------
   Count-up numbers & decode ("scramble") text, triggered on first view
   -------------------------------------------------------------------------- */
const GLYPHS = '!<>-_\\/[]{}=+*^?#01ABCDEFXYZ';

export function scramble(el, finalText = el.dataset.finalText ?? el.textContent, duration = 750) {
  if (reducedMotion.matches) {
    el.textContent = finalText;
    return;
  }
  el.dataset.finalText = finalText;
  const start = performance.now();
  const chars = [...finalText];
  function frame(now) {
    const progress = Math.min(1, (now - start) / duration);
    const revealed = Math.floor(progress * chars.length);
    el.textContent = chars
      .map((ch, i) => {
        if (i < revealed || ch === ' ') return ch;
        return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      })
      .join('');
    if (progress < 1) requestAnimationFrame(frame);
    else el.textContent = finalText;
  }
  requestAnimationFrame(frame);
}

/* Make an element's visible text decorative while keeping a stable copy for assistive tech */
function protectForScreenReaders(el) {
  if (el.dataset.srProtected) return;
  const text = el.textContent;
  const sr = document.createElement('span');
  sr.className = 'sr-only';
  sr.textContent = text;
  const visual = document.createElement('span');
  visual.setAttribute('aria-hidden', 'true');
  visual.textContent = text;
  el.textContent = '';
  el.append(sr, visual);
  el.dataset.srProtected = '1';
  return visual;
}

export function countUp(el) {
  const target = Number(el.dataset.countTo);
  const suffix = el.dataset.suffix ?? '';
  if (!Number.isFinite(target) || reducedMotion.matches) return;
  const visual = protectForScreenReaders(el) ?? el;
  const start = performance.now();
  const duration = 1300;
  function frame(now) {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 4);
    visual.textContent = `${Math.round(target * eased)}${suffix}`;
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

export function revealOnView(selector, effect) {
  const els = document.querySelectorAll(selector);
  if (!('IntersectionObserver' in window) || els.length === 0) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        effect(entry.target);
      });
    },
    { threshold: 0.6 },
  );
  els.forEach((el) => io.observe(el));
}

export function decodeOnView(selector) {
  revealOnView(selector, (el) => {
    const visual = protectForScreenReaders(el) ?? el;
    scramble(visual, visual.textContent, 650);
  });
}

/* --------------------------------------------------------------------------
   Hero dot field: dots swell & tint toward the cursor, ripple on click
   -------------------------------------------------------------------------- */
export function initDotField(canvas, { heightFrom, ignoreSelector = 'a, button, input, .terminal' } = {}) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const SPACING = 26;
  const RADIUS = 170;
  let dpr = 1;
  let width = 0;
  let height = 0;
  let dots = [];
  let ink = [0, 0, 0];
  let accent = [255, 122, 69];
  let isDark = false;
  const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999, last: 0 };
  const ripples = [];
  let running = false;
  let visible = true;

  function readColors() {
    ink = parseRgb(resolveColor('--ink'));
    accent = parseRgb(resolveColor('--accent'));
    isDark = ink[0] > 128;
    draw(performance.now());
  }

  function layout() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = document.documentElement.clientWidth;
    height = Math.max(480, Math.round(heightFrom?.() ?? 900));
    canvas.style.height = `${height}px`;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dots = [];
    const offsetX = (width % SPACING) / 2;
    for (let y = SPACING / 2; y < height; y += SPACING) {
      for (let x = offsetX; x < width; x += SPACING) dots.push(x, y);
    }
    draw(performance.now());
  }

  function draw(now) {
    ctx.clearRect(0, 0, width, height);
    const baseAlpha = isDark ? 0.13 : 0.12;
    pointer.x += (pointer.tx - pointer.x) * 0.18;
    pointer.y += (pointer.ty - pointer.y) * 0.18;

    for (let i = ripples.length - 1; i >= 0; i -= 1) {
      if (now - ripples[i].t > 1600) ripples.splice(i, 1);
    }

    for (let i = 0; i < dots.length; i += 2) {
      let x = dots[i];
      let y = dots[i + 1];
      const dx = x - pointer.x;
      const dy = y - pointer.y;
      const dist = Math.hypot(dx, dy);
      let t = dist < RADIUS ? 1 - dist / RADIUS : 0;

      for (const r of ripples) {
        const age = (now - r.t) / 1600;
        const ring = age * 900;
        const rd = Math.hypot(x - r.x, y - r.y);
        const band = 1 - Math.min(1, Math.abs(rd - ring) / 46);
        t = Math.max(t, band * (1 - age));
      }

      if (t > 0 && dist > 0.001 && dist < RADIUS) {
        const push = (1 - dist / RADIUS) * 7;
        x += (dx / dist) * push;
        y += (dy / dist) * push;
      }

      const r = 1 + t * 1.7;
      const mix = t;
      const cr = Math.round(ink[0] + (accent[0] - ink[0]) * mix);
      const cg = Math.round(ink[1] + (accent[1] - ink[1]) * mix);
      const cb = Math.round(ink[2] + (accent[2] - ink[2]) * mix);
      ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${baseAlpha + t * 0.75})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop(now) {
    draw(now);
    const active = now - pointer.last < 1400 || ripples.length > 0;
    if (active && visible) requestAnimationFrame(loop);
    else running = false;
  }

  function kick() {
    if (reducedMotion.matches || running || !visible) return;
    running = true;
    requestAnimationFrame(loop);
  }

  window.addEventListener(
    'pointermove',
    (e) => {
      if (!finePointer.matches) return;
      const rect = canvas.getBoundingClientRect();
      pointer.tx = e.clientX - rect.left;
      pointer.ty = e.clientY - rect.top;
      if (pointer.x < -1000) {
        pointer.x = pointer.tx;
        pointer.y = pointer.ty;
      }
      pointer.last = performance.now();
      kick();
    },
    { passive: true },
  );

  document.addEventListener('pointerdown', (e) => {
    if (e.target.closest(ignoreSelector)) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (y < 0 || y > height) return;
    ripples.push({ x, y, t: performance.now() });
    kick();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) kick();
    }).observe(canvas);
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layout, 120);
  });
  document.fonts?.ready?.then(layout);
  onSchemeChange(() => requestAnimationFrame(readColors));

  layout();
  readColors();
  return { relayout: layout };
}

/* --------------------------------------------------------------------------
   Matrix rain inside a container (terminal easter egg)
   -------------------------------------------------------------------------- */
export function matrixRain(container, duration = 4500) {
  if (reducedMotion.matches || container.querySelector('.matrix-canvas')) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'matrix-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  container.appendChild(canvas);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const { width, height } = container.getBoundingClientRect();
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const size = 14;
  const columns = Math.ceil(width / size);
  const drops = Array.from({ length: columns }, () => Math.random() * -40);
  const chars = 'アイウエオカキクケコサシスセソタチツテト0123456789ABCDEF<>/{}';
  const start = performance.now();
  let last = 0;

  function frame(now) {
    const t = now - start;
    if (now - last > 45) {
      last = now;
      ctx.fillStyle = 'rgba(14, 14, 16, 0.18)';
      ctx.fillRect(0, 0, width, height);
      ctx.font = `${size}px "Geist Mono", monospace`;
      drops.forEach((d, i) => {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillStyle = Math.random() > 0.96 ? '#e8ffe8' : '#4ade80';
        ctx.fillText(ch, i * size, d * size);
        drops[i] = d * size > height && Math.random() > 0.97 ? 0 : d + 1;
      });
    }
    canvas.style.opacity = String(t > duration - 600 ? Math.max(0, (duration - t) / 600) : 1);
    if (t < duration) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}

/* --------------------------------------------------------------------------
   Subtle 3D tilt for project cards (mouse only)
   -------------------------------------------------------------------------- */
export function initTilt(grid, selector = '.project-card') {
  if (!grid) return;
  grid.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    const card = event.target.closest(selector);
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    card.style.setProperty('--my', `${event.clientY - rect.top}px`);
    if (reducedMotion.matches) return;
    const strength = rect.width > 700 ? 2 : 4;
    card.style.setProperty('--ry', `${((px - 0.5) * strength).toFixed(2)}deg`);
    card.style.setProperty('--rx', `${((0.5 - py) * strength).toFixed(2)}deg`);
  });
  grid.addEventListener(
    'pointerleave',
    (event) => {
      if (!event.target.matches?.(selector)) return;
      const card = event.target;
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    },
    true,
  );
}
