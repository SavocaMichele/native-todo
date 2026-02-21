"use strict";

/**
 * __To-Do Module__
 *
 * This module provides a To-Do management system with
 * methods to create, edit, and retrieve To-Do items.
 * It uses localStorage for persistence and can load
 * initial data from a JSON file.
 *
 * @module todo
 * @author Michele Savoca
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
        this.createdAt  = new Date().toISOString().slice(0, 10);
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
    Storage.prototype.create = function (title, content, status = "todo", priority = "low", deadline) {
        const todo = new Todo({
            key:        this.nextKey++,
            title:      title.trim().length > 0 ? title.trim() : "New To-Do",
            content:    content,
            status:     status,
            priority:   priority,
            deadline:   deadline
        });

        this.todos.push(todo);
        this.save();

        return todo;
    }


    /**
     * Edits an existing To-Do by its key and updates the stored data
     *
     * @param key
     * @param updates
     * @returns {Todo}
     */
    Storage.prototype.edit = function (key, updates) {
        const todo = this.get(key);

        if (!todo) {
            throw new Error("To-Do not found with key: " + key);
        }

        Object.assign(todo, updates);
        this.save();

        return todo;
    }


    /**
     * Gets a To-Do by its key
     *
     * @param key
     * @returns {Todo}
     */
    Storage.prototype.get = function (key) {
        return this.todos.find(todo => todo.key === key);
    }


    /**
     * Gets all To-Dos
     *
     * @return {Todo[]}
     * */
    Storage.prototype.getAll = function () {
        return [...this.todos];
    }


    /** Saves the current To-Dos to localStorage */
    Storage.prototype.save = function () {
        if (!localStorage) {
            throw new Error("localStorage is not supported.");
        }

        localStorage.setItem("todos", JSON.stringify(this.todos));
    }


    /** Loads To-Dos from localStorage */
    Storage.prototype.load = function () {
        const data      = JSON.parse(localStorage.getItem("todos")) || [];

        this.todos      = data.map(item => new Todo(item));
        this.nextKey    = this.todos.length ? Math.max(...this.todos.map(t => t.key)) + 1 : 1;

        console.log("%c[To-Do] %cLoaded " + this.todos.length + " To-Dos from storage.", "color: cyan; font-weight: bold;");
    }


    /**
     * Deletes a To-Do by its key and updates the stored data
     *
     * @param key
     */
    Storage.prototype.delete = function (key) {
        const index = this.todos.findIndex(todo => todo.key === key);

        if (index === -1) {
            throw new Error("To-Do not found with key: " + key);
        }

        this.todos.splice(index, 1);
        this.save();
    }


    /**
     * Loads template data from a JSON file and initializes storage if no data is found.
     *
     * @param callback
     */
    Storage.prototype.loadTemplateData = function (callback) {
        // fetch was not allowed in the making of this project
        jQuery.ajax({
            url:        "/assets/data/todos.json",
            method:     "GET",
            dataType:   "json",
            success: (data) => {
                if (!localStorage.getItem("todos")) {
                    this.todos      = data.map(item => new Todo(item));
                    this.nextKey    = this.todos.length ? Math.max(...this.todos.map(t => t.key)) + 1 : 1;

                    this.save();
                }

                if (callback) callback(data);
            },
            error: (jqXHR, textStatus, errorThrown) => {
                console.error("Failed to load template data:", textStatus, errorThrown);
                if (callback) callback();
            }
        });
    }


    /** Initialize Storage and load existing To-Dos */
    const storage = new Storage();
    storage.load();


    return {

        /** Creates a new To-Do
         *
         * @param {string} title - The title of the To-Do
         * @param {string} content - The content/description of the To-Do
         * @param {"todo" | "in-progress" | "done" | "archived"} status
         * @param {"low" | "medium" | "high"} priority
         * @param {string} deadline - The deadline for the To-Do (in YYYY-MM-DD format)
         * @returns {Todo} The created To-Do
         */
        create: function (title = "New To-Do", content = "", status = "todo", priority = "low", deadline) {
            return storage.create(title, content, status, priority, deadline);
        },


        /** Edits an existing To-Do by its key
         *
         * @param {number} key - The key of the To-Do to edit
         * @param {Object} updates - An object containing the fields to update
         * @returns {Todo} The updated To-Do
         */
        edit: function (key, updates) {
            return storage.edit(key, updates);
        },


        /** Gets a To-Do by its key
         *
         * @param {number} key - The key of the To-Do
         * @returns {Todo} The To-Do with the given key
         */
        get: function (key) {
            return storage.get(key);
        },


        /** Gets all To-Dos
         *
         * @returns {Todo[]} An array of all To-Dos
         */
        getAll: function () {
            return storage.getAll();
        },


        /**
         * Deletes a To-Do by its key
         *
         * @param key
         */
        delete: function (key) {
            storage.delete(key);
        },


        /**
         * Loads template data from a JSON file and initializes storage if no data is found.
         *
         * @param callback
         */
        loadTemplateData: function (callback) {
            storage.loadTemplateData(callback);
        }

    }

})();