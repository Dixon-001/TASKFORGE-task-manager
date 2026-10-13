// Declaation of variables
                        let tasks = JSON.parse(localStorage.getItem("taskforge")) || [];
                        let editingId = null;
                        let selectedIds = new Set();

                        // Filter/Sort state
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

                        // Filter bar controls
                        const filterPriority = document.getElementById("filter-priority");
                        const filterCategory = document.getElementById("filter-category");
                        const filterSort = document.getElementById("filter-sort");

                        // saving to local storage
                        function save() {
                        localStorage.setItem("taskforge", JSON.stringify(tasks));
                        }

                        // stats
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

                        // search
                        searchInput.addEventListener("input", () => {
                        render();
                        });

                        function getFilteredTasks() {
                        let result = [...tasks];

                        // Search
                        const query = searchInput.value.trim().toLowerCase();
                        if (query) {
                            result = result.filter(task =>
                                task.title.toLowerCase().includes(query) ||
                                task.category.toLowerCase().includes(query) ||
                                task.priority.toLowerCase().includes(query)
                            );
                        }

                        // Status
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

                        // Priority
                        if (currentPriority !== "All") {
                            result = result.filter(t => t.priority === currentPriority);
                        }

                        // Category
                        if (currentCategory !== "All") {
                            result = result.filter(t => t.category === currentCategory);
                        }

                        // Sort
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

                        // Bulk selection
                        function updateBulkBar() {
                        const count = selectedIds.size;
                        selectedCount.textContent = `${count} selected`;
                        selectedCount.classList.toggle("hidden", count === 0);
                        deleteSelectedBtn.disabled = count === 0;

                        // Sync "Select All" checkbox
                        selectAllCb.checked = tasks.length > 0 && count === tasks.length;
                        selectAllCb.indeterminate = count > 0 && count < tasks.length;
                        }

                        // render
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

                        // Status filter buttons
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

                        // Priority dropdown
                        filterPriority.addEventListener('change', () => {
                            currentPriority = filterPriority.value;
                            render();
                        });

                        // Category dropdown
                        filterCategory.addEventListener('change', () => {
                            currentCategory = filterCategory.value;
                            render();
                        });

                        // Sort dropdown
                        filterSort.addEventListener('change', () => {
                            currentSort = filterSort.value;
                            render();
                        });

                        // task list event
                        taskList.addEventListener("click", (e) => {
                        const row = e.target.closest("[data-id]");
                        if (!row) return;
                        const id = row.dataset.id;

                        // Selection checkbox
                        if (e.target.classList.contains("select-cb")) {
                            if (selectedIds.has(id)) selectedIds.delete(id);
                            else selectedIds.add(id);
                            updateBulkBar();
                            return;
                        }

                        // Complete / Undo
                        if (e.target.classList.contains("complete-btn")) {
                            const task = tasks.find(t => t.id === id);
                            if (task) task.completed = !task.completed;
                            save(); render();
                            return;
                        }

                        // Edit
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

                        // Delete single
                        if (e.target.classList.contains("delete-btn")) {
                            if (!confirm("Delete this task?")) return;
                            tasks = tasks.filter(t => t.id !== id);
                            selectedIds.delete(id);
                            save(); render();
                        }
                        });

                        // Select All
                        selectAllCb.addEventListener("change", () => {
                        if (selectAllCb.checked) {
                            selectedIds = new Set(tasks.map(t => t.id));
                        } else {
                            selectedIds.clear();
                        }
                        // Update checkboxes visually without full re-render
                        taskList.querySelectorAll(".select-cb").forEach(cb => {
                            cb.checked = selectAllCb.checked;
                        });
                        updateBulkBar();
                        });

                        // Delete Selected
                        deleteSelectedBtn.addEventListener("click", () => {
                        if (selectedIds.size === 0) return;
                        if (!confirm(`Delete ${selectedIds.size} task(s)?`)) return;
                        tasks = tasks.filter(t => !selectedIds.has(t.id));
                        selectedIds.clear();
                        save(); render();
                        });

                        // CLEAR ALL 
                        clearAllBtn.addEventListener("click", () => {
                        if (tasks.length === 0) return;
                        if (!confirm(`Delete ALL ${tasks.length} tasks? This cannot be undone.`)) return;
                        tasks = [];
                        selectedIds.clear();
                        save(); render();
                        });

                        //  Add / Edit Submission
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

                        // OPEN DIALOG (ADD) 
                        document.getElementById("open-btn").addEventListener("click", () => {
                        editingId = null;
                        form.reset();
                        document.querySelector("#my-dialog h2").textContent = "Add Task";
                        form.querySelector('[type="submit"]').textContent = "Add Task";
                        dialog.showModal();
                        });

                        document.getElementById("close-btn").addEventListener("click", () => {
                        editingId = null;
                        dialog.close();
                        });

                        // display
                        render();

                       // SHORTCUTS
                        function openNewTaskForm() {
                        editingId = null;
                        form.reset();
                        document.querySelector("#my-dialog h2").textContent = "Add Task";
                        form.querySelector('[type="submit"]').textContent = "Add Task";
                        dialog.showModal();
                        }

                        document.addEventListener("keydown", (e) => {
                        const el = e.target;
                        const isTyping =
                            el.tagName === "TEXTAREA" ||
                            el.tagName === "SELECT" ||
                            el.isContentEditable ||
                            (el.tagName === "INPUT" &&
                            !["checkbox", "radio", "button", "submit"].includes(el.type));
                        const hasModifier = e.ctrlKey || e.metaKey || e.altKey;

                        // task submissin 
                        if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && dialog.open) {
                            e.preventDefault();
                            form.requestSubmit();
                            return;
                        }

                        // close modal shortcut
                        if (e.key === "Escape" && dialog.open) {
                            e.preventDefault();
                            editingId = null;
                            dialog.close();
                            return;
                        }

                        // shortcut  ot working
                        if (dialog.open || isTyping || hasModifier) return;

                        // "/" shortcut
                        if (e.key === "/") {
                            e.preventDefault();
                            searchInput.focus();
                            return;
                        }

                        // "n" shortcut
                        if (e.key.toLowerCase() === "n") {
                            e.preventDefault();
                            openNewTaskForm();
                        }
                        });