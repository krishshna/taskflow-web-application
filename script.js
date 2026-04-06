/* ============================================
   TASKFLOW — script.js (Supabase edition)
   ============================================ */

// ---- SUPABASE CONFIG ----
const SUPABASE_URL = 'https://aetvbhylegfpfxnwqhaf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_j-o6Lf1vrOJC-C7n6l7-Pw_hWCKD-yn';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---- STATE ----
let tasks = [];
let currentFilter = 'all';
let currentSort = 'newest';
let searchQuery = '';
let editingId = null;
let isLoading = false;

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  bindEvents();
  fetchTasks();
});

// ---- THEME (still localStorage — fine for preferences) ----
function applyTheme() {
  const theme = localStorage.getItem('taskflow_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
}

// ---- SUPABASE CRUD ----

async function fetchTasks() {
  setLoading(true);
  const { data, error } = await db
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    showToast('Failed to load tasks. Check your connection.');
    console.error(error);
  } else {
    tasks = data.map(normalizeTask);
    renderTasks();
  }
  setLoading(false);
}

async function addTaskToDB(taskData) {
  const { data, error } = await db
    .from('tasks')
    .insert([{
      text:      taskData.text,
      priority:  taskData.priority,
      category:  taskData.category,
      due:       taskData.due || null,
      notes:     taskData.notes || null,
      completed: false,
    }])
    .select()
    .single();

  if (error) throw error;
  return normalizeTask(data);
}

async function updateTaskInDB(id, updates) {
  const payload = {};
  if (updates.text      !== undefined) payload.text      = updates.text;
  if (updates.priority  !== undefined) payload.priority  = updates.priority;
  if (updates.category  !== undefined) payload.category  = updates.category;
  if (updates.due       !== undefined) payload.due       = updates.due || null;
  if (updates.notes     !== undefined) payload.notes     = updates.notes || null;
  if (updates.completed !== undefined) payload.completed = updates.completed;

  const { error } = await db.from('tasks').update(payload).eq('id', id);
  if (error) throw error;
}

async function deleteTaskFromDB(id) {
  const { error } = await db.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

async function deleteCompletedFromDB() {
  const { error } = await db.from('tasks').delete().eq('completed', true);
  if (error) throw error;
}

// Normalize Supabase snake_case → camelCase
function normalizeTask(row) {
  return {
    id:        row.id,
    text:      row.text,
    priority:  row.priority  || 'medium',
    category:  row.category  || 'personal',
    due:       row.due       || '',
    notes:     row.notes     || '',
    completed: row.completed || false,
    createdAt: new Date(row.created_at).getTime(),
  };
}

// ---- EVENTS ----
function bindEvents() {
  document.getElementById('addBtn').addEventListener('click', addTask);
  document.getElementById('taskInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') addTask();
  });

  document.getElementById('themeToggle').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('taskflow_theme', next);
  });

  document.getElementById('clearAllBtn').addEventListener('click', clearCompleted);

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderTasks();
    });
  });

  document.getElementById('searchInput').addEventListener('input', e => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderTasks();
  });

  document.getElementById('sortSelect').addEventListener('change', e => {
    currentSort = e.target.value;
    renderTasks();
  });

  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalCancel').addEventListener('click', closeModal);
  document.getElementById('modalSave').addEventListener('click', saveEdit);
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
}

// ---- ADD TASK ----
async function addTask() {
  const input = document.getElementById('taskInput');
  const text  = input.value.trim();

  if (!text) {
    input.focus();
    input.style.borderColor = 'var(--danger)';
    setTimeout(() => { input.style.borderColor = ''; }, 1500);
    showToast('Please enter a task first.');
    return;
  }

  const addBtn = document.getElementById('addBtn');
  addBtn.disabled = true;

  try {
    const newTask = await addTaskToDB({
      text,
      priority: document.getElementById('taskPriority').value,
      category: document.getElementById('taskCategory').value,
      due:      document.getElementById('taskDue').value,
      notes:    '',
    });

    tasks.unshift(newTask);
    renderTasks();
    input.value = '';
    document.getElementById('taskDue').value = '';
    input.focus();
    showToast('Task added ✓');
  } catch (err) {
    console.error(err);
    showToast('Failed to add task. Try again.');
  } finally {
    addBtn.disabled = false;
  }
}

// ---- DELETE ----
async function deleteTask(id) {
  const el = document.querySelector(`[data-task-id="${id}"]`);
  if (el) el.classList.add('removing');

  try {
    await deleteTaskFromDB(id);
    tasks = tasks.filter(t => t.id !== id);
    setTimeout(() => renderTasks(), 200);
    showToast('Task deleted.');
  } catch (err) {
    console.error(err);
    if (el) el.classList.remove('removing');
    showToast('Failed to delete. Try again.');
  }
}

// ---- TOGGLE COMPLETE ----
async function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const newVal = !task.completed;
  task.completed = newVal; // optimistic
  renderTasks();

  try {
    await updateTaskInDB(id, { completed: newVal });
  } catch (err) {
    console.error(err);
    task.completed = !newVal; // revert
    renderTasks();
    showToast('Failed to update. Try again.');
  }
}

// ---- CLEAR COMPLETED ----
async function clearCompleted() {
  const count = tasks.filter(t => t.completed).length;
  if (count === 0) { showToast('No completed tasks to clear.'); return; }

  try {
    await deleteCompletedFromDB();
    tasks = tasks.filter(t => !t.completed);
    renderTasks();
    showToast(`Cleared ${count} completed task${count > 1 ? 's' : ''} ✓`);
  } catch (err) {
    console.error(err);
    showToast('Failed to clear. Try again.');
  }
}

// ---- EDIT MODAL ----
function openEdit(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  editingId = id;

  document.getElementById('editInput').value    = task.text;
  document.getElementById('editPriority').value = task.priority;
  document.getElementById('editCategory').value = task.category;
  document.getElementById('editDue').value      = task.due || '';
  document.getElementById('editNotes').value    = task.notes || '';

  document.getElementById('modalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('editInput').focus(), 100);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  editingId = null;
}

async function saveEdit() {
  const text = document.getElementById('editInput').value.trim();
  if (!text) return;

  const saveBtn = document.getElementById('modalSave');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving…';

  const updates = {
    text,
    priority: document.getElementById('editPriority').value,
    category: document.getElementById('editCategory').value,
    due:      document.getElementById('editDue').value,
    notes:    document.getElementById('editNotes').value.trim(),
  };

  try {
    await updateTaskInDB(editingId, updates);
    const task = tasks.find(t => t.id === editingId);
    if (task) Object.assign(task, updates);
    renderTasks();
    closeModal();
    showToast('Task updated ✓');
  } catch (err) {
    console.error(err);
    showToast('Failed to save. Try again.');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Changes';
  }
}

// ---- FILTER & SORT ----
function getFilteredSortedTasks() {
  const today = new Date().toISOString().split('T')[0];

  let list = tasks.filter(t => {
    if (searchQuery && !t.text.toLowerCase().includes(searchQuery) &&
        !(t.notes && t.notes.toLowerCase().includes(searchQuery))) return false;

    if (currentFilter === 'pending')   return !t.completed;
    if (currentFilter === 'completed') return t.completed;
    if (currentFilter === 'high')      return t.priority === 'high' && !t.completed;
    if (currentFilter === 'overdue')   return t.due && t.due < today && !t.completed;
    return true;
  });

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  list.sort((a, b) => {
    if (currentSort === 'newest')   return b.createdAt - a.createdAt;
    if (currentSort === 'oldest')   return a.createdAt - b.createdAt;
    if (currentSort === 'priority') return priorityOrder[a.priority] - priorityOrder[b.priority];
    if (currentSort === 'due') {
      if (!a.due && !b.due) return 0;
      if (!a.due) return 1;
      if (!b.due) return -1;
      return a.due.localeCompare(b.due);
    }
    if (currentSort === 'alpha') return a.text.localeCompare(b.text);
    return 0;
  });

  return list;
}

// ---- RENDER ----
function renderTasks() {
  const list      = getFilteredSortedTasks();
  const container = document.getElementById('taskList');
  const empty     = document.getElementById('emptyState');

  container.innerHTML = '';

  if (list.length === 0) {
    empty.classList.add('visible');
  } else {
    empty.classList.remove('visible');
    list.forEach(task => container.appendChild(createTaskEl(task)));
  }

  updateStats();
}

function createTaskEl(task) {
  const today    = new Date().toISOString().split('T')[0];
  const isOverdue = task.due && task.due < today && !task.completed;

  const li = document.createElement('div');
  li.className = `task-item${task.completed ? ' completed' : ''}`;
  li.dataset.taskId  = task.id;
  li.dataset.priority = task.priority;

  const categoryEmoji = { personal:'👤', work:'💼', health:'❤️', learning:'📚', other:'📌' };
  const priorityLabel = { low:'Low', medium:'Medium', high:'High' };

  const duePart   = task.due
    ? `<span class="tag tag-due ${isOverdue ? 'overdue' : ''}">${isOverdue ? '⚠️ Overdue' : '📅 ' + formatDate(task.due)}</span>`
    : '';
  const notesPart = task.notes
    ? `<div class="task-notes">${escapeHTML(task.notes)}</div>` : '';

  li.innerHTML = `
    <div class="task-checkbox">
      <input type="checkbox" id="chk_${task.id}" ${task.completed ? 'checked' : ''}>
      <label for="chk_${task.id}" title="${task.completed ? 'Mark pending' : 'Mark complete'}"></label>
    </div>
    <div class="task-body">
      <div class="task-text" title="${escapeHTML(task.text)}">${escapeHTML(task.text)}</div>
      <div class="task-meta-row">
        <span class="tag tag-priority-${task.priority}">${priorityLabel[task.priority]}</span>
        <span class="tag">${categoryEmoji[task.category] || '📌'} ${capitalize(task.category)}</span>
        ${duePart}
      </div>
      ${notesPart}
    </div>
    <div class="task-actions">
      <button class="task-btn edit" title="Edit task">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <button class="task-btn delete" title="Delete task">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
          <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
      </button>
    </div>
  `;

  li.querySelector(`#chk_${task.id}`).addEventListener('change', () => toggleTask(task.id));
  li.querySelector('.edit').addEventListener('click', () => openEdit(task.id));
  li.querySelector('.delete').addEventListener('click', () => deleteTask(task.id));

  return li;
}

// ---- STATS ----
function updateStats() {
  const total   = tasks.length;
  const done    = tasks.filter(t => t.completed).length;
  const pending = total - done;
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0;

  document.getElementById('statTotal').textContent    = total;
  document.getElementById('statPending').textContent  = pending;
  document.getElementById('statDone').textContent     = done;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressPct').textContent  = pct + '%';
}

// ---- LOADING STATE ----
function setLoading(on) {
  isLoading = on;
  const list  = document.getElementById('taskList');
  const empty = document.getElementById('emptyState');
  if (on) {
    list.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:var(--text-muted);font-size:14px;">
        <div style="font-size:28px;margin-bottom:12px;animation:spin 1.5s linear infinite;display:inline-block">⟳</div>
        <div>Loading tasks…</div>
      </div>`;
    empty.classList.remove('visible');
  }
}

// ---- TOAST ----
let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ---- HELPERS ----
function escapeHTML(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}