"use strict";

const TODO_STATUS = ["todo", "in-progress", "done", "archived"];


const addTodoBtn = document.getElementById("todo-init");
addTodoBtn.addEventListener("click", createTodo);


/** Opens the To-Do creation popup and sets up the form handler to create a new To-Do and update the board. */
function createTodo() {
    const newTodoPopup = window.popup.create();
    newTodoPopup.load("/assets/snippets/todo.html", () => {
        renderPopupSelects();

        const createBtn = newTodoPopup.element.querySelector("#todo-create");
        createBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            const form = new FormData(newTodoPopup.element.querySelector("#todo-form"));

            window.todo.create(
                form.get("title"),
                form.get("content"),
                form.get("status") ?? "todo",
                form.get("priority") ?? "low",
                form.get("deadline")
            );

            updateBoard(window.todo.getAll());
            newTodoPopup.close();
        });
    })

    newTodoPopup.open();
}


/**
 * Opens the To-Do editing popup,
 * pre-fills the form with existing data
 * and sets up the form handler to save changes
 * and update the board.
 *
 * @param key
 */
function editTodo(key) {
    const editTodoPopup = window.popup.create();
    editTodoPopup.load("/assets/snippets/todo.html", () => {
        const todo = window.todo.get(key);

        if (!todo) {
            editTodoPopup.close();
            throw new Error("To-Do not found with key: " + key);
        }

        // Open popup before loading content to ensure elements are available for manipulation
        editTodoPopup.open();

        const saveBtn   = editTodoPopup.element.querySelector("#todo-create");
        const deleteBtn = editTodoPopup.element.querySelector("#todo-delete");

        const title     = editTodoPopup.element.querySelector("input[name='title']");
        const content   = editTodoPopup.element.querySelector("textarea[name='content']");
        const status    = editTodoPopup.element.querySelector("#status");
        const priority  = editTodoPopup.element.querySelector("#priority");
        const deadline  = editTodoPopup.element.querySelector("input[name='deadline']");

        saveBtn.value           = "Save";
        title.value             = todo.title;
        content.value           = todo.content;
        status.value            = todo.status;
        priority.value          = todo.priority;
        deadline.value          = todo.deadline ?? "";

        deleteBtn.classList.remove("hidden");
        deleteBtn.addEventListener("click", () => {
            editTodoPopup.close();
            deleteTodo(key);
        });

        renderPopupSelects();

        saveBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            window.todo.edit(key, {
                title:      title.value,
                content:    content.value,
                status:     status.value,
                priority:   priority.value,
                deadline:   deadline.value || null
            });

            updateBoard(window.todo.getAll());
            editTodoPopup.close();
        });
    });
}


/**
 * Deletes a To-Do by its key and updates the board
 *
 * @param key
 * */
function deleteTodo(key) {
    window.todo.delete(key)
    updateBoard(window.todo.getAll());
}


/** Renders the custom select dropdowns in the To-Do creation popup with styling for status and priority options. */
function renderPopupSelects() {
    window.ui.Select.init(
        document.querySelector("select#status"),
        {
            renderOption(option) {
                const wrapper = document.createElement("div");
                wrapper.className            = "todo-select-option select-option";
                wrapper.dataset.value        = option.value;

                wrapper.innerHTML = `
                    <div class="tag tag-status ${option.value}">
                        ${option.label}
                    </div>
                `;

                if (option.selected) {
                    wrapper.classList.add("selected");
                }

                return wrapper;
            }
        }
    )

    window.ui.Select.init(
        document.querySelector("select#priority"),
        {
            renderOption(option) {
                const wrapper = document.createElement("div");
                wrapper.className            = "priority-select-option select-option";
                wrapper.dataset.value        = option.value;

                wrapper.innerHTML = `
                    <div class="tag tag-priority ${option.value}">
                        ${option.label}
                    </div>
                `;

                if (option.selected) {
                    wrapper.classList.add("selected");
                }

                return wrapper;
            }
        }
    )
}


/**
 * Renders a To-Do item as an HTML string to be inserted into columns.
 *
 * @param todo
 * @returns {string}
 */
function renderTodo(todo) {
    let deadline;

    if (todo.deadline) {
        deadline = new Date(todo.deadline).toLocaleDateString("en-GB", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    }

    return `
        <div class="todo-item" data-key="${todo.key}" draggable="true">
            <div class="flex flex-justify-space-between flex-gap-md flex-align-center">
                <h5>${todo.title}</h5>
                <span class="tag tag-priority ${todo.priority}">${todo.priority}</span>
            </div>

            ${todo.content ? `<p class="light">${todo.content}</p>` : "<i class='light'>No content...</i>"}
            
            <div class="flex flex-justify-space-between flex-align-center flex-gap-md">
                <div></div>
                ${deadline ? `<span class="deadline light">${deadline}</span>` : ""}
            </div>
        </div>
    `;
}


/** Updates the Board with the To-Dos in each column */
function updateBoard(todos) {

    TODO_STATUS.forEach(status => {
        let html          = "";
        const countElem = document.querySelector(`div.todo-column[data-status="${status}"] .count`);
        const container = document.querySelector(`div.todo-column[data-status="${status}"] .content`);

        countElem.innerText = todos.filter(todo => todo.status === status).length + "";

        todos.filter(todo => todo.status === status).forEach(todo => {
             html += renderTodo(todo);
        });

        container.innerHTML = html;
    });
}


/** Initializes events for the board, including click events for editing and drag-and-drop events for moving between columns. */
function initBoardEvents() {
    const board = document.getElementById("todo-board");
    const columns = document.querySelectorAll(".todo-column .content");

    board.addEventListener("click", (e) => {
        const item = e.target.closest(".todo-item");
        if (!item) return;

        const key = parseInt(item.dataset.key);
        editTodo(key);
    })

    board.addEventListener("dragstart", (e) => {
        const item = e.target.closest(".todo-item");
        if (!item) return;

        item.classList.add("dragging");
        e.dataTransfer.setData("text/plain", item.dataset.key);
    })

    board.addEventListener("dragend", (e) => {
        const item = e.target.closest(".todo-item");
        if (!item) return;

        item.classList.remove("dragging");
    })

    board.addEventListener("dragover", (e) => {
        const column = e.target.closest(".todo-column .content");
        if (!column) return;

        columns.forEach(col => col.classList.remove("drag-over"));

        column.classList.add("drag-over");
        e.preventDefault();
    })

    board.addEventListener("drop", (e) => {
        const column = e.target.closest(".todo-column .content");
        if (!column) return;

        e.preventDefault();

        const key = e.dataTransfer.getData("text/plain");
        const todo = window.todo.get(parseInt(key));

        if (!todo) return;

        const newStatus = column.closest(".todo-column").dataset.status;

        if (TODO_STATUS.includes(newStatus)) {
            window.todo.edit(todo.key, { status: newStatus });
            updateBoard(window.todo.getAll());
        }

        columns.forEach(col => col.classList.remove("drag-over"));
    })
}


/** Initially load To-Dos from storage and update the board */
window.todo.loadTemplateData(() => {
    updateBoard(window.todo.getAll());
    initBoardEvents();
});


window.ui.Select.initAll();