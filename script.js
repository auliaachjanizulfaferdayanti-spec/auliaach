/* ==========================================================
   To-Do List Life Dashboard
   Vanilla JavaScript, data saved in Local Storage
   Challenges: Light/Dark mode, Custom name, Prevent duplicates
   ========================================================== */

// ---------- Local Storage helpers (safe) ----------
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("Could not save to Local Storage", e);
  }
}

// ==========================================================
// 1. GREETING (time, date, greeting, custom name)
// ==========================================================
const clockEl = document.getElementById("clock");
const dateEl = document.getElementById("date");
const greetingEl = document.getElementById("greeting");
const nameInput = document.getElementById("nameInput");
const saveNameBtn = document.getElementById("saveName");

let userName = load("userName", "");
nameInput.value = userName;

function getGreeting(hour) {
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  if (hour < 22) return "Good Evening";
  return "Good Night";
}

function updateClock() {
  const now = new Date();

  clockEl.textContent = now.toLocaleTimeString("en-GB"); // 24-hour HH:MM:SS
  dateEl.textContent = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  let text = getGreeting(now.getHours());
  if (userName) text += ", " + userName;
  greetingEl.textContent = text;
}

saveNameBtn.addEventListener("click", function () {
  userName = nameInput.value.trim();
  save("userName", userName);
  updateClock();
});

nameInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") saveNameBtn.click();
});

updateClock();
setInterval(updateClock, 1000);

// ==========================================================
// 2. FOCUS TIMER (25 minutes)
// ==========================================================
const FOCUS_SECONDS = 25 * 60;
const timerEl = document.getElementById("timerDisplay");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resetBtn = document.getElementById("resetBtn");

let remaining = FOCUS_SECONDS;
let timerId = null;
let endTime = 0;

function showTimer() {
  const m = String(Math.floor(remaining / 60)).padStart(2, "0");
  const s = String(remaining % 60).padStart(2, "0");
  timerEl.textContent = m + ":" + s;
}

function tick() {
  // Count from the end time so the timer stays accurate
  remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
  showTimer();

  if (remaining === 0) {
    stopTimer();
    alert("Time is up! Take a short break.");
  }
}

function startTimer() {
  if (timerId !== null || remaining === 0) return;
  endTime = Date.now() + remaining * 1000;
  timerId = setInterval(tick, 250);
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}

function resetTimer() {
  stopTimer();
  remaining = FOCUS_SECONDS;
  showTimer();
}

startBtn.addEventListener("click", startTimer);
stopBtn.addEventListener("click", stopTimer);
resetBtn.addEventListener("click", resetTimer);
showTimer();

// ==========================================================
// 3. TO-DO LIST (add, edit, done, delete, no duplicates)
// ==========================================================
const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");
const taskMessage = document.getElementById("taskMessage");

let tasks = load("tasks", []); // [{ id, text, done }]

function isDuplicate(text, ignoreId) {
  const lower = text.toLowerCase();
  return tasks.some(function (t) {
    return t.id !== ignoreId && t.text.toLowerCase() === lower;
  });
}

function renderTasks() {
  taskList.innerHTML = "";

  if (tasks.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "No tasks yet. Add your first one!";
    taskList.appendChild(empty);
    return;
  }

  tasks.forEach(function (task) {
    const li = document.createElement("li");
    li.className = "task-item" + (task.done ? " done" : "");

    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = task.done;
    check.setAttribute("aria-label", "Mark task as done");
    check.addEventListener("change", function () {
      task.done = check.checked;
      save("tasks", tasks);
      renderTasks();
    });

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn btn-light btn-small";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", function () {
      startEdit(li, task);
    });

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "btn btn-danger btn-small";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", function () {
      tasks = tasks.filter(function (t) { return t.id !== task.id; });
      save("tasks", tasks);
      renderTasks();
    });

    li.append(check, text, editBtn, delBtn);
    taskList.appendChild(li);
  });
}

function startEdit(li, task) {
  li.innerHTML = "";

  const input = document.createElement("input");
  input.type = "text";
  input.value = task.text;
  input.maxLength = 100;

  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.className = "btn btn-small";
  saveBtn.textContent = "Save";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "btn btn-light btn-small";
  cancelBtn.textContent = "Cancel";

  function commit() {
    const value = input.value.trim();
    if (value === "") {
      taskMessage.textContent = "Task cannot be empty.";
      return;
    }
    if (isDuplicate(value, task.id)) {
      taskMessage.textContent = "That task already exists.";
      return;
    }
    task.text = value;
    taskMessage.textContent = "";
    save("tasks", tasks);
    renderTasks();
  }

  saveBtn.addEventListener("click", commit);
  cancelBtn.addEventListener("click", function () {
    taskMessage.textContent = "";
    renderTasks();
  });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") renderTasks();
  });

  li.append(input, saveBtn, cancelBtn);
  input.focus();
}

function addTask() {
  const value = taskInput.value.trim();

  if (value === "") {
    taskMessage.textContent = "Please type a task first.";
    return;
  }
  if (isDuplicate(value, null)) {
    taskMessage.textContent = "That task already exists.";
    return;
  }

  tasks.push({ id: Date.now(), text: value, done: false });
  save("tasks", tasks);
  taskInput.value = "";
  taskMessage.textContent = "";
  renderTasks();
}

addTaskBtn.addEventListener("click", addTask);
taskInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") addTask();
});

renderTasks();

// ==========================================================
// 4. QUICK LINKS (saved in Local Storage)
// ==========================================================
const linkName = document.getElementById("linkName");
const linkUrl = document.getElementById("linkUrl");
const addLinkBtn = document.getElementById("addLinkBtn");
const linkList = document.getElementById("linkList");
const linkMessage = document.getElementById("linkMessage");

const defaultLinks = [
  { id: 1, name: "Google", url: "https://www.google.com" },
  { id: 2, name: "Gmail", url: "https://mail.google.com" },
  { id: 3, name: "Calendar", url: "https://calendar.google.com" }
];

let links = load("links", defaultLinks);

function normalizeUrl(value) {
  let url = value.trim();
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes(".")) return null;
    return parsed.href;
  } catch (e) {
    return null;
  }
}

function renderLinks() {
  linkList.innerHTML = "";

  if (links.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No quick links yet.";
    linkList.appendChild(empty);
    return;
  }

  links.forEach(function (link) {
    const wrap = document.createElement("div");
    wrap.className = "link-item";

    const a = document.createElement("a");
    a.href = link.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = link.name;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "link-remove";
    remove.textContent = "x";
    remove.setAttribute("aria-label", "Remove " + link.name);
    remove.addEventListener("click", function () {
      links = links.filter(function (l) { return l.id !== link.id; });
      save("links", links);
      renderLinks();
    });

    wrap.append(a, remove);
    linkList.appendChild(wrap);
  });
}

function addLink() {
  const name = linkName.value.trim();
  const url = normalizeUrl(linkUrl.value);

  if (name === "" || linkUrl.value.trim() === "") {
    linkMessage.textContent = "Please fill in both the name and the URL.";
    return;
  }
  if (url === null) {
    linkMessage.textContent = "That URL does not look valid.";
    return;
  }

  links.push({ id: Date.now(), name: name, url: url });
  save("links", links);
  linkName.value = "";
  linkUrl.value = "";
  linkMessage.textContent = "";
  renderLinks();
}

addLinkBtn.addEventListener("click", addLink);
linkUrl.addEventListener("keydown", function (e) {
  if (e.key === "Enter") addLink();
});

renderLinks();

// ==========================================================
// 5. LIGHT / DARK MODE
// ==========================================================
const themeToggle = document.getElementById("themeToggle");
const root = document.documentElement;

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "dark" ? "Light mode" : "Dark mode";
}

let savedTheme = load("theme", null);
if (savedTheme === null) {
  savedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
applyTheme(savedTheme);

themeToggle.addEventListener("click", function () {
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
  save("theme", next);
});