/* =====================================================
   Life Dashboard — app.js
   Features : Greeting, Focus Timer (custom duration),
              To-Do List, Quick Links
   Challenges: Light/Dark Mode, Custom Name in Greeting,
               Prevent Duplicate Tasks, Sort Tasks
   Storage   : LocalStorage (all client-side)
   ===================================================== */

// ── Utility: LocalStorage helpers ─────────────────────
function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Utility: Toast notification ───────────────────────
let toastTimer = null;
function showToast(msg, isError = false) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = 'toast' + (isError ? ' error' : '');
  // Force reflow to restart transition
  void toast.offsetWidth;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ═══════════════════════════════════════════════════════
//  1. CLOCK & GREETING
// ═══════════════════════════════════════════════════════
const clockEl    = document.getElementById('clock');
const dateEl     = document.getElementById('date');
const greetingEl = document.getElementById('greeting');

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

function updateClock() {
  const now  = new Date();
  const h    = String(now.getHours()).padStart(2, '0');
  const m    = String(now.getMinutes()).padStart(2, '0');
  const s    = String(now.getSeconds()).padStart(2, '0');
  clockEl.textContent = `${h}:${m}:${s}`;

  const day  = DAYS[now.getDay()];
  const mon  = MONTHS[now.getMonth()];
  const date = now.getDate();
  const year = now.getFullYear();
  dateEl.textContent = `${day}, ${mon} ${date}, ${year}`;

  const hour = now.getHours();
  const name = load('userName', '');
  const nameStr = name ? `, ${name}` : '!';
  const suffix  = name ? '!' : '';

  let greet;
  if (hour >= 5  && hour < 12) greet = 'Good morning';
  else if (hour >= 12 && hour < 17) greet = 'Good afternoon';
  else if (hour >= 17 && hour < 21) greet = 'Good evening';
  else greet = 'Good night';

  greetingEl.textContent = name
    ? `${greet}, ${name}! 👋`
    : `${greet}! 👋`;
}

setInterval(updateClock, 1000);
updateClock();

// ═══════════════════════════════════════════════════════
//  2. LIGHT / DARK MODE  (Challenge #1)
// ═══════════════════════════════════════════════════════
const themeToggle = document.getElementById('theme-toggle');
let currentTheme  = load('theme', 'light');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  themeToggle.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  save('theme', theme);
  currentTheme = theme;
}

applyTheme(currentTheme);

themeToggle.addEventListener('click', () => {
  applyTheme(currentTheme === 'light' ? 'dark' : 'light');
});

// ═══════════════════════════════════════════════════════
//  3. CUSTOM NAME IN GREETING  (Challenge #2)
// ═══════════════════════════════════════════════════════
const nameModal  = document.getElementById('name-modal');
const nameInput  = document.getElementById('name-input');
const nameSave   = document.getElementById('name-save');
const nameCancel = document.getElementById('name-cancel');
const nameBtn    = document.getElementById('name-btn');

function openNameModal() {
  nameInput.value = load('userName', '');
  nameModal.classList.remove('hidden');
  nameInput.focus();
}

function closeNameModal() {
  nameModal.classList.add('hidden');
}

nameBtn.addEventListener('click', openNameModal);

nameSave.addEventListener('click', () => {
  const name = nameInput.value.trim();
  save('userName', name);
  closeNameModal();
  updateClock(); // refresh greeting immediately
  showToast(name ? `Name set to "${name}"` : 'Name cleared');
});

nameCancel.addEventListener('click', closeNameModal);

nameModal.addEventListener('click', (e) => {
  if (e.target === nameModal) closeNameModal();
});

nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') nameSave.click();
  if (e.key === 'Escape') closeNameModal();
});

// ═══════════════════════════════════════════════════════
//  4. FOCUS TIMER  (with custom duration — Challenge #3)
// ═══════════════════════════════════════════════════════
const timerDisplay  = document.getElementById('timer-display');
const timerStart    = document.getElementById('timer-start');
const timerStop     = document.getElementById('timer-stop');
const timerReset    = document.getElementById('timer-reset');
const timerMinInput = document.getElementById('timer-minutes');
const timerApply    = document.getElementById('timer-apply');
const timerCard     = document.getElementById('timer-card');

let timerInterval = null;
let timerDuration = load('timerDuration', 25); // minutes
let timerRemaining = timerDuration * 60;        // seconds
let timerRunning   = false;

function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTime(timerRemaining);
  timerMinInput.value = timerDuration;
}

function startTimer() {
  if (timerRunning) return;
  if (timerRemaining <= 0) return;
  timerRunning = true;
  timerCard.classList.add('timer-running');
  timerInterval = setInterval(() => {
    timerRemaining--;
    renderTimer();
    if (timerRemaining <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      timerCard.classList.remove('timer-running');
      showToast('⏰ Focus session complete! Take a break.');
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerCard.classList.remove('timer-running');
}

function resetTimer() {
  stopTimer();
  timerRemaining = timerDuration * 60;
  renderTimer();
}

function applyCustomTime() {
  const mins = parseInt(timerMinInput.value, 10);
  if (isNaN(mins) || mins < 1 || mins > 120) {
    showToast('Enter a time between 1 and 120 minutes.', true);
    return;
  }
  stopTimer();
  timerDuration  = mins;
  timerRemaining = mins * 60;
  save('timerDuration', mins);
  renderTimer();
  showToast(`Timer set to ${mins} minute${mins !== 1 ? 's' : ''}`);
}

timerStart.addEventListener('click', startTimer);
timerStop.addEventListener('click', stopTimer);
timerReset.addEventListener('click', resetTimer);
timerApply.addEventListener('click', applyCustomTime);
timerMinInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') applyCustomTime(); });

renderTimer();

// ═══════════════════════════════════════════════════════
//  5. TO-DO LIST  (Edit, Done, Delete, Prevent Dupes, Sort)
// ═══════════════════════════════════════════════════════
const todoInput = document.getElementById('todo-input');
const todoAdd   = document.getElementById('todo-add');
const todoList  = document.getElementById('todo-list');
const todoCount = document.getElementById('todo-count');
const todoSort  = document.getElementById('todo-sort');

// tasks: [{ id, text, done, createdAt }]
let tasks = load('tasks', []);

function getSortedTasks() {
  const mode = todoSort.value;
  const copy = [...tasks];
  if (mode === 'az')   copy.sort((a, b) => a.text.localeCompare(b.text));
  if (mode === 'za')   copy.sort((a, b) => b.text.localeCompare(a.text));
  if (mode === 'done') copy.sort((a, b) => Number(a.done) - Number(b.done));
  return copy;
}

function saveTasks() { save('tasks', tasks); }

function updateCount() {
  const total = tasks.length;
  const done  = tasks.filter(t => t.done).length;
  todoCount.textContent = total === 0
    ? 'No tasks'
    : `${done}/${total} done`;
}

function renderTasks() {
  todoList.innerHTML = '';
  const sorted = getSortedTasks();

  if (sorted.length === 0) {
    todoList.innerHTML = '<li style="color:var(--text-muted);font-size:.88rem;padding:8px 4px;">No tasks yet. Add one above!</li>';
    updateCount();
    return;
  }

  sorted.forEach(task => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (task.done ? ' done' : '');
    li.dataset.id = task.id;

    li.innerHTML = `
      <input type="checkbox" class="todo-check" ${task.done ? 'checked' : ''} title="Mark as done" />
      <span class="todo-text">${escapeHtml(task.text)}</span>
      <div class="todo-actions">
        <button class="btn btn-secondary edit-btn" title="Edit task">✏️</button>
        <button class="btn btn-danger delete-btn" title="Delete task">🗑️</button>
      </div>
    `;

    // Toggle done
    li.querySelector('.todo-check').addEventListener('change', (e) => {
      const t = tasks.find(x => x.id === task.id);
      if (t) { t.done = e.target.checked; saveTasks(); renderTasks(); }
    });

    // Delete
    li.querySelector('.delete-btn').addEventListener('click', () => {
      tasks = tasks.filter(x => x.id !== task.id);
      saveTasks();
      renderTasks();
      showToast('Task deleted');
    });

    // Edit
    li.querySelector('.edit-btn').addEventListener('click', () => startEdit(li, task));

    todoList.appendChild(li);
  });

  updateCount();
}

function startEdit(li, task) {
  const textSpan    = li.querySelector('.todo-text');
  const editBtn     = li.querySelector('.edit-btn');
  const currentText = task.text;

  const input = document.createElement('input');
  input.type  = 'text';
  input.className = 'todo-edit-input';
  input.value     = currentText;
  input.maxLength = 100;

  textSpan.replaceWith(input);
  editBtn.textContent = '💾';
  editBtn.title = 'Save changes';
  input.focus();
  input.select();

  function saveEdit() {
    const newText = input.value.trim();
    if (!newText) { showToast('Task cannot be empty.', true); return; }

    // Prevent duplicate on edit (Challenge #3)
    const duplicate = tasks.find(x =>
      x.id !== task.id && x.text.toLowerCase() === newText.toLowerCase()
    );
    if (duplicate) {
      showToast('A task with that name already exists.', true);
      return;
    }

    const t = tasks.find(x => x.id === task.id);
    if (t) { t.text = newText; saveTasks(); }
    renderTasks();
  }

  editBtn.addEventListener('click', saveEdit, { once: true });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') renderTasks(); // cancel edit
  });
}

function addTask() {
  const text = todoInput.value.trim();
  if (!text) return;

  // Prevent duplicate task (Challenge #3)
  const exists = tasks.some(t => t.text.toLowerCase() === text.toLowerCase());
  if (exists) {
    showToast('That task already exists!', true);
    todoInput.select();
    return;
  }

  tasks.push({ id: Date.now(), text, done: false, createdAt: Date.now() });
  saveTasks();
  renderTasks();
  todoInput.value = '';
  todoInput.focus();
}

todoAdd.addEventListener('click', addTask);
todoInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTask(); });
todoSort.addEventListener('change', renderTasks);

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

renderTasks();

// ═══════════════════════════════════════════════════════
//  6. QUICK LINKS
// ═══════════════════════════════════════════════════════
const linkNameInput = document.getElementById('link-name-input');
const linkUrlInput  = document.getElementById('link-url-input');
const linkAdd       = document.getElementById('link-add');
const linksGrid     = document.getElementById('links-grid');

// links: [{ id, label, url }]
let links = load('links', [
  { id: 1, label: 'Google',    url: 'https://google.com' },
  { id: 2, label: 'YouTube',   url: 'https://youtube.com' },
  { id: 3, label: 'GitHub',    url: 'https://github.com' },
]);

function saveLinks() { save('links', links); }

function renderLinks() {
  linksGrid.innerHTML = '';
  if (links.length === 0) {
    linksGrid.innerHTML = '<p style="color:var(--text-muted);font-size:.88rem;">No links yet. Add one above!</p>';
    return;
  }

  links.forEach(link => {
    const chip = document.createElement('div');
    chip.className = 'link-chip';

    const anchor = document.createElement('a');
    anchor.href   = link.url;
    anchor.target = '_blank';
    anchor.rel    = 'noopener noreferrer';
    anchor.textContent = link.label;
    anchor.style.textDecoration = 'none';
    anchor.style.color = 'inherit';

    const delBtn = document.createElement('button');
    delBtn.className = 'link-delete';
    delBtn.textContent = '✕';
    delBtn.title = 'Remove link';
    delBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      links = links.filter(x => x.id !== link.id);
      saveLinks();
      renderLinks();
      showToast('Link removed');
    });

    chip.appendChild(anchor);
    chip.appendChild(delBtn);
    linksGrid.appendChild(chip);
  });
}

function addLink() {
  const label = linkNameInput.value.trim();
  const rawUrl = linkUrlInput.value.trim();
  if (!label || !rawUrl) {
    showToast('Enter both a label and a URL.', true);
    return;
  }

  // Auto-prepend https:// if missing
  const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : 'https://' + rawUrl;

  try { new URL(url); } catch {
    showToast('That URL looks invalid.', true);
    return;
  }

  links.push({ id: Date.now(), label, url });
  saveLinks();
  renderLinks();
  linkNameInput.value = '';
  linkUrlInput.value  = '';
  linkNameInput.focus();
  showToast(`Link "${label}" added`);
}

linkAdd.addEventListener('click', addLink);
linkUrlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addLink(); });
linkNameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') linkUrlInput.focus(); });

renderLinks();
