# TASKFORGE-task-manager
TaskForge is a responsive, browser-based task manager built to make organizing and tracking tasks straightforward. This project reached its minimum viable product (MVP) as part of my software engineering learning journey at Blockfuse Labs.
The application uses vanilla JavaScript and DOM manipulation for interactive task management and the browser's localStorage to preserve tasks after a refresh. The interface includes light and dark modes and is designed for mobile and desktop.
Documentation scope: The JavaScript implementation described below is based on the supplied TaskForge script. The theme-switching and responsive-layout implementations were not included in that script, so those features are described at the product level rather than attributed to specific code.

Features
- Create tasks with a title, description, category, priority, and optional due date.
- Edit existing tasks and mark tasks completed or incomplete.
- Delete one task, select multiple tasks for bulk deletion, or clear all tasks (with confirmation prompts).
- Search tasks by title, category, or priority.
- Filter by status (all, completed, pending, overdue), priority, and category.
- Sort by Newest, Oldest, Priority, or Due Date.
- View counts for total, completed, pending, and overdue tasks.
- Keep tasks across browser reloads using localStorage.
- Switch between light and dark modes; use the interface on mobile and desktop.
Getting started
1. Clone or download the TaskForge repository.
2. Open the project's HTML entry point in a browser, or use a local development server such as VS Code Live Server.
3. Create a task through the Add Task modal.
4. Use the search, filter, sort, and task-action controls to manage your tasks.
No backend is needed for the task persistence shown in the supplied JavaScript. Task data is stored in the current browser and origin, not synchronized between devices.
Task data and application state
TaskForge keeps its task records in an array:
let tasks = JSON.parse(localStorage.getItem("taskforge")) || [];
let editingId = null;
let selectedIds = new Set();

let currentFilter = "all";
let currentPriority = "All";
let currentCategory = "All";
let currentSort = "Newest";
A newly created task has the following shape:
{
  id: crypto.randomUUID(),
  title: "Complete the README",
  description: "Document the JavaScript implementation",
  category: "Work", // example; actual options come from the form
  priority: "High",
  dueDate: "2026-10-15",
  completed: false
}
- tasks is the main in-memory collection.
- editingId determines whether the form creates a task or updates an existing one.
- selectedIds is a Set of task IDs selected for bulk deletion.
- currentFilter, currentPriority, currentCategory, and currentSort represent the current view settings.
Major DOM methods and properties used
API	Where and why it is used
document.getElementById()	Finds the task list, modal, form fields, search box, and action controls.
document.querySelector()	Finds dashboard counters, the modal heading, and the form submit button.
document.querySelectorAll()	Finds status filter buttons and task selection checkboxes.
document.createElement("div")	Creates each task row during rendering.
element.innerHTML	Clears the list and builds task-row markup, including action buttons and checkboxes.
element.appendChild()	Inserts each generated task row into the task list.
element.textContent	Updates counters, the selected-task label, and modal button/heading text.
element.dataset.id / element.dataset.filter	Stores and reads task IDs on rows and status values on filter buttons.
element.classList.add/remove/toggle/contains()	Updates filter-button styles, bulk-selection visibility, and identifies clicked controls.
element.closest("[data-id]")	Locates the parent task row for a clicked control.
element.addEventListener()	Responds to clicks, input, change events, and form submission.
dialog.showModal() / dialog.close()	Opens and closes the native task form dialog.
form.reset()	Clears form fields before adding a task and after submission.


Rendering task rows
render() is the main UI refresh function. It calls getFilteredTasks(), clears the task list, creates rows with document.createElement(), assigns each row a data-id, fills its content, and appends it to the DOM.
const filtered = getFilteredTasks();
taskList.innerHTML = "";

filtered.forEach(task => {
  const row = document.createElement("div");
  row.dataset.id = task.id;
  // The supplied implementation builds row.innerHTML here.
  taskList.appendChild(row);
});

updateStats();
updateBulkBar();
When no tasks match the current search and filters, the application displays a “No tasks found, Add task.” message. render() also refreshes the dashboard and bulk-selection UI.
Event delegation
Instead of attaching separate click listeners to every dynamically generated Edit, Delete, Select, and Complete control, TaskForge attaches one click listener to the parent taskList element.
taskList.addEventListener("click", (e) => {
  const row = e.target.closest("[data-id]");
  if (!row) return;

  const id = row.dataset.id;

  if (e.target.classList.contains("select-cb")) {
    // Add/remove id in selectedIds; updateBulkBar().
    return;
  }

  if (e.target.classList.contains("complete-cb")) {
    // Toggle completed; save(); render().
    return;
  }

  if (e.target.classList.contains("edit-btn")) {
    // Populate the form and open the dialog.
    return;
  }

  if (e.target.classList.contains("delete-btn")) {
    // Confirm deletion; remove the task; save(); render().
  }
});
This works because click events bubble from child controls to the parent. closest("[data-id]") finds the relevant task row, row.dataset.id identifies its task, and classList.contains() determines which action was requested. Newly rendered rows continue to work without registering additional row-level listeners.
Other controls use their own listeners: search uses input, dropdowns and Select All use change, the form uses submit, and modal and bulk-delete buttons use click.
Task management logic
Create a task
The submit handler calls e.preventDefault(), reads and trims form values, and refuses to save a task with an empty title. If editingId is null, it creates a task with crypto.randomUUID() and inserts it at the beginning of the array with tasks.unshift().
tasks.unshift({ id: crypto.randomUUID(), ...taskData });
save();
render();
form.reset();
dialog.close();
Edit a task
Clicking Edit finds the task using tasks.find(), stores its ID in editingId, fills the modal inputs, changes the modal heading and submit button text, and opens the dialog. On submission, tasks.findIndex() locates the task and object spread syntax updates its fields:
const idx = tasks.findIndex(t => t.id === editingId);
if (idx !== -1) tasks[idx] = { ...tasks[idx], ...taskData };
Current behavior: taskData includes completed: false, so saving an edit also marks a previously completed task as incomplete. This is a candidate for improvement.
Complete or reopen a task
The complete-cb control toggles the task's completed boolean and then calls save() and render(). Completed tasks receive reduced opacity and a strikethrough title in the rendered UI.
Delete one task
The Delete button requests confirmation, then removes the matching ID using tasks.filter(), removes it from selectedIds, and saves and re-renders.
Select and delete multiple tasks
Selection checkboxes add or remove IDs in the selectedIds Set. updateBulkBar() displays the selection count, enables or disables Delete Selected, and updates the Select All checkbox's checked/indeterminate state.
Bulk deletion retains only tasks whose IDs are not selected:
tasks = tasks.filter(t => !selectedIds.has(t.id));
selectedIds.clear();
save();
render();
Select All currently selects all tasks in the tasks array, not only those visible after filtering. The current checkbox synchronization logic may also need refinement when filters are active.
Clear all tasks
After a confirmation prompt, the Clear All handler sets tasks = [], clears selectedIds, and calls save() and render().
Search, filters, and sorting
getFilteredTasks() begins with a shallow copy, let result = [...tasks], so sorting the displayed results does not reorder the main tasks array.
1. Search: lowercases and trims the search input, then uses filter() and includes() to match task titles, categories, or priorities.
2. Status: filters completed tasks; pending tasks exclude overdue incomplete tasks; overdue tasks are incomplete and have a due date earlier than today.
3. Priority and category: applies additional exact-match filters if the respective dropdown is not set to All.
4. Sort: uses Array.prototype.sort() with different comparators:
   - Newest / Oldest: compares IDs using localeCompare().
   - Priority: orders High → Medium → Low.
   - Due Date: compares date strings and places missing dates after dated tasks using the "9999" fallback.
Important limitation: Task IDs are generated with crypto.randomUUID(). UUID strings do not reliably encode creation time, so the current Newest and Oldest sorting does not necessarily reflect when tasks were created. Adding a createdAt timestamp would make chronological sorting accurate.
Category is supported as a filter in the supplied JavaScript, but there is no separate category sort branch.
Dashboard statistics
updateStats() derives its values from the entire tasks array, not only the filtered results:
const total = tasks.length;
const completed = tasks.filter(t => t.completed).length;
const pending = total - completed;
const today = new Date().toISOString().split("T")[0];
const overdue = tasks.filter(
  t => !t.completed && t.dueDate && t.dueDate < today
).length;
It then writes the totals into dashboard elements using document.querySelector(...).textContent.
Definition detail: The dashboard's pending count includes every incomplete task, including overdue ones. However, the Pending status filter excludes overdue tasks. As a result, the pending dashboard count can differ from the number shown when the Pending filter is selected.
The date comparison relies on ISO-formatted YYYY-MM-DD strings. toISOString() uses UTC, which can differ from a user's local calendar date near midnight.
localStorage implementation
TaskForge uses browser localStorage to keep task data after the page reloads.
Read saved tasks at startup
let tasks = JSON.parse(localStorage.getItem("taskforge")) || [];
- localStorage.getItem("taskforge") reads the stored string, or returns null if the key is absent.
- JSON.parse(...) converts a stored JSON string back into a JavaScript array.
- || [] supplies an empty array if nothing was saved.
Save task changes
function save() {
  localStorage.setItem("taskforge", JSON.stringify(tasks));
}
- JSON.stringify(tasks) converts the array of task objects into a JSON string.
- localStorage.setItem("taskforge", ...) stores that string under the taskforge key.
The application calls save() after task creation, editing, completion changes, single deletion, bulk deletion, and clearing all tasks. After initializing event handlers, it calls render() to display any tasks restored from storage.
Persistence limitations: localStorage is specific to the browser and website origin. Data is not automatically synced between devices, can be removed when browser/site data is cleared, and is not suitable for sensitive information. The current initialization does not catch malformed stored JSON; an invalid value could cause JSON.parse() to throw.
Light/dark mode and responsive layout
TaskForge offers light/dark theme switching and a layout usable on desktop and mobile. The provided JavaScript file does not include the theme-toggle logic or responsive CSS/HTML, so their exact implementation cannot be documented from this source alone.
Technologies and JavaScript concepts
- HTML, TailwindCSS, and vanilla JavaScript
- DOM manipulation and native <dialog> interactions
- Event listeners and event delegation
- Arrays (filter, find, findIndex, map, forEach, sort, unshift)
- Set for multi-selection
- Object spread syntax and crypto.randomUUID()
- JSON serialization and browser localStorage
Potential improvements
- Store a createdAt timestamp for reliable Newest/Oldest sorting.
- Preserve the existing completed value when editing a task.
- Make Select All and selection indicators consistent with active filters.
- Align the dashboard's pending count with the Pending filter definition, or clearly distinguish incomplete and non-overdue tasks.
- Validate and safely recover from malformed localStorage data.
- Avoid inserting untrusted task text directly into innerHTML; use textContent or safe DOM construction to prevent HTML injection.
- Consider local-date handling for overdue checks.
- Add tests for task operations, filtering, sorting, and persistence.
Project status
MVP reached. TaskForge supports core task management, search, filtering, sorting, dashboard counts, bulk actions, persistent browser storage, and a responsive interface. Further refinements and features are planned.
