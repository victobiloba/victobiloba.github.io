/* ==========================================================================
   Achievements, exploration progress and toast notifications.
   Progress is a per-visitor convenience kept in localStorage; every read and
   write is guarded so the page works the same when storage is unavailable.
   ========================================================================== */

const ACHIEVEMENTS_KEY = 'vo-achievements';
const EXPLORED_KEY = 'vo-explored';

export const ACHIEVEMENTS = [
  { id: 'first-command', icon: '⌨️', title: 'Hello, world', desc: 'Ran your first terminal command' },
  { id: 'first-case', icon: '🔍', title: 'Curious mind', desc: 'Opened your first case study' },
  { id: 'pipeline', icon: '⚡', title: 'Flow state', desc: 'Simulated a system pipeline' },
  { id: 'palette', icon: '🧭', title: 'Power user', desc: 'Opened the command palette' },
  { id: 'theme', icon: '🌗', title: 'Shapeshifter', desc: 'Switched the colour theme' },
  { id: 'all-cases', icon: '🏆', title: 'Completionist', desc: 'Explored all 7 case studies' },
  { id: 'sudo', icon: '🔑', title: 'Root access', desc: 'Found the hiring shortcut' },
  { id: 'konami', icon: '🎮', title: 'Old school', desc: 'Entered the Konami code' },
];

function load(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function save(key, values) {
  try {
    localStorage.setItem(key, JSON.stringify([...values]));
  } catch {}
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function createProgress({ toastRegion, projectIds }) {
  const unlocked = new Set(load(ACHIEVEMENTS_KEY).filter((id) => ACHIEVEMENTS.some((a) => a.id === id)));
  const explored = new Set(load(EXPLORED_KEY).filter((id) => projectIds.includes(id)));
  const listeners = new Set();

  const emit = () => listeners.forEach((fn) => fn());

  function toast({ icon = '✨', title, desc = '', action } = {}) {
    if (!toastRegion) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `
      <span class="toast-icon" aria-hidden="true">${icon}</span>
      <span class="toast-text"><strong>${escapeHtml(title)}</strong>${desc ? `<span>${escapeHtml(desc)}</span>` : ''}</span>`;
    if (action) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'toast-action';
      btn.textContent = action.label;
      btn.addEventListener('click', () => {
        action.run();
        dismiss();
      });
      el.appendChild(btn);
    }
    el.addEventListener('animationend', () => el.classList.add('is-settled'), { once: true });
    toastRegion.appendChild(el);
    while (toastRegion.children.length > 3) toastRegion.firstElementChild.remove();
    raiseRegion();

    let timer = setTimeout(dismiss, action ? 7000 : 4200);
    el.addEventListener('pointerenter', () => clearTimeout(timer));
    el.addEventListener('pointerleave', () => {
      timer = setTimeout(dismiss, 2000);
    });

    function dismiss() {
      clearTimeout(timer);
      el.classList.add('is-leaving');
      setTimeout(() => {
        el.remove();
        if (toastRegion.childElementCount === 0 && supportsPopover) {
          try {
            toastRegion.hidePopover();
          } catch {}
        }
      }, 260);
    }
  }

  /* Re-show the popover so toasts sit above any modal opened after them */
  const supportsPopover = typeof toastRegion?.showPopover === 'function';
  function raiseRegion() {
    if (!supportsPopover) return;
    try {
      if (toastRegion.matches(':popover-open')) toastRegion.hidePopover();
      toastRegion.showPopover();
    } catch {}
  }

  function unlock(id) {
    if (unlocked.has(id)) return false;
    const achievement = ACHIEVEMENTS.find((a) => a.id === id);
    if (!achievement) return false;
    unlocked.add(id);
    save(ACHIEVEMENTS_KEY, unlocked);
    toast({
      icon: achievement.icon,
      title: `Achievement unlocked · ${achievement.title}`,
      desc: `${achievement.desc} (${unlocked.size}/${ACHIEVEMENTS.length})`,
    });
    emit();
    return true;
  }

  function markExplored(projectId) {
    if (explored.has(projectId)) return false;
    explored.add(projectId);
    save(EXPLORED_KEY, explored);
    unlock('first-case');
    emit();
    return true;
  }

  function reset() {
    unlocked.clear();
    explored.clear();
    save(ACHIEVEMENTS_KEY, unlocked);
    save(EXPLORED_KEY, explored);
    emit();
  }

  return {
    explored,
    unlocked,
    unlock,
    markExplored,
    reset,
    toast,
    total: ACHIEVEMENTS.length,
    list: () => ACHIEVEMENTS.map((a) => ({ ...a, done: unlocked.has(a.id) })),
    onChange: (fn) => listeners.add(fn),
  };
}
