"use strict";

window.ui = window.ui || {};


/**
 * __Select Module__
 *
 * This module tracks all <select> elements in the application and provides
 * methods to create customizable select components.
 *
 * @module ui.select
 * @author Michele Savoca
 */
window.ui.Select = (function () {

    const instances             = new Set();
    let documentListenerBound    = false;

    function Select (element, config = {}) {
        this.original   = element;
        this.options    = []
        this.isOpen     = false;

        this.renderOption = config.renderOption || this.defaultRender;

        this.getOptions();
        this.build();
        this.bindEvents();

        instances.add(this);
    }


    /** Reads the options from the original <select> element and stores them in the `options` property. */
    Select.prototype.getOptions = function () {
        const options = this.original.querySelectorAll("option");

        this.options = Array.from(options).map(option => ({
            value:      option.value,
            label:      option.textContent,
            selected:   option.selected
        }));
    }


    /** Builds the custom select component and inserts it into the DOM. */
    Select.prototype.build = function () {
        const option = this.options.find(option => option.selected)?.label || this.options[0].label;

        this.original.style.display         = "none";

        this.container                      = document.createElement("div");
        this.container.className            = "custom-select " + this.original.name;
        this.container.dataset.customValue  = option;

        this.label                          = document.createElement("div");
        this.label.className                = "custom-select-label";
        this.label.textContent              = option

        this.labelWrapper                   = document.createElement("div");
        this.labelWrapper.className         = "custom-select-label-wrapper";

        this.dropdown                       = document.createElement("div");
        this.dropdown.className             = "custom-select-dropdown";
        
        this.options.forEach(option => {
            const optionElement = this.renderOption(option);
            
            this.dropdown.appendChild(optionElement)
        });

        this.labelWrapper.appendChild(this.label);
        this.container.appendChild(this.labelWrapper)
        this.container.appendChild(this.dropdown)

        this.original.parentNode.insertBefore(this.container, this.original.nextSibling);
    }


    /**
     * Default rendering function for the options in the custom select dropdown.
     *
     * @param option
     * @returns {HTMLDivElement}
     */
    Select.prototype.defaultRender = function (option) {
            const optionElement = document.createElement("div");
            optionElement.className            = "custom-select-option select-option";
            optionElement.textContent          = option.label;
            optionElement.dataset.value        = option.value;

            if (option.selected) {
                optionElement.classList.add("selected");
            }

            return optionElement;
    }


    /** Binds the event listeners to the custom select component. */
    Select.prototype.bindEvents = function () {
        this.label.addEventListener("click", (e) => {
            e.stopPropagation();
            this.toggle();
        })

        this.dropdown.addEventListener("click", (e) => {
            e.stopPropagation();

            const option = e.target.closest(".select-option");
            if (!option) return;

            this.select(option.dataset.value);
        })
    }


    /** Toggles the state of the custom select dropdown. */
    Select.prototype.toggle = function () {
        this.isOpen ? this.close() : this.open();
    };


    /** Opens the custom select dropdown. */
    Select.prototype.open = function () {
        this.container.classList.add("open");
        this.isOpen = true;
    };


    /** Closes the custom select dropdown. */
    Select.prototype.close = function () {
        if (!this.isOpen) return;

        this.container.classList.remove("open");
        this.isOpen = false;
    };


    /** Selects an option by its value. */
    Select.prototype.select = function (value) {
        const option = this.options.find(option => option.value === value);
        if (!option) return;

        this.options.forEach(option => option.selected = false);
        option.selected = true;

        const optionElement = this.dropdown.querySelector(`.select-option[data-value="${option.value}"]`);

        if (optionElement) {
            this.dropdown.querySelectorAll(".select-option").forEach(el => el.classList.remove("selected"));
            optionElement.classList.add("selected");
        }

        this.label.textContent              = option.label;
        this.container.dataset.customValue  = option.value;
        this.original.value                 = value;

        this.close();
    }


    /** Binds a click event to the document to close any custom select dropdowns when clicking outside of them. */
    function bindDocumentClick() {
        if (documentListenerBound) return;

        document.addEventListener("click", (e) => {
            instances.forEach(select => {
                if (!select.isOpen) return;
                if (select.container.contains(e.target)) return;
                if (e.target === select.original) return;

                select.close();
            });
        });

        documentListenerBound = true;
    }


    return {
        init: function (element, config) {
            if (element.dataset.customSelect) return;

            element.dataset.customSelect = "true";
            new Select(element, config);

            bindDocumentClick();
        },


        initAll: function () {
            let count = 0;
            document.querySelectorAll("select:not([data-custom-select]):not([data-ignore])")
                .forEach(select => {
                    select.dataset.customSelect = "true";

                    new Select(select);
                    count++;
                });

            bindDocumentClick();
            console.log(`%c[Select] %cInitialized ${count} custom select components.`, "color: cyan; font-weight: bold;");
        }
    };

})();