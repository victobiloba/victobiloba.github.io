/* ==========================================================================
   Interactive hero terminal
   A small shell with history (↑/↓), Tab completion, "did you mean",
   clickable output and a handful of hidden easter eggs.
   ========================================================================== */

import { reducedMotion } from './fx.js';

function esc(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j += 1) dp[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

const NEOFETCH_ART = [
  ' __      __ ____  ',
  ' \\ \\    / // __ \\ ',
  '  \\ \\  / /| |  | |',
  '   \\ \\/ / | |  | |',
  '    \\  /  | |__| |',
  '     \\/    \\____/ ',
].join('\n');

const COFFEE_ART = ['    ( (', '     ) )', '  ........', '  |      |]', '  \\      /', "   `----'"].join('\n');

export function initTerminal({ root, data, actions, progress }) {
  if (!root) return null;
  const { PROFILE, PROJECTS, SKILL_GROUPS, EXPERIENCE } = data;
  const body = root.querySelector('#term-body');
  const log = root.querySelector('#term-log');
  const form = root.querySelector('#term-form');
  const input = root.querySelector('#term-input');
  const suggest = root.querySelector('#term-suggest');
  if (!body || !log || !form || !input) return null;

  const history = [];
  let historyIndex = 0;
  let stagger = 0;
  const timers = new Set();

  root.querySelector('.term-static-caret')?.remove();
  form.hidden = false;
  if (suggest) suggest.hidden = false;
  root.classList.add('is-live');

  /* ---------- output helpers ---------- */
  function scrollToEnd() {
    body.scrollTop = body.scrollHeight;
  }

  function print(html, cls = 'term-out') {
    const line = document.createElement('div');
    line.className = `${cls} term-new`;
    line.style.setProperty('--d', String(stagger));
    stagger += 1;
    line.innerHTML = html;
    log.appendChild(line);
    while (log.childElementCount > 220) log.firstElementChild.remove();
    scrollToEnd();
    return line;
  }

  function later(ms, fn) {
    const id = setTimeout(() => {
      timers.delete(id);
      stagger = 0;
      fn();
    }, reducedMotion.matches ? 0 : ms);
    timers.add(id);
  }

  const dim = (s) => `<span class="t-dim">${s}</span>`;
  const key = (s) => `<span class="t-key">${s}</span>`;
  const ok = (s) => `<span class="t-ok">${s}</span>`;
  const err = (s) => `<span class="t-err">${s}</span>`;
  const runLink = (cmd, label = cmd) => `<button type="button" class="term-link" data-run="${esc(cmd)}">${esc(label)}</button>`;
  const projectLink = (p) =>
    `<button type="button" class="term-link" data-open-project="${esc(p.id)}" aria-haspopup="dialog">${esc(p.title)}</button>`;

  function findProject(query) {
    const q = query.trim().toLowerCase().replace(/\s+/g, '');
    if (!q) return null;
    const num = Number(q);
    return (
      (Number.isInteger(num) && PROJECTS.find((p) => Number(p.number) === num)) ||
      PROJECTS.find((p) => p.id === q) ||
      PROJECTS.find((p) => p.title.toLowerCase().replace(/\s+/g, '').startsWith(q)) ||
      PROJECTS.find((p) => p.id.includes(q)) ||
      null
    );
  }

  /* ---------- command implementations ---------- */
  const show = {
    about() {
      print(`I’m <strong>${esc(PROFILE.name)}</strong>, a software engineer based in ${key('Ibadan, Nigeria')}.`);
      print('I build systems end to end: grounded AI platforms, high-trust payment flows, emergency routing engines and FreeRTOS firmware.');
      print(`${ok('●')} Open to Full-Stack, Backend &amp; AI Systems roles · remote or relocation`);
    },
    projects() {
      const rows = PROJECTS.map(
        (p) => `${dim(esc(p.number))}${projectLink(p)}<span class="t-ellipsis t-dim">${esc(p.tagline)}</span>`,
      ).join('');
      print(`<div class="term-grid term-grid-3">${rows}</div>`);
      print(dim(`Click a name, or run ${key('open 3')} / ${key('open medroute')}.`));
    },
    skills() {
      SKILL_GROUPS.forEach((g) => {
        print(`${key(esc(g.title))}<br>${esc(g.items.join(' · '))}`);
      });
    },
    contact() {
      print(
        `<div class="term-grid term-grid-2">
          ${key('email')}<a class="term-link" href="mailto:${esc(PROFILE.email)}">${esc(PROFILE.email)}</a>
          ${key('github')}<a class="term-link" href="${esc(PROFILE.github)}" target="_blank" rel="noopener noreferrer">github.com/victobiloba ↗</a>
          ${key('linkedin')}<a class="term-link" href="${esc(PROFILE.linkedin)}" target="_blank" rel="noopener noreferrer">linkedin.com/in/victobiloba ↗</a>
          ${key('resume')}${runLink('download', 'download the PDF')}
        </div>`,
      );
    },
  };

  const COMMANDS = {
    help: {
      desc: 'list available commands',
      run() {
        const visible = Object.entries(COMMANDS).filter(([, c]) => !c.hidden);
        const rows = visible
          .map(([name, c]) => {
            const btn = c.fill
              ? `<button type="button" class="term-link" data-fill="${esc(c.fill)}">${esc(c.usage ?? name)}</button>`
              : runLink(name, c.usage ?? name);
            return `${btn}<span class="t-dim">${esc(c.desc)}</span>`;
          })
          .join('');
        print(`<div class="term-grid term-grid-2">${rows}</div>`);
        print(dim('↑/↓ history · Tab completes · Ctrl+L clears · some commands are hidden 👀'));
      },
    },
    about: { desc: 'who I am', run: show.about },
    projects: { desc: 'list the systems I’ve shipped', run: show.projects },
    open: {
      desc: 'open a case study by number or name',
      usage: 'open <name>',
      fill: 'open ',
      run(args) {
        if (!args.length) {
          print(`usage: ${key('open &lt;number|name&gt;')}, e.g. ${runLink('open 1')} or ${runLink('open herdsense')}`);
          return;
        }
        const proj = findProject(args.join(' '));
        if (!proj) {
          print(err(`open: no project matches “${esc(args.join(' '))}”.`) + ` Try ${runLink('projects')}.`);
          return;
        }
        print(`Opening ${key(esc(proj.title))} case study…`);
        later(320, () => actions.openProject(proj.id));
      },
    },
    skills: { desc: 'my stack, grouped by layer', run: show.skills },
    experience: {
      desc: 'where I’ve worked',
      run() {
        EXPERIENCE.forEach((e) => {
          print(`${key(esc(e.period))}  <strong>${esc(e.role)}</strong> ${dim(`@ ${esc(e.org)}`)}`);
        });
      },
    },
    contact: { desc: 'ways to reach me', run: show.contact },
    neofetch: {
      desc: 'system info, portfolio edition',
      run() {
        const info = [
          `<strong class="t-key">victor</strong>@<strong class="t-key">ibadan</strong>`,
          dim('─────────────────'),
          `${key('Role')}     ${esc(PROFILE.role)}`,
          `${key('Location')} Ibadan, Nigeria (UTC+1)`,
          `${key('Degree')}   B.Eng. Computer Engineering, FUTA`,
          `${key('Shipped')}  ${PROJECTS.length} end-to-end systems`,
          `${key('Langs')}    TypeScript · Python · C/C++ · SQL`,
          `${key('Stack')}    React · FastAPI · Node · FreeRTOS`,
          `${key('Paper')}    IEEE NIGERCON 2026 (first author)`,
          `${key('Status')}   ${ok('●')} open to new roles`,
          `<span class="term-swatches" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>`,
        ].join('\n');
        print(`<div class="neofetch"><pre class="neofetch-art" aria-hidden="true">${esc(NEOFETCH_ART)}</pre><pre class="neofetch-info">${info}</pre></div>`);
      },
    },
    cv: {
      desc: 'switch to the CV view',
      run() {
        print('Switching to the CV view…');
        later(380, () => actions.switchView('cv'));
      },
    },
    download: {
      desc: 'download my CV as a PDF',
      run() {
        print(`Downloading ${key('Victor_Ogundipe_SWE_CV.pdf')}…`);
        actions.downloadCv();
      },
    },
    theme: {
      desc: 'toggle light / dark mode',
      usage: 'theme [light|dark]',
      run(args) {
        const target = args[0]?.toLowerCase();
        if (target && target !== 'light' && target !== 'dark') {
          print(err(`theme: unknown theme “${esc(target)}”.`) + ` Use ${runLink('theme light')} or ${runLink('theme dark')}.`);
          return;
        }
        const result = actions.setTheme(target);
        print(`Theme set to ${key(result)}.`);
      },
    },
    achievements: {
      desc: 'your progress & secrets found',
      run() {
        const list = progress.list();
        const done = list.filter((a) => a.done).length;
        const rows = list
          .map((a) => (a.done ? `${ok('✓')} <strong>${esc(a.title)}</strong> ${dim(`· ${esc(a.desc)}`)}` : `${dim('○ ???')} ${dim(`· ${esc(a.desc)}`)}`))
          .join('<br>');
        print(`${key(`${done}/${list.length} unlocked`)}<br>${rows}`);
        if (done < list.length) print(dim(`Stuck? Try ${runLink('hint')}.`));
      },
    },
    date: {
      desc: 'local time in Ibadan',
      run() {
        print(`${esc(actions.localTime({ full: true }))} ${dim('· Ibadan, Nigeria')}`);
      },
    },
    clear: {
      desc: 'clear the screen',
      run() {
        log.innerHTML = '';
      },
    },

    /* ---- hidden & fun ---- */
    whoami: { hidden: true, run: () => print(`${esc(PROFILE.shortName)} ${dim(`— ${esc(PROFILE.role)}`)}`) },
    ls: {
      hidden: true,
      run(args) {
        if (args[0]?.replace(/\/$/, '') === 'projects') return show.projects();
        print(`${key('projects/')}  about.txt  stack.yml  contact.vcf  resume.pdf`);
      },
    },
    cd: {
      hidden: true,
      run(args) {
        const dir = (args[0] ?? '').replace(/\/$/, '');
        if (dir === 'projects') return show.projects();
        if (!dir || dir === '~') return print(dim('/home/victor'));
        print(err(`cd: ${esc(dir)}: no such directory`) + dim(' (there’s only projects/ in here)'));
      },
    },
    pwd: { hidden: true, run: () => print('/home/victor') },
    cat: {
      hidden: true,
      run(args) {
        const file = (args[0] ?? '').toLowerCase();
        if (file === 'about.txt') return show.about();
        if (file === 'stack.yml') return show.skills();
        if (file === 'contact.vcf') return show.contact();
        if (file === 'resume.pdf') return print(`cat: resume.pdf: binary file. Try ${runLink('download')} or ${runLink('cv')}.`);
        print(err(`cat: ${esc(args[0] ?? '')}: no such file`) + ` Try ${runLink('ls')}.`);
      },
    },
    echo: { hidden: true, run: (args) => print(esc(args.join(' '))) },
    history: {
      hidden: true,
      run() {
        print(history.map((h, i) => `${dim(String(i + 1).padStart(3, ' '))}  ${esc(h)}`).join('<br>') || dim('(empty)'));
      },
    },
    sudo: {
      hidden: true,
      run(args) {
        const rest = args.join(' ').toLowerCase();
        if (/^hire(\s+victor)?\b/.test(rest)) {
          print(`${dim('[sudo] password for recruiter:')} ********`);
          later(450, () => print(ok('✓ access granted')));
          later(900, () => print(`Compiling offer letter… ${ok('done')}`));
          later(1350, () => {
            const subject = encodeURIComponent('Let’s talk about a role');
            print(`<a class="term-link term-cta" href="mailto:${esc(PROFILE.email)}?subject=${subject}">→ Send it to ${esc(PROFILE.email)}</a>`);
            actions.celebrate(root);
            progress.unlock('sudo');
          });
          return;
        }
        print(err('victor is not in the sudoers file. This incident will be reported.') + dim(' (psst: sudo hire victor)'));
      },
    },
    rm: {
      hidden: true,
      run: () => print(err('rm: permission denied.') + ' This portfolio is production-grade 🛡️'),
    },
    exit: {
      hidden: true,
      run: () => print(`You can check out any time you like, but you can never leave. Try ${runLink('projects')} instead.`),
    },
    coffee: {
      hidden: true,
      run() {
        print(`<pre class="term-pre" aria-hidden="true">${esc(COFFEE_ART)}</pre>`);
        print('Brewing… ☕ Fuel for the next deploy.');
      },
    },
    matrix: {
      hidden: true,
      run() {
        print(ok('Wake up, Neo…'));
        actions.matrix(root);
      },
    },
    hint: {
      hidden: true,
      run() {
        print(`${key('psst…')} some commands aren’t listed in ${runLink('help')}:`);
        print(`· recruiters love ${runLink('sudo hire victor', 'sudo')}<br>· gamers know ↑↑↓↓←→←→BA (works anywhere on the page)<br>· Neo would type ${runLink('matrix')}<br>· there’s also ${runLink('coffee')}, ${runLink('ls')}, ${runLink('history')} and ${runLink('rm -rf /', 'rm -rf /')}`);
      },
    },
    reset: {
      hidden: true,
      run() {
        progress.reset();
        print(ok('Progress and achievements reset.'));
      },
    },
  };

  const ALIASES = { resume: 'cv', stack: 'skills', work: 'projects', man: 'help', '?': 'help', time: 'date', secrets: 'hint', quit: 'exit', cls: 'clear', email: 'contact' };
  const commandNames = Object.keys(COMMANDS);

  /* ---------- execution ---------- */
  function run(raw) {
    const line = raw.trim();
    stagger = 0;
    print(`<span class="prompt" aria-hidden="true">❯</span> ${esc(line)}`, 'term-cmd');
    if (!line) return;
    history.push(line);
    historyIndex = history.length;

    const [nameRaw, ...args] = line.split(/\s+/);
    const name = ALIASES[nameRaw.toLowerCase()] ?? nameRaw.toLowerCase();
    const cmd = COMMANDS[name];
    progress.unlock('first-command');

    if (cmd) {
      cmd.run(args);
      return;
    }
    const guess = commandNames
      .map((n) => [n, levenshtein(name, n)])
      .filter(([, d]) => d <= 2)
      .sort((a, b) => a[1] - b[1])[0];
    print(err(`command not found: ${esc(nameRaw)}`) + (guess ? ` · did you mean ${runLink(guess[0])}?` : ` · type ${runLink('help')}`));
  }

  function typeAndRun(cmd) {
    input.focus({ preventScroll: true });
    if (reducedMotion.matches) {
      input.value = '';
      run(cmd);
      return;
    }
    let i = 0;
    input.value = '';
    const tick = () => {
      i += 1;
      input.value = cmd.slice(0, i);
      if (i < cmd.length) setTimeout(tick, 28 + Math.random() * 30);
      else
        setTimeout(() => {
          input.value = '';
          run(cmd);
        }, 140);
    };
    tick();
  }

  function complete() {
    const value = input.value;
    const openMatch = value.match(/^(open|cat)\s+(.*)$/i);
    let pool;
    let prefix;
    let partial;
    if (openMatch) {
      prefix = `${openMatch[1]} `;
      partial = openMatch[2].toLowerCase();
      pool = openMatch[1].toLowerCase() === 'cat' ? ['about.txt', 'stack.yml', 'contact.vcf', 'resume.pdf'] : PROJECTS.map((p) => p.id);
    } else {
      prefix = '';
      partial = value.toLowerCase();
      pool = commandNames.filter((n) => !COMMANDS[n].hidden);
    }
    const matches = pool.filter((n) => n.startsWith(partial));
    if (matches.length === 1) input.value = `${prefix}${matches[0]}${prefix ? '' : ' '}`;
    else if (matches.length > 1) {
      stagger = 0;
      print(dim(matches.join('   ')));
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = input.value;
    input.value = '';
    run(value);
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp') {
      if (!history.length) return;
      event.preventDefault();
      historyIndex = Math.max(0, historyIndex - 1);
      input.value = history[historyIndex] ?? '';
    } else if (event.key === 'ArrowDown') {
      if (!history.length) return;
      event.preventDefault();
      historyIndex = Math.min(history.length, historyIndex + 1);
      input.value = history[historyIndex] ?? '';
    } else if (event.key === 'Tab' && input.value.trim()) {
      event.preventDefault();
      complete();
    } else if (event.key === 'l' && event.ctrlKey) {
      event.preventDefault();
      log.innerHTML = '';
    } else if (event.key === 'Escape') {
      input.blur();
    }
  });

  /* Clickable output: data-run executes, data-fill pre-fills the prompt */
  log.addEventListener('click', (event) => {
    const runBtn = event.target.closest('[data-run]');
    if (runBtn) {
      typeAndRun(runBtn.getAttribute('data-run'));
      return;
    }
    const fillBtn = event.target.closest('[data-fill]');
    if (fillBtn) {
      input.value = fillBtn.getAttribute('data-fill');
      input.focus({ preventScroll: true });
    }
  });

  suggest?.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-cmd]');
    if (btn) typeAndRun(btn.getAttribute('data-cmd'));
  });

  /* Click anywhere in the terminal body to focus the prompt */
  body.addEventListener('click', (event) => {
    if (event.target.closest('a, button, input')) return;
    if (window.getSelection()?.toString()) return;
    input.focus({ preventScroll: true });
  });

  return { run, typeAndRun };
}
