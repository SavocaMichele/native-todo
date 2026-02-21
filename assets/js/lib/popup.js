"use strict";

/**
 * __Popup Module__
 *
 * This module lets you create and manage popup windows in the application.
 *
 * @module popup
 * @author Michele Savoca
 */
window.popup = (function () {


    /**Creates a new Popup window with the given title and content
     *
     * @param {string} title - The title of the popup window
     * @param {string} content - The HTML content of the popup window
     */
    function Popup (title, content = "") {
        // Close any existing popups before creating a new one
        this.closeAll();

        this.title      = title;
        this.content    = content;

        this.overlay = document.createElement("div");
        this.overlay.classList.add("popup-overlay");
        this.overlay.title = "Close";
        this.overlay.addEventListener("click", () => this.close());

        this.element = document.createElement("div");
        this.element.classList.add("popup-window");

        if (this.title) {
            const titleElem   = document.createElement("h2");
            titleElem.innerText                 = this.title;
            this.element.appendChild(titleElem);
        }

        const contentElem = document.createElement("div");
        contentElem.classList.add("popup-content");
        contentElem.innerHTML = this.content;
        this.element.appendChild(contentElem);
    }


    /** Opens the popup window by appending it to the DOM */
    Popup.prototype.open = function () {
        document.body.appendChild(this.overlay);
        document.body.appendChild(this.element);
    }


    /** Closes the popup window and removes it from the DOM */
    Popup.prototype.close = function () {
        if (this.element && this.element.parentNode) {
            document.body.removeChild(this.element);
        }

        if (this.overlay && this.overlay.parentNode) {
            document.body.removeChild(this.overlay);
        }
    }


    /** Closes all open popup windows */
    Popup.prototype.closeAll = function () {
        const popups = document.querySelectorAll(".popup-window");
        popups.forEach(popup => {
            if (popup.parentNode) document.body.removeChild(popup);
        });

        const overlays = document.querySelectorAll(".popup-overlay");
        overlays.forEach(overlay => {
            if (overlay.parentNode) document.body.removeChild(overlay);
        });
    }


    /** Loads HTML content into the popup window from the given URL
     *
     * @param {string} url - The URL to load content from
     * @param {function} callback - Optional callback to execute after content is loaded
     */
    Popup.prototype.load = function (url, callback) {
        // fetch was not allowed in the making of this project
        jQuery.ajax({
            url: url,
            method: "GET",
            dataType: "html",
            success: (data) => {
                const contentElem   = this.element.querySelector(".popup-content");
                contentElem.innerHTML       = data;

                if (callback) callback();
            },
            error: (jqXHR, textStatus, errorThrown) => {
                console.error("Failed to load popup content:", textStatus, errorThrown);
            }
        });
    }


    return {
        /** Creates and shows a new popup window
         *
         * @param {string} title - The title of the popup window
         * @param {string} content - The HTML content of the popup window
         * @returns {Popup} The created Popup instance
         */
        create: function (title, content) {
            return new Popup(title, content);
        },


        /** Opens the given popup window by appending it to the DOM
         *
         * @param popup
         */
        open: function (popup) {
            popup.open();
        },


        /** Closes the given popup window
         *
         * @param popup
         */
        close: function (popup) {
            popup.close();
        }
    }

})();