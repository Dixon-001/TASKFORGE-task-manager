let tasks = JSON.parse(localStorage.getItem("taskforge")) || [];
let editingId = null;
let selectedIds = new Set();

let currentFilter = "all";
let currentPriority = "All";
let currentCategory = "All";
let currentSort = "Newest";

const taskList = document.getElementById("task-list");
const dialog = document.getElementById("my-dialog");
const form = document.getElementById("task-form");
const titleInput = document.getElementById("task-title");
const descInput = document.getElementById("task-desc");
const catInput = document.getElementById("task-category");
const priInput = document.getElementById("task-priority");
const dueInput = document.getElementById("task-due");
const selectAllCb = document.getElementById("select-all");
const deleteSelectedBtn = document.getElementById("delete-selected");
const clearAllBtn = document.getElementById("clear-all");
const selectedCount = document.getElementById("selected-count");
const searchInput = document.getElementById("search-input");

const filterPriority = document.getElementById("filter-priority");
const filterCategory = document.getElementById("filter-category");
const filterSort = document.getElementById("filter-sort");

const exportSelectedBtn = document.createElement("button");
exportSelectedBtn.id = "export-selected";
exportSelectedBtn.textContent = "Export Selected";
exportSelectedBtn.disabled = true;
exportSelectedBtn.className = "px-3 py-1.5 text-sm font-medium rounded border bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed";
deleteSelectedBtn.after(exportSelectedBtn);

const importInput = document.createElement("input");
importInput.type = "file";
importInput.accept = ".json,application/json";
importInput.className = "hidden";

const importBtn = document.createElement("button");
importBtn.id = "import-tasks";
importBtn.textContent = "Import Tasks";
importBtn.className = "px-3 py-1.5 text-sm font-medium rounded border bg-white text-gray-600 hover:bg-gray-50";
exportSelectedBtn.after(importBtn);
importBtn.after(importInput);

function save() {
    localStorage.setItem("taskforge", JSON.stringify(tasks));
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const today = new Date().toISOString().split("T")[0];
    const overdue = tasks.filter(t => !t.completed && t.dueDate && t.dueDate < today).length;

    document.querySelector("#totalTasks .text-2xl").textContent = total;
    document.querySelector("#completedTasks .text-2xl").textContent = completed;
    document.querySelector("#PendingTasks .text-2xl").textContent = pending;
    document.querySelector("#overdueTasks .text-3xl").textContent = overdue;
}

searchInput.addEventListener("input", () => {
    render();
});

function getFilteredTasks() {
    let result = [...tasks];

    const query = searchInput.value.trim().toLowerCase();
    if (query) {
        result = result.filter(task =>
            task.title.toLowerCase().includes(query) ||
            task.category.toLowerCase().includes(query) ||
            task.priority.toLowerCase().includes(query)
        );
    }

    if (currentFilter !== "all") {
        const today = new Date().toISOString().split("T")[0];
        if (currentFilter === "completed") {
            result = result.filter(t => t.completed);
        } else if (currentFilter === "pending") {
            result = result.filter(t => !t.completed && !(t.dueDate && t.dueDate < today));
        } else if (currentFilter === "overdue") {
            result = result.filter(t => !t.completed && t.dueDate && t.dueDate < today);
        }
    }

    if (currentPriority !== "All") {
        result = result.filter(t => t.priority === currentPriority);
    }

    if (currentCategory !== "All") {
        result = result.filter(t => t.category === currentCategory);
    }

    if (currentSort === "Newest") {
        result.sort((a, b) => b.id.localeCompare(a.id));
    } else if (currentSort === "Oldest") {
        result.sort((a, b) => a.id.localeCompare(b.id));
    } else if (currentSort === "Priority") {
        const order = { "High": 0, "Medium": 1, "Low": 2 };
        result.sort((a, b) => order[a.priority] - order[b.priority]);
    } else if (currentSort === "Due Date") {
        result.sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
    }

    return result;
}

function updateBulkBar() {
    const count = selectedIds.size;
    selectedCount.textContent = `${count} selected`;
    selectedCount.classList.toggle("hidden", count === 0);
    deleteSelectedBtn.disabled = count === 0;
    exportSelectedBtn.disabled = count === 0;

    selectAllCb.checked = tasks.length > 0 && count === tasks.length;
    selectAllCb.indeterminate = count > 0 && count < tasks.length;
}

function render() {
    const filtered = getFilteredTasks();
    taskList.innerHTML = "";

    if (filtered.length === 0) {
        taskList.innerHTML = `<div class="p-8 text-center text-gray-400">No tasks found, Add task.</div>`;
    }

    filtered.forEach(task => {
        const row = document.createElement("div");
        row.dataset.id = task.id;
        row.className = `flex items-start gap-4 p-5 transition-opacity ${task.completed ? "opacity-50" : ""}`;

        const today = new Date().toISOString().split("T")[0];
        const isOverdue = !task.completed && task.dueDate && task.dueDate < today;
        const dueClass = isOverdue ? "text-red-500" : "text-gray-700";
        const statusText = task.completed ? "Completed" : isOverdue ? "Overdue" : "Pending";
        const statusClass = task.completed ? "text-green-600" : isOverdue ? "text-red-500" : "text-blue-600";

        row.innerHTML = `
        <input type="checkbox" class="select-cb mt-1 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" ${selectedIds.has(task.id) ? "checked" : ""}>
        <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
            <span class="text-xs font-bold px-2 py-0.5 rounded ${
                task.priority === "High" ? "text-red-600 bg-red-50" :
                task.priority === "Medium" ? "text-yellow-600 bg-yellow-50" :
                "text-green-600 bg-green-50"
            }">${task.priority.toUpperCase()}</span>
            <span class="text-xs text-gray-400">${task.category}</span>
            <h3 class="font-semibold ${task.completed ? "text-gray-400 line-through" : "text-gray-900"}">${task.title}</h3>
            </div>
            <p class="text-sm text-gray-500 mt-1">${task.description || "No description"}</p>
            <div class="flex items-center gap-4 mt-3 text-xs">
            <span class="text-gray-400">DUE <span class="${dueClass} font-medium">${task.dueDate || "—"}</span></span>
            <span class="text-gray-400">STATUS <span class="${statusClass} font-medium">${statusText}</span></span>
            </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
            <button class="complete-btn text-sm text-green-600 hover:text-green-700 font-medium">${task.completed ? "Undo" : "Complete"}</button>
            <button class="edit-btn text-sm text-gray-500 hover:text-gray-700 font-medium">Edit</button>
            <button class="delete-btn text-sm text-red-500 hover:text-red-700 font-medium">Delete</button>
        </div>
        `;
        taskList.appendChild(row);
    });

    updateStats();
    updateBulkBar();
}

document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('[data-filter]').forEach(b => {
            b.classList.remove('bg-blue-600', 'text-white');
            b.classList.add('bg-white', 'text-gray-600', 'hover:bg-gray-50');
        });
        btn.classList.remove('bg-white', 'text-gray-600', 'hover:bg-gray-50');
        btn.classList.add('bg-blue-600', 'text-white');
        currentFilter = btn.dataset.filter;
        render();
    });
});

filterPriority.addEventListener('change', () => {
    currentPriority = filterPriority.value;
    render();
});

filterCategory.addEventListener('change', () => {
    currentCategory = filterCategory.value;
    render();
});

filterSort.addEventListener('change', () => {
    currentSort = filterSort.value;
    render();
});

taskList.addEventListener("click", (e) => {
    const row = e.target.closest("[data-id]");
    if (!row) return;
    const id = row.dataset.id;

    if (e.target.classList.contains("select-cb")) {
        if (selectedIds.has(id)) selectedIds.delete(id);
        else selectedIds.add(id);
        updateBulkBar();
        return;
    }

    if (e.target.classList.contains("complete-btn")) {
        const task = tasks.find(t => t.id === id);
        if (task) task.completed = !task.completed;
        save(); render();
        return;
    }

    if (e.target.classList.contains("edit-btn")) {
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        editingId = id;
        titleInput.value = task.title;
        descInput.value = task.description;
        catInput.value = task.category;
        priInput.value = task.priority;
        dueInput.value = task.dueDate;
        document.querySelector("#my-dialog h2").textContent = "Edit Task";
        form.querySelector('[type="submit"]').textContent = "Save Changes";
        dialog.showModal();
        return;
    }

    if (e.target.classList.contains("delete-btn")) {
        if (!confirm("Delete this task?")) return;
        tasks = tasks.filter(t => t.id !== id);
        selectedIds.delete(id);
        save(); render();
    }
});

selectAllCb.addEventListener("change", () => {
    if (selectAllCb.checked) {
        selectedIds = new Set(tasks.map(t => t.id));
    } else {
        selectedIds.clear();
    }
    taskList.querySelectorAll(".select-cb").forEach(cb => {
        cb.checked = selectAllCb.checked;
    });
    updateBulkBar();
});

deleteSelectedBtn.addEventListener("click", () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} task(s)?`)) return;
    tasks = tasks.filter(t => !selectedIds.has(t.id));
    selectedIds.clear();
    save(); render();
});

exportSelectedBtn.addEventListener("click", () => {
    const selected = tasks.filter(t => selectedIds.has(t.id));
    if (selected.length === 0) return;

    const blob = new Blob([JSON.stringify(selected, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `taskforge-tasks-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
});

importBtn.addEventListener("click", () => importInput.click());

importInput.addEventListener("change", () => {
    const file = importInput.files[0];
    importInput.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => importTasks(reader.result);
    reader.readAsText(file);
});

function importTasks(text) {
    const data = JSON.parse(text);

    const clean = s => String(s ?? "").replace(/[<>]/g, "").trim();
    const items = (Array.isArray(data) ? data : [data])
        .filter(t => t && typeof t === "object" && clean(t.title))
        .map(t => ({
            id: crypto.randomUUID(),
            title: clean(t.title),
            description: clean(t.description),
            category: clean(t.category) || catInput.options[0].value,
            priority: ["High", "Medium", "Low"].includes(t.priority) ? t.priority : "Medium",
            dueDate: /^\d{4}-\d{2}-\d{2}$/.test(t.dueDate) ? t.dueDate : "",
            completed: t.completed === true,
        }));

    if (items.length === 0) {
        alert("No valid tasks found in this file.");
        return;
    }

    tasks.unshift(...items);
    save(); render();
    alert(`${items.length} task(s) imported.`);
}

clearAllBtn.addEventListener("click", () => {
    if (tasks.length === 0) return;
    if (!confirm(`Delete ALL ${tasks.length} tasks? This cannot be undone.`)) return;
    tasks = [];
    selectedIds.clear();
    save(); render();
});

form.addEventListener("submit", (e) => {
    e.preventDefault();
    const taskData = {
        title: titleInput.value.trim(),
        description: descInput.value.trim(),
        category: catInput.value,
        priority: priInput.value,
        dueDate: dueInput.value,
        completed: false,
    };
    if (!taskData.title) return;

    if (editingId) {
        const idx = tasks.findIndex(t => t.id === editingId);
        if (idx !== -1) tasks[idx] = { ...tasks[idx], ...taskData };
        editingId = null;
    } else {
        tasks.unshift({ id: crypto.randomUUID(), ...taskData });
    }

    save(); render();
    form.reset();
    dialog.close();
});

function openNewTaskForm() {
    editingId = null;
    form.reset();
    document.querySelector("#my-dialog h2").textContent = "Add Task";
    form.querySelector('[type="submit"]').textContent = "Add Task";
    dialog.showModal();
}

document.getElementById("open-btn").addEventListener("click", openNewTaskForm);

document.getElementById("close-btn").addEventListener("click", () => {
    editingId = null;
    dialog.close();
});

render();

document.addEventListener("keydown", (e) => {
    const el = e.target;
    const isTyping =
        el.tagName === "TEXTAREA" ||
        el.tagName === "SELECT" ||
        el.isContentEditable ||
        (el.tagName === "INPUT" &&
        !["checkbox", "radio", "button", "submit"].includes(el.type));
    const hasModifier = e.ctrlKey || e.metaKey || e.altKey;

    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && dialog.open) {
        e.preventDefault();
        form.requestSubmit();
        return;
    }

    if (e.key === "Escape" && dialog.open) {
        e.preventDefault();
        editingId = null;
        dialog.close();
        return;
    }

    if (dialog.open || isTyping || hasModifier) return;

    if (e.key === "/") {
        e.preventDefault();
        searchInput.focus();
        return;
    }

    if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        openNewTaskForm();
    }
});