/**
 * __To-Do Module__
 *
 * This module provides a To-Do management system with
 * methods to create, edit, and retrieve To-Do items.
 * It now uses a REST API backed by the server DB instead of localStorage.
 */
window.todo = (function () {

    /**
     * The To-Do Item
     *
     * @param key
     * @param title
     * @param content
     * @param {"todo" | "in-progress" | "done" | "archived"} status
     * @param {"low" | "medium" | "high"} priority
     * @param deadline
     * @constructor
     */
    function Todo ({key, title, content, status, priority, deadline}) {
        this.key        = key;
        this.title      = title;
        this.content    = content;
        this.status     = status;
        this.priority   = priority;
        this.deadline   = deadline;
    }


    /**
     * The Storage Module
     *
     * @constructor
     */
    function Storage () {
        this.todos = [];
        this.nextKey = 1;
    }


    // Map server object to local To-Do
    function mapServerTodo(t) {
        return new Todo({
            key: t.key,
            title: t.title,
            content: t.content,
            status: t.status,
            priority: t.priority,
            deadline: t.deadline || null
        });
    }


    /**
     * Creates a new To-Do and stores it
     *
     * @param title
     * @param content
     * @param {"todo" | "in-progress" | "done" | "archived"} status
     * @param {"low" | "medium" | "high"} priority
     * @param deadline
     * @returns {Todo}
     */
    Storage.prototype.create = async function (title, content, status = "todo", priority = "low", deadline) {
        const payload = { title, content, status, priority, deadline };

        const res = await fetch('/api/todos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Failed to create todo');

        const created       = await res.json();
        const todo    = mapServerTodo(created);

        this.todos.push(todo);
        this.nextKey = Math.max(this.nextKey, todo.key + 1);

        return todo;
    }


    /**
     *  Edits an existing To-Do by sending updates to the server and updating local cache.
     *
     * @param key
     * @param updates
     * @returns {Promise<any>}
     */
    Storage.prototype.edit = async function (key, updates) {
        const res = await fetch(`/api/todos/${key}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });

        if (!res.ok) throw new Error('Failed to edit todo');
        const updated = await res.json();
        const todo = this.todos.find(t => t.key === updated.key);

        if (todo) {
            Object.assign(todo, updated);
        } else {
            this.todos.push(mapServerTodo(updated));
        }

        return updated;
    }


    /**
     * Gets a To-Do by its key
     * @param key
     * @returns {*}
     */
    Storage.prototype.get = function (key) {
        return this.todos.find(todo => todo.key === key);
    }


    /**
     * Gets all To-Dos
     * @returns {*[]}
     */
    Storage.prototype.getAll = function () {
        return [...this.todos];
    }


    /**
     * Delete a To-Do by its key.
     *
     * @param key
     * @returns {Promise<void>}
     */
    Storage.prototype.delete = async function (key) {
        const res = await fetch(`/api/todos/${key}`, { method: 'DELETE' });
        if (!res.ok && res.status !== 204) throw new Error('Failed to delete todo');

        const idx = this.todos.findIndex(t => t.key === key);
        if (idx !== -1) this.todos.splice(idx, 1);
    }


    /**
     * Loads To-Dos from the server and initializes local cache. Calls callback with loaded data.
     *
     * @param callback
     * @returns {Promise<void>}
     */
    Storage.prototype.loadTemplateData = async function (callback) {
        try {
            const res = await fetch('/api/todos');
            if (!res.ok) throw new Error('Failed to fetch todos');

            const data = await res.json();
            this.todos = data.map(mapServerTodo);

            this.nextKey = this.todos.length ? Math.max(...this.todos.map(t => t.key)) + 1 : 1;

            console.log("%c[To-Do] %cLoaded " + this.todos.length + " To-Dos from server.", "color: cyan; font-weight: bold;");

            if (callback) callback(this.todos);
        } catch (err) {
            console.error('Failed to load todos from server:', err);

            this.todos = [];
            this.nextKey = 1;

            if (callback) callback(this.todos);
        }
    }

    const storage = new Storage();

    return {
        create: function (title = "New To-Do", content = "", status = "todo", priority = "low", deadline) {
            return storage.create(title, content, status, priority, deadline);
        },
        edit: function (key, updates) {
            return storage.edit(key, updates);
        },
        get: function (key) {
            return storage.get(key);
        },
        getAll: function () {
            return storage.getAll();
        },
        delete: function (key) {
            return storage.delete(key);
        },
        loadTemplateData: function (callback) {
            return storage.loadTemplateData(callback);
        }

    }

})();