/* ==========================================================================
   Command palette (Ctrl/⌘ + K, or "/")
   Fuzzy search across projects (including their tech stacks), sections and
   actions. Uses a native modal <dialog> plus the ARIA combobox/listbox pattern.
   ========================================================================== */

function esc(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function score(item, query) {
  if (!query) return 1;
  const q = query.toLowerCase();
  const label = item.label.toLowerCase();
  if (label.startsWith(q)) return 100;
  if (label.includes(q)) return 80;
  const keywords = (item.keywords ?? '').toLowerCase();
  if (keywords.includes(q)) return 60;
  let i = 0;
  for (const ch of label) if (ch === q[i]) i += 1;
  return i === q.length ? 30 : 0;
}

function highlight(label, query) {
  if (!query) return esc(label);
  const idx = label.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return esc(label);
  return `${esc(label.slice(0, idx))}<mark>${esc(label.slice(idx, idx + query.length))}</mark>${esc(label.slice(idx + query.length))}`;
}

export function initPalette({ dialog, input, list, triggers = [], getItems, closeTopLayer, onOpen }) {
  if (!dialog || !input || !list) return null;
  let results = [];
  let active = 0;

  function render() {
    const query = input.value.trim();
    results = getItems()
      .map((item) => ({ item, s: score(item, query) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s || a.item.order - b.item.order)
      .map((r) => r.item);

    if (!query) {
      results = getItems();
    }
    active = Math.min(active, Math.max(0, results.length - 1));

    if (results.length === 0) {
      list.innerHTML = `<li class="palette-empty" role="presentation">No results for “${esc(query)}”. Try a project, a technology or “theme”.</li>`;
      input.removeAttribute('aria-activedescendant');
      return;
    }

    let html = '';
    let lastGroup = '';
    results.forEach((item, i) => {
      if (!query && item.group !== lastGroup) {
        html += `<li class="palette-group" role="presentation">${esc(item.group)}</li>`;
        lastGroup = item.group;
      }
      html += `
        <li class="palette-item" role="option" id="pal-opt-${i}" data-index="${i}" aria-selected="${i === active}">
          <span class="palette-icon" aria-hidden="true">${item.icon ?? '→'}</span>
          <span class="palette-label">${highlight(item.label, query)}</span>
          ${item.hint ? `<span class="palette-hint">${esc(item.hint)}</span>` : ''}
        </li>`;
    });
    list.innerHTML = html;
    syncActive();
  }

  function syncActive() {
    list.querySelectorAll('.palette-item').forEach((el) => {
      const isActive = Number(el.dataset.index) === active;
      el.setAttribute('aria-selected', String(isActive));
      if (isActive) {
        input.setAttribute('aria-activedescendant', el.id);
        el.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  async function choose(index) {
    const item = results[index];
    if (!item) return;
    await closeTopLayer(dialog);
    item.run();
  }

  function open() {
    if (dialog.open) return;
    input.value = '';
    active = 0;
    render();
    dialog.showModal();
    input.focus();
    onOpen?.();
  }

  function toggle() {
    if (dialog.open) closeTopLayer(dialog);
    else open();
  }

  input.addEventListener('input', () => {
    active = 0;
    render();
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      active = (active + 1) % Math.max(1, results.length);
      syncActive();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      active = (active - 1 + results.length) % Math.max(1, results.length);
      syncActive();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      choose(active);
    }
  });

  list.addEventListener('pointermove', (event) => {
    const el = event.target.closest('.palette-item');
    if (!el) return;
    const index = Number(el.dataset.index);
    if (index !== active) {
      active = index;
      syncActive();
    }
  });

  list.addEventListener('click', (event) => {
    const el = event.target.closest('.palette-item');
    if (el) choose(Number(el.dataset.index));
  });

  triggers.forEach((t) => t?.addEventListener('click', open));

  document.addEventListener('keydown', (event) => {
    const isMod = event.metaKey || event.ctrlKey;
    if (isMod && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      toggle();
      return;
    }
    const tag = event.target?.tagName;
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || event.target?.isContentEditable;
    if (event.key === '/' && !typing && !document.querySelector('dialog[open]')) {
      event.preventDefault();
      open();
    }
  });

  return { open, toggle };
}
