/**
 * SuperSexyDropdown
 * ------------------
 * A pure vanilla JavaScript dropdown/select library with inline styles only.
 *
 * The default theme mirrors the dropdowns in `reallocation.html`:
 * - white trigger with pale blue border
 * - sticky search area
 * - soft shadowed menu
 * - selected items with a pale blue gradient and Material Symbols checks
 *
 * The class is intentionally event-driven and deeply configurable. Every
 * default style lives in `SuperSexyDropdown.defaults.styles`, and every major
 * behavior can be replaced through `config.behavior` or extended through
 * `config.events` / `.on()`. Event aliases such as `onchange`, `onChange`,
 * `oncreated`, and `onCreated` are also supported.
 *
 * @example
 * const dropdown = new SuperSexyDropdown({
 *   placeholder: "Select office",
 *   multiple: true,
 *   options: [
 *     { value: "NYC", view: "NYC - United States", icon: "business" },
 *     { value: "SIN", view: "SIN - Singapore", icon: "business" }
 *   ],
 *   events: {
 *     change: ({ value }) => console.log(value)
 *   }
 * });
 *
 * dropdown.mount("#office-picker");
 * dropdown.getValue(); // ["NYC", "SIN"] for multi-select, "NYC" for single-select
 *
 * @example
 * // Icon inputs can be a Material Symbols name, an HTMLElement, an image config,
 * // HTML config, or rendered through config.icons.renderer.
 * new SuperSexyDropdown({
 *   options: [
 *     { value: "TRS", view: "TRS - Transport", icon: "local_shipping" },
 *     { value: "TES", view: "TES - Terminal", icon: { type: "material", name: "terminal" } },
 *     { value: "SAP", view: "SAP", icon: { type: "image", src: "/sap.png", alt: "SAP" } }
 *   ]
 * });
 *
 * @typedef {Object} SuperSexyDropdownOption
 * @property {*} value Value returned by `getValue()`.
 * @property {string} [label] Short display text.
 * @property {string} [view] Full display text. This wins over label by default.
 * @property {string|HTMLElement|Object|Function} [icon] Option icon input.
 * @property {boolean} [disabled] Whether the option cannot be selected.
 * @property {string} [searchText] Additional text used by search.
 * @property {Object} [styles] Per-option inline style overrides.
 * @property {Object} [meta] Consumer-owned metadata.
 *
 * @typedef {Object} SuperSexyDropdownConfig
 * @property {SuperSexyDropdownOption[]|Array<*>} [options] Dropdown options.
 * @property {*|Array<*>} [value] Initial value.
 * @property {boolean} [multiple=false] Enables multi-select.
 * @property {string} [placeholder="Select"] Placeholder when empty.
 * @property {boolean} [disabled=false] Disables the trigger and options.
 * @property {Object} [fields] Object field mapping for arbitrary input objects.
 * @property {Object} [search] Search configuration.
 * @property {Object} [sort] Sort configuration.
 * @property {Object} [icons] Icon configuration and renderers.
 * @property {Object} [summary] Selected-value summary configuration.
 * @property {Object} [styles] Deep inline style overrides.
 * @property {Object} [effects] Open/close/hover/focus behavior configuration.
 * @property {Object<string, Function|Function[]>} [events] Event handlers.
 * @property {Object<string, Function>} [behavior] Behavior overrides.
 */
(function attachSuperSexyDropdown(global) {
  "use strict";

  var VERSION = "1.0.0";

  function isPlainObject(value) {
    return Object.prototype.toString.call(value) === "[object Object]";
  }

  function isElement(value) {
    return value && value.nodeType === 1;
  }

  function cloneDeep(value) {
    if (Array.isArray(value)) {
      return value.map(cloneDeep);
    }
    if (isPlainObject(value)) {
      var output = {};
      Object.keys(value).forEach(function copyKey(key) {
        output[key] = cloneDeep(value[key]);
      });
      return output;
    }
    return value;
  }

  function deepMerge(target) {
    var output = isPlainObject(target) ? cloneDeep(target) : {};

    for (var i = 1; i < arguments.length; i += 1) {
      var source = arguments[i];
      if (!isPlainObject(source)) continue;

      Object.keys(source).forEach(function mergeKey(key) {
        var sourceValue = source[key];
        var targetValue = output[key];

        if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
          output[key] = deepMerge(targetValue, sourceValue);
          return;
        }

        output[key] = cloneDeep(sourceValue);
      });
    }

    return output;
  }

  function applyStyles(element, styles) {
    if (!element || !styles) return element;
    Object.keys(styles).forEach(function applyStyle(prop) {
      if (styles[prop] === null || typeof styles[prop] === "undefined") return;
      element.style[prop] = String(styles[prop]);
    });
    return element;
  }

  function applyAttributes(element, attributes) {
    if (!element || !attributes) return element;
    Object.keys(attributes).forEach(function applyAttribute(name) {
      var value = attributes[name];
      if (value === false || value === null || typeof value === "undefined") {
        element.removeAttribute(name);
        return;
      }
      if (value === true) {
        element.setAttribute(name, "");
        return;
      }
      element.setAttribute(name, String(value));
    });
    return element;
  }

  function removeChildren(element) {
    if (!element) return;
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function resolveElement(target) {
    if (isElement(target)) return target;
    if (typeof target === "string") return document.querySelector(target);
    return null;
  }

  function toArray(value) {
    if (Array.isArray(value)) return value.slice();
    if (value === null || typeof value === "undefined") return [];
    return [value];
  }

  function upperFirst(value) {
    var text = String(value || "");
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function getByPath(source, path) {
    if (!source || !path) return undefined;
    if (Object.prototype.hasOwnProperty.call(source, path)) return source[path];

    var parts = String(path).split(".");
    var cursor = source;
    for (var i = 0; i < parts.length; i += 1) {
      if (cursor === null || typeof cursor === "undefined") return undefined;
      cursor = cursor[parts[i]];
    }
    return cursor;
  }

  function makeMaterialSymbolStyles(size, color, weight) {
    return {
      fontFamily: '"Material Symbols Outlined"',
      fontWeight: "normal",
      fontStyle: "normal",
      fontSize: size || "18px",
      lineHeight: "1",
      letterSpacing: "normal",
      textTransform: "none",
      display: "inline-block",
      whiteSpace: "nowrap",
      wordWrap: "normal",
      direction: "ltr",
      WebkitFontFeatureSettings: '"liga"',
      WebkitFontSmoothing: "antialiased",
      fontVariationSettings: '"FILL" 0, "wght" ' + (weight || "400") + ', "GRAD" 0, "opsz" 24',
      color: color || "#64748b",
      flex: "0 0 auto"
    };
  }

  var DEFAULT_CONFIG = {
    id: "",
    name: "",
    options: [],
    value: null,
    multiple: false,
    disabled: false,
    placeholder: "Select",
    noMatchesText: "No matches",
    closeOnSelect: null,
    clearSearchOnClose: false,
    clearSearchOnSelect: false,
    dataAttributes: true,
    labelAsHtml: false,
    trackBy: null,

    fields: {
      key: "key",
      value: "value",
      label: "label",
      view: "view",
      icon: "icon",
      disabled: "disabled",
      searchText: "searchText",
      styles: "styles",
      meta: "meta"
    },

    search: {
      enabled: true,
      placeholder: "Type to search...",
      autofocus: true,
      caseSensitive: false,
      trim: true,
      debounce: 0,
      keys: ["view", "label", "value", "searchText"],
      matcher: null
    },

    sort: {
      mode: "selectedFirst",
      direction: "asc",
      compare: null
    },

    icons: {
      enabled: true,
      className: "material-symbols-outlined",
      library: "material-symbols",
      caret: "expand_more",
      defaultOption: "",
      selected: "done",
      unselected: "check_box_outline_blank",
      singleSelected: "radio_button_checked",
      singleUnselected: "radio_button_unchecked",
      trigger: "",
      renderer: null,
      checkRenderer: null,
      caretRenderer: null
    },

    summary: {
      maxLabels: 2,
      separator: ", ",
      overflowPrefix: " +",
      useView: true,
      renderer: null,
      placeholderRenderer: null
    },

    effects: {
      hover: true,
      focus: true,
      openAnimation: false,
      closeAnimation: false,
      animationDuration: 120,
      animationEasing: "ease",
      closeOnOutsideClick: true,
      closeOnEscape: true,
      keyboard: true,
      rotateCaret: false
    },

    attributes: {
      root: {},
      button: {},
      menu: {},
      searchInput: {},
      option: {}
    },

    styles: {
      root: {
        position: "relative",
        width: "100%",
        boxSizing: "border-box",
        fontFamily: '"Helvetica Neue", "Segoe UI", Arial, sans-serif'
      },
      rootDisabled: {
        opacity: "0.65",
        pointerEvents: "none"
      },
      button: {
        width: "100%",
        minHeight: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
        padding: "8px 10px",
        border: "1px solid #c9d9e8",
        borderRadius: "11px",
        background: "#ffffff",
        fontSize: "14px",
        color: "#20384f",
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05)",
        outline: "none",
        cursor: "pointer",
        boxSizing: "border-box",
        textAlign: "left",
        transition: "border-color 120ms ease, box-shadow 120ms ease, background-color 120ms ease"
      },
      buttonHover: {
        background: "#ffffff",
        borderColor: "#b8cfe3"
      },
      buttonOpen: {
        borderColor: "#a9c4db",
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05), 0 0 0 3px rgba(29, 78, 216, 0.08)"
      },
      buttonFocus: {
        borderColor: "#9bb9d4",
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05), 0 0 0 3px rgba(29, 78, 216, 0.10)"
      },
      triggerContent: {
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        minWidth: "0",
        overflow: "hidden",
        flex: "1 1 auto"
      },
      triggerText: {
        display: "block",
        minWidth: "0",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        fontSize: "14px",
        lineHeight: "20px"
      },
      triggerSelectedText: {
        color: "#20384f",
        fontWeight: "500",
        fontStyle: "normal",
        textTransform: "none",
        letterSpacing: "0"
      },
      triggerPlaceholderText: {
        color: "#6b7f92",
        fontWeight: "500",
        fontStyle: "normal",
        textTransform: "none",
        letterSpacing: "0"
      },
      triggerIcon: makeMaterialSymbolStyles("16px", "#64748b", "400"),
      caret: makeMaterialSymbolStyles("18px", "#64748b", "400"),
      caretOpen: {
        transform: "rotate(180deg)"
      },
      menu: {
        position: "absolute",
        left: "0",
        right: "0",
        zIndex: "35000",
        marginTop: "6px",
        border: "1px solid #cfe0ef",
        borderRadius: "11px",
        background: "#ffffff",
        boxShadow: "0 10px 24px rgba(15, 40, 70, 0.12)",
        maxHeight: "220px",
        overflowY: "auto",
        overflowX: "hidden",
        display: "none",
        boxSizing: "border-box"
      },
      menuOpen: {
        display: "block"
      },
      searchWrap: {
        position: "sticky",
        top: "0",
        zIndex: "1",
        background: "#ffffff",
        borderBottom: "1px solid #edf3f8",
        padding: "8px",
        boxSizing: "border-box"
      },
      searchInput: {
        width: "100%",
        height: "32px",
        border: "1px solid #c9d9e8",
        borderRadius: "8px",
        padding: "0 10px",
        fontSize: "13px",
        color: "#1f3a53",
        outline: "none",
        boxSizing: "border-box",
        fontFamily: "inherit",
        background: "#ffffff"
      },
      searchInputFocus: {
        borderColor: "#a9c4db",
        boxShadow: "0 0 0 3px rgba(29, 78, 216, 0.08)"
      },
      list: {
        display: "block"
      },
      option: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
        padding: "9px 10px",
        fontSize: "14px",
        color: "#1f3a53",
        cursor: "pointer",
        border: "0",
        borderBottom: "1px solid #edf3f8",
        transition: "background-color 120ms ease, color 120ms ease, font-weight 120ms ease",
        background: "#ffffff",
        boxSizing: "border-box",
        textAlign: "left",
        fontFamily: "inherit",
        outline: "none"
      },
      optionLast: {
        borderBottom: "0"
      },
      optionHover: {
        background: "#f4f9ff"
      },
      optionHighlighted: {
        background: "#eef6ff"
      },
      optionSelected: {
        background: "linear-gradient(90deg, #eff6ff 0%, #f8fbff 100%)",
        color: "#0f3fb8",
        fontWeight: "800"
      },
      optionUnselected: {
        background: "#ffffff",
        color: "#1f3a53",
        fontWeight: "500"
      },
      optionDisabled: {
        opacity: "0.45",
        cursor: "not-allowed"
      },
      optionContent: {
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        minWidth: "0",
        overflow: "hidden",
        flex: "1 1 auto"
      },
      optionIcon: makeMaterialSymbolStyles("16px", "#64748b", "400"),
      optionText: {
        display: "block",
        minWidth: "0",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        fontSize: "14px",
        lineHeight: "20px",
        letterSpacing: "0"
      },
      optionTextSelected: {
        color: "#0f3fb8",
        fontWeight: "800",
        fontStyle: "normal",
        textTransform: "none"
      },
      optionTextUnselected: {
        color: "#1f3a53",
        fontWeight: "500",
        fontStyle: "normal",
        textTransform: "none"
      },
      checkIcon: makeMaterialSymbolStyles("18px", "#cbd5e1", "400"),
      checkIconSelected: {
        color: "#0f3fb8",
        fontVariationSettings: '"FILL" 0, "wght" 700, "GRAD" 0, "opsz" 24'
      },
      checkIconUnselected: {
        color: "#cbd5e1",
        fontVariationSettings: '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24'
      },
      empty: {
        padding: "10px",
        fontSize: "12px",
        color: "#6b7f92",
        textAlign: "center",
        boxSizing: "border-box"
      }
    },

    behavior: {
      normalizeOption: null,
      renderTrigger: null,
      renderSummary: null,
      renderIcon: null,
      renderCheckIcon: null,
      renderOption: null,
      renderOptionContent: null,
      applyOptionState: null,
      filterOptions: null,
      sortOptions: null,
      toggleOption: null,
      select: null,
      unselect: null,
      setValue: null,
      clear: null,
      open: null,
      close: null
    },

    events: {
      created: null,
      mounted: null,
      beforeOpen: null,
      open: null,
      beforeClose: null,
      close: null,
      beforeSearch: null,
      search: null,
      beforeSelect: null,
      select: null,
      beforeUnselect: null,
      unselect: null,
      beforeChange: null,
      change: null,
      beforeClear: null,
      clear: null,
      beforeRender: null,
      render: null,
      beforeRenderOption: null,
      renderOption: null,
      beforeApplyOptionState: null,
      applyOptionState: null,
      destroy: null
    }
  };

  /**
   * Vanilla, inline-styled dropdown/select control.
   */
  class SuperSexyDropdown {
    /**
     * @param {SuperSexyDropdownConfig} [config]
     */
    constructor(config) {
      this.config = deepMerge(DEFAULT_CONFIG, config || {});
      this.id = this.config.id || "ssd-" + Math.random().toString(36).slice(2, 10);
      this.root = null;
      this.button = null;
      this.triggerContent = null;
      this.triggerText = null;
      this.caret = null;
      this.menu = null;
      this.searchWrap = null;
      this.searchInput = null;
      this.list = null;
      this.empty = null;
      this.mountTarget = null;
      this.isOpen = false;
      this.isFocused = false;
      this.isButtonHovered = false;
      this.searchTerm = "";
      this.highlightedKey = null;
      this.selectedKeys = new Set();
      this.listeners = {};
      this.optionByKey = new Map();
      this.normalizedOptions = [];
      this.optionElements = new Map();
      this._closeTimer = null;
      this._searchTimer = null;

      this._boundDocumentClick = this._handleDocumentClick.bind(this);
      this._boundButtonClick = this._handleButtonClick.bind(this);
      this._boundButtonKeydown = this._handleButtonKeydown.bind(this);
      this._boundSearchInput = this._handleSearchInput.bind(this);
      this._boundSearchKeydown = this._handleSearchKeydown.bind(this);
      this._boundFocus = this._handleFocus.bind(this);
      this._boundBlur = this._handleBlur.bind(this);
      this._boundMouseEnterButton = this._handleButtonMouseEnter.bind(this);
      this._boundMouseLeaveButton = this._handleButtonMouseLeave.bind(this);

      this.setOptions(this.config.options, { render: false, emit: false, preserveValue: false });
      this.setValue(this.config.value, { render: false, emit: false });
      this._build();
      this._renderAll();
      this._emit("created", { value: this.getValue() });
    }

    /**
     * Create a dropdown from an existing `<select>` element.
     *
     * @param {HTMLSelectElement|string} select Native select or selector.
     * @param {SuperSexyDropdownConfig} [config]
     * @returns {SuperSexyDropdown}
     */
    static fromSelect(select, config) {
      var selectEl = resolveElement(select);
      if (!selectEl) {
        throw new Error("SuperSexyDropdown.fromSelect could not find the select element.");
      }

      var options = Array.prototype.slice.call(selectEl.options).map(function mapOption(option) {
        return {
          value: option.value,
          view: option.text,
          label: option.text,
          disabled: option.disabled
        };
      });

      var initialValue = selectEl.multiple
        ? Array.prototype.slice.call(selectEl.selectedOptions).map(function selectedOption(option) { return option.value; })
        : selectEl.value;

      var instance = new SuperSexyDropdown(deepMerge({
        options: options,
        value: initialValue,
        multiple: selectEl.multiple,
        name: selectEl.name,
        events: {
          change: function syncSelect(detail) {
            var values = toArray(detail.value).map(String);
            Array.prototype.slice.call(selectEl.options).forEach(function syncOption(option) {
              option.selected = values.indexOf(String(option.value)) > -1;
            });
            selectEl.dispatchEvent(new Event("change", { bubbles: true }));
          }
        }
      }, config || {}));

      selectEl.style.display = "none";
      instance.mount(selectEl, { position: "after" });
      return instance;
    }

    /**
     * Deep merge helper exposed for consumers composing configs.
     *
     * @returns {Object}
     */
    static mergeConfig() {
      var args = [DEFAULT_CONFIG];
      for (var i = 0; i < arguments.length; i += 1) args.push(arguments[i]);
      return deepMerge.apply(null, args);
    }

    /**
     * Mount the dropdown.
     *
     * @param {HTMLElement|string} target Element or selector.
     * @param {Object} [options]
     * @param {"append"|"prepend"|"replace"|"before"|"after"} [options.position="append"]
     * @returns {SuperSexyDropdown}
     */
    mount(target, options) {
      var targetEl = resolveElement(target);
      var mountOptions = options || {};
      var position = mountOptions.position || "append";

      if (!targetEl) {
        throw new Error("SuperSexyDropdown.mount could not find the target element.");
      }

      if (!this.root) {
        this._build();
      }

      if (this.root.parentNode) {
        this.root.parentNode.removeChild(this.root);
      }

      if (position === "replace") {
        removeChildren(targetEl);
        targetEl.appendChild(this.root);
      } else if (position === "prepend") {
        targetEl.insertBefore(this.root, targetEl.firstChild);
      } else if (position === "before") {
        targetEl.parentNode.insertBefore(this.root, targetEl);
      } else if (position === "after") {
        targetEl.parentNode.insertBefore(this.root, targetEl.nextSibling);
      } else {
        targetEl.appendChild(this.root);
      }

      this.mountTarget = targetEl;
      this._syncDisabled();
      this._renderAll();
      this._emit("mounted", { target: targetEl, value: this.getValue() });
      return this;
    }

    /**
     * Remove the dropdown from the DOM without destroying state.
     *
     * @returns {SuperSexyDropdown}
     */
    unmount() {
      this.close({ emit: false });
      if (this.root && this.root.parentNode) {
        this.root.parentNode.removeChild(this.root);
      }
      this.mountTarget = null;
      return this;
    }

    /**
     * Destroy the dropdown and detach all DOM references.
     */
    destroy() {
      this.close({ emit: false });
      this._emit("destroy", {});
      document.removeEventListener("click", this._boundDocumentClick, true);
      this.unmount();
      this.listeners = {};
      this.optionByKey.clear();
      this.optionElements.clear();
      this.root = null;
      this.button = null;
      this.menu = null;
    }

    /**
     * Subscribe to a dropdown event.
     *
     * Returning `false` from a `before*` event cancels the default behavior.
     *
     * @param {string} eventName Event name.
     * @param {Function} handler Handler called with `(detail, instance)`.
     * @returns {SuperSexyDropdown}
     */
    on(eventName, handler) {
      if (!this.listeners[eventName]) this.listeners[eventName] = [];
      this.listeners[eventName].push(handler);
      return this;
    }

    /**
     * Unsubscribe from a dropdown event.
     *
     * @param {string} eventName Event name.
     * @param {Function} handler Handler originally passed to `.on()`.
     * @returns {SuperSexyDropdown}
     */
    off(eventName, handler) {
      if (!this.listeners[eventName]) return this;
      this.listeners[eventName] = this.listeners[eventName].filter(function keep(candidate) {
        return candidate !== handler;
      });
      return this;
    }

    /**
     * Open the menu.
     *
     * @param {Object} [options]
     * @param {boolean} [options.emit=true]
     * @returns {SuperSexyDropdown}
     */
    open(options) {
      var opts = options || {};
      if (this.isOpen || this.config.disabled) return this;

      if (opts.emit !== false && !this._emit("beforeOpen", { value: this.getValue() })) {
        return this;
      }

      if (typeof this.config.behavior.open === "function") {
        this.config.behavior.open.call(this, { instance: this, runDefault: this._defaultOpen.bind(this) });
      } else {
        this._defaultOpen();
      }

      if (opts.emit !== false) this._emit("open", { value: this.getValue() });
      return this;
    }

    /**
     * Close the menu.
     *
     * @param {Object} [options]
     * @param {boolean} [options.emit=true]
     * @returns {SuperSexyDropdown}
     */
    close(options) {
      var opts = options || {};
      if (!this.isOpen) return this;

      if (opts.emit !== false && !this._emit("beforeClose", { value: this.getValue() })) {
        return this;
      }

      if (typeof this.config.behavior.close === "function") {
        this.config.behavior.close.call(this, { instance: this, runDefault: this._defaultClose.bind(this) });
      } else {
        this._defaultClose();
      }

      if (this.config.clearSearchOnClose) this.search("", { emit: false });
      if (opts.emit !== false) this._emit("close", { value: this.getValue() });
      return this;
    }

    /**
     * Toggle the menu.
     *
     * @returns {SuperSexyDropdown}
     */
    toggle() {
      return this.isOpen ? this.close() : this.open();
    }

    /**
     * Read the current value.
     *
     * @returns {*|Array<*>|null}
     */
    getValue() {
      var values = this.getSelectedOptions().map(function toValue(option) {
        return option.value;
      });
      return this.config.multiple ? values : (values.length ? values[0] : null);
    }

    /**
     * Read selected normalized option objects.
     *
     * @returns {Array<Object>}
     */
    getSelectedOptions() {
      var selected = [];
      var self = this;
      this.normalizedOptions.forEach(function collect(option) {
        if (self.selectedKeys.has(option.key)) selected.push(option);
      });
      return selected;
    }

    /**
     * Set the current value. Pass an array for multi-select.
     *
     * @param {*|Array<*>} value New value.
     * @param {Object} [options]
     * @param {boolean} [options.emit=true]
     * @param {boolean} [options.render=true]
     * @returns {SuperSexyDropdown}
     */
    setValue(value, options) {
      var opts = options || {};
      var previousValue = this.getValue();

      if (typeof this.config.behavior.setValue === "function") {
        this.config.behavior.setValue.call(this, {
          value: value,
          previousValue: previousValue,
          instance: this,
          runDefault: this._defaultSetValue.bind(this)
        });
      } else {
        this._defaultSetValue(value);
      }

      if (opts.render !== false) this._renderAll();
      if (opts.emit !== false) this._emitChange(previousValue);
      return this;
    }

    /**
     * Select one option by value.
     *
     * @param {*} value Option value.
     * @param {Object} [options]
     * @returns {SuperSexyDropdown}
     */
    select(value, options) {
      var option = this._findOptionByValue(value);
      if (!option || option.disabled || this.config.disabled) return this;
      return this._selectOption(option, options || {});
    }

    /**
     * Unselect one option by value.
     *
     * @param {*} value Option value.
     * @param {Object} [options]
     * @returns {SuperSexyDropdown}
     */
    unselect(value, options) {
      var option = this._findOptionByValue(value);
      if (!option || this.config.disabled) return this;
      return this._unselectOption(option, options || {});
    }

    /**
     * Toggle one option by value.
     *
     * @param {*} value Option value.
     * @param {Object} [options]
     * @returns {SuperSexyDropdown}
     */
    toggleValue(value, options) {
      var option = this._findOptionByValue(value);
      if (!option || option.disabled || this.config.disabled) return this;

      if (typeof this.config.behavior.toggleOption === "function") {
        this.config.behavior.toggleOption.call(this, {
          option: option,
          value: option.value,
          selected: this.selectedKeys.has(option.key),
          instance: this,
          runDefault: this._defaultToggleOption.bind(this, option, options || {})
        });
        return this;
      }

      return this._defaultToggleOption(option, options || {});
    }

    /**
     * Clear all selected values.
     *
     * @param {Object} [options]
     * @param {boolean} [options.emit=true]
     * @returns {SuperSexyDropdown}
     */
    clear(options) {
      var opts = options || {};
      var previousValue = this.getValue();

      if (opts.emit !== false && !this._emit("beforeClear", { previousValue: previousValue })) {
        return this;
      }

      if (typeof this.config.behavior.clear === "function") {
        this.config.behavior.clear.call(this, {
          previousValue: previousValue,
          instance: this,
          runDefault: this._defaultClear.bind(this)
        });
      } else {
        this._defaultClear();
      }

      this._renderAll();
      if (opts.emit !== false) {
        this._emit("clear", { previousValue: previousValue, value: this.getValue() });
        this._emitChange(previousValue);
      }
      return this;
    }

    /**
     * Replace the option list.
     *
     * @param {Array<*>} options New options.
     * @param {Object} [optionsArg]
     * @param {boolean} [optionsArg.render=true]
     * @param {boolean} [optionsArg.emit=false]
     * @param {boolean} [optionsArg.preserveValue=true]
     * @returns {SuperSexyDropdown}
     */
    setOptions(options, optionsArg) {
      var opts = optionsArg || {};
      var previousValue = this.getValue ? this.getValue() : null;
      var rawOptions = Array.isArray(options) ? options : [];
      var self = this;

      this.optionByKey = new Map();
      this.normalizedOptions = rawOptions.map(function normalize(input, index) {
        var normalized = self._normalizeOption(input, index);
        self.optionByKey.set(normalized.key, normalized);
        return normalized;
      });

      if (opts.preserveValue !== false && typeof this.selectedKeys !== "undefined") {
        var nextKeys = new Set();
        this.selectedKeys.forEach(function keepKey(key) {
          if (self.optionByKey.has(key)) nextKeys.add(key);
        });
        this.selectedKeys = nextKeys;
      } else if (typeof this.selectedKeys !== "undefined") {
        this.selectedKeys.clear();
      }

      if (opts.render !== false) this._renderAll();
      if (opts.emit) this._emitChange(previousValue);
      return this;
    }

    /**
     * Add one option.
     *
     * @param {*} option Option input.
     * @returns {SuperSexyDropdown}
     */
    addOption(option) {
      var raw = this.normalizedOptions.map(function toRaw(existing) { return existing.raw; });
      raw.push(option);
      return this.setOptions(raw, { preserveValue: true, render: true, emit: false });
    }

    /**
     * Remove one option by value.
     *
     * @param {*} value Option value.
     * @returns {SuperSexyDropdown}
     */
    removeOption(value) {
      var key = this._keyForValue(value);
      var raw = this.normalizedOptions
        .filter(function keep(option) { return option.key !== key; })
        .map(function toRaw(option) { return option.raw; });
      return this.setOptions(raw, { preserveValue: true, render: true, emit: true });
    }

    /**
     * Search options.
     *
     * @param {string} term Search term.
     * @param {Object} [options]
     * @param {boolean} [options.emit=true]
     * @returns {SuperSexyDropdown}
     */
    search(term, options) {
      var opts = options || {};
      var nextTerm = String(term || "");
      var previousTerm = this.searchTerm;

      if (opts.emit !== false && !this._emit("beforeSearch", { term: nextTerm, previousTerm: previousTerm })) {
        return this;
      }

      this.searchTerm = nextTerm;
      if (opts.emit !== false) this._emit("search", { term: nextTerm, previousTerm: previousTerm });
      this._renderOptions();
      return this;
    }

    /**
     * Refresh trigger and option UI.
     *
     * @returns {SuperSexyDropdown}
     */
    refresh() {
      this._renderAll();
      return this;
    }

    /**
     * Disable the dropdown.
     *
     * @returns {SuperSexyDropdown}
     */
    disable() {
      this.config.disabled = true;
      this.close({ emit: false });
      this._syncDisabled();
      return this;
    }

    /**
     * Enable the dropdown.
     *
     * @returns {SuperSexyDropdown}
     */
    enable() {
      this.config.disabled = false;
      this._syncDisabled();
      return this;
    }

    /**
     * Focus the trigger button.
     *
     * @returns {SuperSexyDropdown}
     */
    focus() {
      if (this.button) this.button.focus();
      return this;
    }

    _build() {
      this.root = document.createElement("div");
      this.root.id = this.id;
      this.root.setAttribute("data-super-sexy-dropdown", "true");
      this.root.setAttribute("data-ssd-name", this.config.name || this.id);
      applyStyles(this.root, this.config.styles.root);
      applyAttributes(this.root, this.config.attributes.root);

      this.button = document.createElement("button");
      this.button.type = "button";
      this.button.setAttribute("aria-haspopup", "listbox");
      this.button.setAttribute("aria-expanded", "false");
      this.button.setAttribute("data-ssd-part", "button");
      applyStyles(this.button, this.config.styles.button);
      applyAttributes(this.button, this.config.attributes.button);

      this.triggerContent = document.createElement("span");
      this.triggerContent.setAttribute("data-ssd-part", "trigger-content");
      applyStyles(this.triggerContent, this.config.styles.triggerContent);

      this.triggerText = document.createElement("span");
      this.triggerText.setAttribute("data-ssd-part", "trigger-text");
      applyStyles(this.triggerText, this.config.styles.triggerText);
      this.triggerContent.appendChild(this.triggerText);

      this.caret = this._renderCaret();
      this.button.appendChild(this.triggerContent);
      if (this.caret) this.button.appendChild(this.caret);

      this.menu = document.createElement("div");
      this.menu.setAttribute("role", "listbox");
      this.menu.setAttribute("aria-multiselectable", this.config.multiple ? "true" : "false");
      this.menu.setAttribute("data-ssd-part", "menu");
      applyStyles(this.menu, this.config.styles.menu);
      applyAttributes(this.menu, this.config.attributes.menu);

      if (this.config.search.enabled) {
        this.searchWrap = document.createElement("div");
        this.searchWrap.setAttribute("data-ssd-part", "search-wrap");
        applyStyles(this.searchWrap, this.config.styles.searchWrap);

        this.searchInput = document.createElement("input");
        this.searchInput.type = "text";
        this.searchInput.placeholder = this.config.search.placeholder;
        this.searchInput.setAttribute("data-ssd-part", "search-input");
        applyStyles(this.searchInput, this.config.styles.searchInput);
        applyAttributes(this.searchInput, this.config.attributes.searchInput);

        this.searchWrap.appendChild(this.searchInput);
        this.menu.appendChild(this.searchWrap);
      }

      this.list = document.createElement("div");
      this.list.setAttribute("data-ssd-part", "list");
      applyStyles(this.list, this.config.styles.list);
      this.menu.appendChild(this.list);

      this.empty = document.createElement("div");
      this.empty.setAttribute("data-ssd-part", "empty");
      this.empty.textContent = this.config.noMatchesText;
      applyStyles(this.empty, this.config.styles.empty);
      this.menu.appendChild(this.empty);

      this.root.appendChild(this.button);
      this.root.appendChild(this.menu);
      this._bindDomEvents();
    }

    _bindDomEvents() {
      this.button.addEventListener("click", this._boundButtonClick);
      this.button.addEventListener("keydown", this._boundButtonKeydown);
      this.button.addEventListener("focus", this._boundFocus);
      this.button.addEventListener("blur", this._boundBlur);
      this.button.addEventListener("mouseenter", this._boundMouseEnterButton);
      this.button.addEventListener("mouseleave", this._boundMouseLeaveButton);

      if (this.searchInput) {
        this.searchInput.addEventListener("input", this._boundSearchInput);
        this.searchInput.addEventListener("keydown", this._boundSearchKeydown);
        this.searchInput.addEventListener("focus", this._handleSearchFocus.bind(this));
        this.searchInput.addEventListener("blur", this._handleSearchBlur.bind(this));
      }
    }

    _renderAll() {
      if (!this.root) return;
      if (!this._emit("beforeRender", { value: this.getValue() })) return;
      this._renderTrigger();
      this._renderOptions();
      this._syncDisabled();
      this._emit("render", { value: this.getValue() });
    }

    _renderTrigger() {
      if (!this.triggerContent || !this.triggerText) return;

      if (typeof this.config.behavior.renderTrigger === "function") {
        var customTrigger = this.config.behavior.renderTrigger.call(this, {
          selectedOptions: this.getSelectedOptions(),
          value: this.getValue(),
          instance: this,
          runDefault: this._defaultRenderTrigger.bind(this)
        });
        if (customTrigger !== undefined) return;
      }

      this._defaultRenderTrigger();
    }

    _defaultRenderTrigger() {
      var selected = this.getSelectedOptions();
      var hasValue = selected.length > 0;
      var summary = this._renderSummary(selected);

      removeChildren(this.triggerContent);

      var triggerIcon = this.config.icons.enabled && this.config.icons.trigger
        ? this._renderIcon(this.config.icons.trigger, { part: "trigger", selected: hasValue })
        : null;

      if (triggerIcon) {
        applyStyles(triggerIcon, this.config.styles.triggerIcon);
        this.triggerContent.appendChild(triggerIcon);
      }

      this.triggerText = document.createElement("span");
      this.triggerText.setAttribute("data-ssd-part", "trigger-text");
      this.triggerText.textContent = summary;
      applyStyles(this.triggerText, this.config.styles.triggerText);
      applyStyles(this.triggerText, hasValue ? this.config.styles.triggerSelectedText : this.config.styles.triggerPlaceholderText);
      this.triggerContent.appendChild(this.triggerText);
    }

    _renderSummary(selectedOptions) {
      if (!selectedOptions.length) {
        if (typeof this.config.summary.placeholderRenderer === "function") {
          return this.config.summary.placeholderRenderer.call(this, {
            placeholder: this.config.placeholder,
            instance: this
          });
        }
        return this.config.placeholder;
      }

      if (typeof this.config.behavior.renderSummary === "function") {
        return this.config.behavior.renderSummary.call(this, {
          selectedOptions: selectedOptions,
          value: this.getValue(),
          instance: this,
          runDefault: this._defaultSummary.bind(this, selectedOptions)
        });
      }

      if (typeof this.config.summary.renderer === "function") {
        return this.config.summary.renderer.call(this, {
          selectedOptions: selectedOptions,
          value: this.getValue(),
          instance: this
        });
      }

      return this._defaultSummary(selectedOptions);
    }

    _defaultSummary(selectedOptions) {
      if (!this.config.multiple && selectedOptions[0]) {
        return selectedOptions[0].view;
      }

      var maxLabels = Math.max(1, Number(this.config.summary.maxLabels) || 1);
      var labels = selectedOptions.map(function mapLabel(option) {
        return option.view;
      });
      if (labels.length <= maxLabels) return labels.join(this.config.summary.separator);

      return labels.slice(0, maxLabels).join(this.config.summary.separator) +
        this.config.summary.overflowPrefix +
        (labels.length - maxLabels);
    }

    _renderOptions() {
      if (!this.list || !this.empty) return;

      removeChildren(this.list);
      this.optionElements.clear();

      var options = this._getVisibleOptions();
      this.empty.style.display = options.length ? "none" : "block";

      for (var i = 0; i < options.length; i += 1) {
        var option = options[i];
        var optionEl = this._renderOption(option, i, options.length);
        if (!optionEl) continue;
        this.optionElements.set(option.key, optionEl);
        this.list.appendChild(optionEl);
      }
    }

    _renderOption(option, index, total) {
      var detail = { option: option, index: index, total: total, selected: this.selectedKeys.has(option.key) };
      if (!this._emit("beforeRenderOption", detail)) {
        return null;
      }

      var element;
      if (typeof this.config.behavior.renderOption === "function") {
        element = this.config.behavior.renderOption.call(this, {
          option: option,
          index: index,
          total: total,
          selected: this.selectedKeys.has(option.key),
          instance: this,
          runDefault: this._defaultRenderOption.bind(this, option, index, total)
        });
      }

      if (!isElement(element)) {
        element = this._defaultRenderOption(option, index, total);
      }

      element.setAttribute("data-ssd-option-key", option.key);
      element.setAttribute("role", "option");
      element.setAttribute("aria-selected", this.selectedKeys.has(option.key) ? "true" : "false");
      if (option.disabled) element.setAttribute("aria-disabled", "true");
      applyAttributes(element, this.config.attributes.option);

      element.addEventListener("click", this._handleOptionClick.bind(this, option));
      element.addEventListener("mouseenter", this._handleOptionMouseEnter.bind(this, option));
      element.addEventListener("mouseleave", this._handleOptionMouseLeave.bind(this, option));

      this._applyOptionState(element, option, index, total);
      this._emit("renderOption", { option: option, element: element, index: index, total: total });
      return element;
    }

    _defaultRenderOption(option, index, total) {
      var button = document.createElement("button");
      button.type = "button";
      button.setAttribute("data-ssd-part", "option");

      var content;
      if (typeof this.config.behavior.renderOptionContent === "function") {
        content = this.config.behavior.renderOptionContent.call(this, {
          option: option,
          selected: this.selectedKeys.has(option.key),
          index: index,
          total: total,
          instance: this,
          runDefault: this._defaultRenderOptionContent.bind(this, option)
        });
      }

      if (!isElement(content)) {
        content = this._defaultRenderOptionContent(option);
      }

      var check = this._renderCheckIcon(option);
      button.appendChild(content);
      if (check) button.appendChild(check);
      return button;
    }

    _defaultRenderOptionContent(option) {
      var content = document.createElement("span");
      content.setAttribute("data-ssd-part", "option-content");
      applyStyles(content, this.config.styles.optionContent);

      var iconValue = option.icon || this.config.icons.defaultOption;
      var icon = this.config.icons.enabled && iconValue
        ? this._renderIcon(iconValue, { part: "option", option: option, selected: this.selectedKeys.has(option.key) })
        : null;

      if (icon) {
        applyStyles(icon, this.config.styles.optionIcon);
        content.appendChild(icon);
      }

      var text = document.createElement("span");
      text.setAttribute("data-ssd-part", "option-text");
      if (this.config.labelAsHtml) {
        text.innerHTML = option.view;
      } else {
        text.textContent = option.view;
      }
      applyStyles(text, this.config.styles.optionText);
      content.appendChild(text);
      return content;
    }

    _renderIcon(iconInput, context) {
      if (!this.config.icons.enabled && context.part !== "caret") return null;

      if (typeof this.config.behavior.renderIcon === "function") {
        var behaviorIcon = this.config.behavior.renderIcon.call(this, {
          icon: iconInput,
          context: context,
          instance: this,
          runDefault: this._defaultRenderIcon.bind(this, iconInput, context)
        });
        if (isElement(behaviorIcon)) return behaviorIcon;
      }

      if (typeof this.config.icons.renderer === "function") {
        var rendered = this.config.icons.renderer.call(this, iconInput, context, this);
        if (isElement(rendered)) return rendered;
      }

      return this._defaultRenderIcon(iconInput, context);
    }

    _defaultRenderIcon(iconInput) {
      if (!iconInput) return null;
      if (isElement(iconInput)) return iconInput.cloneNode(true);
      if (typeof iconInput === "function") {
        var functionIcon = iconInput.call(this, this);
        return isElement(functionIcon) ? functionIcon : null;
      }

      if (isPlainObject(iconInput)) {
        if (iconInput.type === "image") {
          var img = document.createElement("img");
          img.src = iconInput.src || "";
          img.alt = iconInput.alt || "";
          applyStyles(img, iconInput.styles || {});
          return img;
        }
        if (iconInput.type === "html") {
          var spanHtml = document.createElement("span");
          spanHtml.innerHTML = iconInput.html || "";
          applyStyles(spanHtml, iconInput.styles || {});
          return spanHtml;
        }
        if (iconInput.type === "material" || iconInput.name) {
          var spanMaterial = document.createElement("span");
          spanMaterial.className = iconInput.className || this.config.icons.className;
          spanMaterial.textContent = iconInput.name || iconInput.icon || "";
          applyStyles(spanMaterial, iconInput.styles || {});
          return spanMaterial;
        }
      }

      var span = document.createElement("span");
      span.className = this.config.icons.className;
      span.textContent = String(iconInput);
      return span;
    }

    _renderCaret() {
      if (typeof this.config.icons.caretRenderer === "function") {
        var customCaret = this.config.icons.caretRenderer.call(this, { instance: this });
        if (isElement(customCaret)) return customCaret;
      }

      var caret = this._renderIcon(this.config.icons.caret, { part: "caret" });
      if (caret) {
        caret.setAttribute("data-ssd-part", "caret");
        applyStyles(caret, this.config.styles.caret);
      }
      return caret;
    }

    _renderCheckIcon(option) {
      var selected = this.selectedKeys.has(option.key);
      var iconName = this.config.multiple
        ? (selected ? this.config.icons.selected : this.config.icons.unselected)
        : (selected ? this.config.icons.singleSelected : this.config.icons.singleUnselected);

      if (typeof this.config.behavior.renderCheckIcon === "function") {
        var behaviorCheck = this.config.behavior.renderCheckIcon.call(this, {
          option: option,
          selected: selected,
          iconName: iconName,
          instance: this,
          runDefault: this._defaultRenderCheckIcon.bind(this, iconName)
        });
        if (isElement(behaviorCheck)) return behaviorCheck;
      }

      if (typeof this.config.icons.checkRenderer === "function") {
        var customCheck = this.config.icons.checkRenderer.call(this, {
          option: option,
          selected: selected,
          iconName: iconName,
          instance: this
        });
        if (isElement(customCheck)) return customCheck;
      }

      return this._defaultRenderCheckIcon(iconName);
    }

    _defaultRenderCheckIcon(iconName) {
      if (!this.config.icons.enabled) return null;
      var check = document.createElement("span");
      check.className = this.config.icons.className;
      check.setAttribute("data-ssd-part", "check-icon");
      check.textContent = iconName;
      return check;
    }

    _applyOptionState(element, option, index, total) {
      var selected = this.selectedKeys.has(option.key);
      var highlighted = this.highlightedKey === option.key;
      var detail = {
        option: option,
        element: element,
        index: index,
        total: total,
        selected: selected,
        highlighted: highlighted
      };

      if (!this._emit("beforeApplyOptionState", detail)) return;

      if (typeof this.config.behavior.applyOptionState === "function") {
        this.config.behavior.applyOptionState.call(this, {
          option: option,
          element: element,
          selected: selected,
          highlighted: highlighted,
          instance: this,
          runDefault: this._defaultApplyOptionState.bind(this, element, option, index, total)
        });
      } else {
        this._defaultApplyOptionState(element, option, index, total);
      }

      this._emit("applyOptionState", detail);
    }

    _defaultApplyOptionState(element, option, index, total) {
      var selected = this.selectedKeys.has(option.key);
      var highlighted = this.highlightedKey === option.key;
      var text = element.querySelector('[data-ssd-part="option-text"]');
      var check = element.querySelector('[data-ssd-part="check-icon"]');
      var icon = element.querySelector('[data-ssd-part="option-content"] > .' + this.config.icons.className);

      element.removeAttribute("disabled");
      applyStyles(element, this.config.styles.option);
      applyStyles(element, selected ? this.config.styles.optionSelected : this.config.styles.optionUnselected);
      if (index === total - 1) applyStyles(element, this.config.styles.optionLast);
      if (highlighted && !selected) applyStyles(element, this.config.styles.optionHighlighted);
      if (option.disabled) {
        element.setAttribute("disabled", "disabled");
        applyStyles(element, this.config.styles.optionDisabled);
      }
      applyStyles(element, option.styles && option.styles.option ? option.styles.option : {});

      if (text) {
        applyStyles(text, this.config.styles.optionText);
        applyStyles(text, selected ? this.config.styles.optionTextSelected : this.config.styles.optionTextUnselected);
        applyStyles(text, option.styles && option.styles.text ? option.styles.text : {});
      }

      if (check) {
        check.textContent = this.config.multiple
          ? (selected ? this.config.icons.selected : this.config.icons.unselected)
          : (selected ? this.config.icons.singleSelected : this.config.icons.singleUnselected);
        applyStyles(check, this.config.styles.checkIcon);
        applyStyles(check, selected ? this.config.styles.checkIconSelected : this.config.styles.checkIconUnselected);
      }

      if (icon) {
        applyStyles(icon, this.config.styles.optionIcon);
        if (selected) {
          applyStyles(icon, {
            color: this.config.styles.optionSelected.color || "#0f3fb8",
            fontVariationSettings: '"FILL" 0, "wght" 700, "GRAD" 0, "opsz" 24'
          });
        }
      }
    }

    _getVisibleOptions() {
      var options;

      if (typeof this.config.behavior.filterOptions === "function") {
        options = this.config.behavior.filterOptions.call(this, {
          options: this.normalizedOptions.slice(),
          term: this.searchTerm,
          instance: this,
          runDefault: this._defaultFilterOptions.bind(this)
        });
      } else {
        options = this._defaultFilterOptions();
      }

      if (!Array.isArray(options)) options = [];

      if (typeof this.config.behavior.sortOptions === "function") {
        options = this.config.behavior.sortOptions.call(this, {
          options: options.slice(),
          selectedKeys: this.selectedKeys,
          instance: this,
          runDefault: this._defaultSortOptions.bind(this, options)
        });
      } else {
        options = this._defaultSortOptions(options);
      }

      return Array.isArray(options) ? options : [];
    }

    _defaultFilterOptions() {
      var term = String(this.searchTerm || "");
      if (this.config.search.trim) term = term.trim();
      if (!this.config.search.caseSensitive) term = term.toLowerCase();
      if (!term) return this.normalizedOptions.slice();

      if (typeof this.config.search.matcher === "function") {
        return this.normalizedOptions.filter(function customMatch(option) {
          return !!this.config.search.matcher.call(this, option, term, this);
        }, this);
      }

      var self = this;
      return this.normalizedOptions.filter(function defaultMatch(option) {
        return self._optionSearchHaystack(option).indexOf(term) > -1;
      });
    }

    _defaultSortOptions(options) {
      var mode = this.config.sort.mode || "none";
      var direction = this.config.sort.direction === "desc" ? -1 : 1;
      var self = this;

      if (typeof this.config.sort.compare === "function") {
        return options.slice().sort(function customCompare(a, b) {
          return self.config.sort.compare.call(self, a, b, self) * direction;
        });
      }

      if (mode === "none") return options;

      return options.slice().sort(function defaultCompare(a, b) {
        var aSelected = self.selectedKeys.has(a.key) ? 1 : 0;
        var bSelected = self.selectedKeys.has(b.key) ? 1 : 0;

        if (mode === "selectedFirst" || mode === "selectedFirstAlphabetical") {
          if (aSelected !== bSelected) return bSelected - aSelected;
        }

        if (mode === "alphabetical" || mode === "selectedFirstAlphabetical") {
          return String(a.view).localeCompare(String(b.view)) * direction;
        }

        return a.index - b.index;
      });
    }

    _defaultOpen() {
      this.isOpen = true;
      clearTimeout(this._closeTimer);

      applyStyles(this.menu, this.config.styles.menu);
      applyStyles(this.menu, this.config.styles.menuOpen);
      this.button.setAttribute("aria-expanded", "true");
      this._applyButtonState();

      if (this.config.effects.openAnimation) {
        this.menu.style.opacity = "0";
        this.menu.style.transform = "translateY(-2px) scale(0.98)";
        this.menu.style.transition = "opacity " + this.config.effects.animationDuration + "ms " +
          this.config.effects.animationEasing + ", transform " +
          this.config.effects.animationDuration + "ms " + this.config.effects.animationEasing;
        requestAnimationFrame(function animateMenu() {
          this.menu.style.opacity = "1";
          this.menu.style.transform = "translateY(0) scale(1)";
        }.bind(this));
      }

      document.addEventListener("click", this._boundDocumentClick, true);
      this._renderOptions();

      if (this.config.search.enabled && this.config.search.autofocus && this.searchInput) {
        setTimeout(function focusSearch() {
          this.searchInput.focus();
          if (typeof this.searchInput.select === "function") this.searchInput.select();
        }.bind(this), 0);
      }
    }

    _defaultClose() {
      this.isOpen = false;
      this.highlightedKey = null;
      this.button.setAttribute("aria-expanded", "false");
      document.removeEventListener("click", this._boundDocumentClick, true);

      var finishClose = function finishClose() {
        if (!this.menu) return;
        applyStyles(this.menu, this.config.styles.menu);
        this._applyButtonState();
      }.bind(this);

      if (this.config.effects.closeAnimation) {
        this.menu.style.opacity = "0";
        this.menu.style.transform = "translateY(-2px) scale(0.98)";
        clearTimeout(this._closeTimer);
        this._closeTimer = setTimeout(finishClose, this.config.effects.animationDuration);
      } else {
        finishClose();
      }
    }

    _defaultSetValue(value) {
      var values = this.config.multiple ? toArray(value) : toArray(value).slice(0, 1);
      var nextKeys = new Set();

      for (var i = 0; i < values.length; i += 1) {
        var option = this._findOptionByValue(values[i]);
        if (option && !option.disabled) nextKeys.add(option.key);
      }

      this.selectedKeys = nextKeys;
    }

    _defaultClear() {
      this.selectedKeys.clear();
    }

    _defaultToggleOption(option, options) {
      if (this.selectedKeys.has(option.key)) {
        return this._unselectOption(option, options);
      }
      return this._selectOption(option, options);
    }

    _selectOption(option, options) {
      var opts = options || {};
      var previousValue = this.getValue();

      if (opts.emit !== false && !this._emit("beforeSelect", {
        option: option,
        value: option.value,
        previousValue: previousValue
      })) {
        return this;
      }

      if (typeof this.config.behavior.select === "function") {
        this.config.behavior.select.call(this, {
          option: option,
          value: option.value,
          instance: this,
          runDefault: this._defaultSelectOption.bind(this, option)
        });
      } else {
        this._defaultSelectOption(option);
      }

      if (this.config.clearSearchOnSelect) this.search("", { emit: false });
      this._renderAll();

      if (opts.emit !== false) {
        this._emit("select", { option: option, value: option.value, previousValue: previousValue });
        this._emitChange(previousValue, option);
      }

      var closeOnSelect = this.config.closeOnSelect;
      if (closeOnSelect === null) closeOnSelect = !this.config.multiple;
      if (closeOnSelect) this.close();
      return this;
    }

    _unselectOption(option, options) {
      var opts = options || {};
      var previousValue = this.getValue();
      if (!this.selectedKeys.has(option.key)) return this;

      if (opts.emit !== false && !this._emit("beforeUnselect", {
        option: option,
        value: option.value,
        previousValue: previousValue
      })) {
        return this;
      }

      if (typeof this.config.behavior.unselect === "function") {
        this.config.behavior.unselect.call(this, {
          option: option,
          value: option.value,
          instance: this,
          runDefault: this._defaultUnselectOption.bind(this, option)
        });
      } else {
        this._defaultUnselectOption(option);
      }

      this._renderAll();

      if (opts.emit !== false) {
        this._emit("unselect", { option: option, value: option.value, previousValue: previousValue });
        this._emitChange(previousValue, option);
      }
      return this;
    }

    _defaultSelectOption(option) {
      if (!this.config.multiple) this.selectedKeys.clear();
      this.selectedKeys.add(option.key);
    }

    _defaultUnselectOption(option) {
      this.selectedKeys.delete(option.key);
    }

    _normalizeOption(input, index) {
      var custom;
      if (typeof this.config.behavior.normalizeOption === "function") {
        custom = this.config.behavior.normalizeOption.call(this, {
          input: input,
          index: index,
          fields: this.config.fields,
          instance: this,
          runDefault: this._defaultNormalizeOption.bind(this, input, index)
        });
      }
      var option = isPlainObject(custom) ? custom : this._defaultNormalizeOption(input, index);
      option.key = String(option.key);
      option.index = index;
      option.raw = input;
      return option;
    }

    _defaultNormalizeOption(input, index) {
      if (!isPlainObject(input)) {
        return {
          key: this._keyForValue(input, null, index),
          value: input,
          label: String(input),
          view: String(input),
          icon: null,
          disabled: false,
          searchText: String(input),
          styles: {},
          meta: {}
        };
      }

      var fields = this.config.fields;
      var value = getByPath(input, fields.value);
      if (typeof value === "undefined") value = getByPath(input, "id");
      if (typeof value === "undefined") value = getByPath(input, "value");
      if (typeof value === "undefined") value = input;

      var label = getByPath(input, fields.label);
      if (typeof label === "undefined") label = getByPath(input, "text");
      if (typeof label === "undefined") label = getByPath(input, "name");
      if (typeof label === "undefined") label = String(value);

      var view = getByPath(input, fields.view);
      if (typeof view === "undefined" || view === null || view === "") view = label;

      var key = getByPath(input, fields.key);
      if (typeof key === "undefined" || key === null || key === "") key = this._keyForValue(value, input, index);

      return {
        key: key,
        value: value,
        label: String(label),
        view: String(view),
        icon: getByPath(input, fields.icon),
        disabled: !!getByPath(input, fields.disabled),
        searchText: getByPath(input, fields.searchText) || "",
        styles: getByPath(input, fields.styles) || {},
        meta: getByPath(input, fields.meta) || {}
      };
    }

    _keyForValue(value, raw, index) {
      if (typeof this.config.trackBy === "function") {
        return String(this.config.trackBy.call(this, value, raw, index));
      }
      if (this.config.trackBy && raw) {
        var tracked = getByPath(raw, this.config.trackBy);
        if (typeof tracked !== "undefined") return String(tracked);
      }
      if (value && typeof value === "object") {
        try {
          return JSON.stringify(value);
        } catch (_error) {
          return String(index);
        }
      }
      return String(value);
    }

    _findOptionByValue(value) {
      var key = this._keyForValue(value);
      if (this.optionByKey.has(key)) return this.optionByKey.get(key);

      for (var i = 0; i < this.normalizedOptions.length; i += 1) {
        if (this.normalizedOptions[i].value === value) return this.normalizedOptions[i];
      }
      return null;
    }

    _optionSearchHaystack(option) {
      var keys = Array.isArray(this.config.search.keys) ? this.config.search.keys : [];
      var values = [];

      for (var i = 0; i < keys.length; i += 1) {
        var key = keys[i];
        var value = option[key];
        if (typeof value !== "undefined" && value !== null) values.push(String(value));
      }

      var haystack = values.join(" ");
      return this.config.search.caseSensitive ? haystack : haystack.toLowerCase();
    }

    _emitChange(previousValue, option) {
      var nextValue = this.getValue();
      if (JSON.stringify(previousValue) === JSON.stringify(nextValue)) return true;

      if (!this._emit("beforeChange", {
        previousValue: previousValue,
        value: nextValue,
        option: option || null
      })) {
        return false;
      }

      this._emit("change", {
        previousValue: previousValue,
        value: nextValue,
        selectedOptions: this.getSelectedOptions(),
        option: option || null
      });
      return true;
    }

    _emit(eventName, detail) {
      var payload = detail || {};
      var prevented = false;
      var eventPayload = {};
      var self = this;

      Object.keys(payload).forEach(function copy(key) {
        eventPayload[key] = payload[key];
      });
      eventPayload.type = eventName;
      eventPayload.instance = this;
      eventPayload.preventDefault = function preventDefault() {
        prevented = true;
      };

      function callHandler(handler) {
        if (typeof handler !== "function") return;
        var result = handler.call(self, eventPayload, self);
        if (result === false) prevented = true;
      }

      callHandler(this.config["on" + eventName]);
      callHandler(this.config["on" + upperFirst(eventName)]);

      var configured = this.config.events && this.config.events[eventName];
      if (Array.isArray(configured)) {
        configured.forEach(callHandler);
      } else {
        callHandler(configured);
      }

      var listeners = this.listeners[eventName] || [];
      listeners.slice().forEach(callHandler);

      if (this.root && typeof CustomEvent === "function") {
        var domEvent = new CustomEvent("supersexy:" + eventName, {
          bubbles: true,
          cancelable: true,
          detail: eventPayload
        });
        this.root.dispatchEvent(domEvent);
        if (domEvent.defaultPrevented) prevented = true;
      }

      return !prevented;
    }

    _syncDisabled() {
      if (!this.root || !this.button) return;
      this.button.disabled = !!this.config.disabled;
      this.button.setAttribute("aria-disabled", this.config.disabled ? "true" : "false");
      applyStyles(this.root, this.config.styles.root);
      if (this.config.disabled) applyStyles(this.root, this.config.styles.rootDisabled);
      this._applyButtonState();
    }

    _applyButtonState() {
      if (!this.button) return;
      applyStyles(this.button, this.config.styles.button);
      if (this.config.effects.hover && this.isButtonHovered) applyStyles(this.button, this.config.styles.buttonHover);
      if (this.isOpen) applyStyles(this.button, this.config.styles.buttonOpen);
      if (this.config.effects.focus && this.isFocused) applyStyles(this.button, this.config.styles.buttonFocus);

      if (this.caret) {
        applyStyles(this.caret, this.config.styles.caret);
        if (this.isOpen && this.config.effects.rotateCaret) applyStyles(this.caret, this.config.styles.caretOpen);
      }
    }

    _moveHighlight(delta) {
      var options = this._getVisibleOptions().filter(function enabledOnly(option) {
        return !option.disabled;
      });
      if (!options.length) return;

      var currentIndex = -1;
      for (var i = 0; i < options.length; i += 1) {
        if (options[i].key === this.highlightedKey) {
          currentIndex = i;
          break;
        }
      }

      var nextIndex = currentIndex + delta;
      if (nextIndex < 0) nextIndex = options.length - 1;
      if (nextIndex >= options.length) nextIndex = 0;
      this.highlightedKey = options[nextIndex].key;
      this._renderOptions();
      this._scrollHighlightedIntoView();
    }

    _activateHighlighted() {
      if (!this.highlightedKey) return;
      var option = this.optionByKey.get(this.highlightedKey);
      if (option) this.toggleValue(option.value);
    }

    _scrollHighlightedIntoView() {
      if (!this.highlightedKey) return;
      var element = this.optionElements.get(this.highlightedKey);
      if (element && typeof element.scrollIntoView === "function") {
        element.scrollIntoView({ block: "nearest" });
      }
    }

    _handleButtonClick(event) {
      event.preventDefault();
      this.toggle();
    }

    _handleButtonKeydown(event) {
      if (!this.config.effects.keyboard) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (!this.isOpen) this.open();
        this._moveHighlight(1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (!this.isOpen) this.open();
        this._moveHighlight(-1);
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (!this.isOpen) {
          this.open();
        } else {
          this._activateHighlighted();
        }
      } else if (event.key === "Escape" && this.config.effects.closeOnEscape) {
        this.close();
      }
    }

    _handleSearchInput(event) {
      var value = event.target.value;
      clearTimeout(this._searchTimer);
      if (this.config.search.debounce > 0) {
        this._searchTimer = setTimeout(function delayedSearch() {
          this.search(value);
        }.bind(this), this.config.search.debounce);
      } else {
        this.search(value);
      }
    }

    _handleSearchKeydown(event) {
      if (!this.config.effects.keyboard) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        this._moveHighlight(1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        this._moveHighlight(-1);
      } else if (event.key === "Enter") {
        event.preventDefault();
        this._activateHighlighted();
      } else if (event.key === "Escape" && this.config.effects.closeOnEscape) {
        event.preventDefault();
        this.close();
        this.button.focus();
      }
    }

    _handleOptionClick(option, event) {
      event.preventDefault();
      event.stopPropagation();
      this.toggleValue(option.value);
    }

    _handleOptionMouseEnter(option) {
      if (!this.config.effects.hover) return;
      this.highlightedKey = option.key;
      var element = this.optionElements.get(option.key);
      if (element) {
        this._applyOptionState(element, option, 0, this.optionElements.size);
        if (!this.selectedKeys.has(option.key)) applyStyles(element, this.config.styles.optionHover);
      }
    }

    _handleOptionMouseLeave(option) {
      if (!this.config.effects.hover) return;
      if (this.highlightedKey === option.key) this.highlightedKey = null;
      var element = this.optionElements.get(option.key);
      if (element) this._applyOptionState(element, option, 0, this.optionElements.size);
    }

    _handleDocumentClick(event) {
      if (!this.config.effects.closeOnOutsideClick || !this.root) return;
      if (!this.root.contains(event.target)) this.close();
    }

    _handleFocus() {
      this.isFocused = true;
      this._applyButtonState();
    }

    _handleBlur() {
      this.isFocused = false;
      this._applyButtonState();
    }

    _handleButtonMouseEnter() {
      this.isButtonHovered = true;
      this._applyButtonState();
    }

    _handleButtonMouseLeave() {
      this.isButtonHovered = false;
      this._applyButtonState();
    }

    _handleSearchFocus() {
      if (this.searchInput) applyStyles(this.searchInput, this.config.styles.searchInputFocus);
    }

    _handleSearchBlur() {
      if (this.searchInput) applyStyles(this.searchInput, this.config.styles.searchInput);
    }
  }

  SuperSexyDropdown.VERSION = VERSION;
  SuperSexyDropdown.defaults = DEFAULT_CONFIG;
  SuperSexyDropdown.merge = deepMerge;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = SuperSexyDropdown;
  }

  global.SuperSexyDropdown = SuperSexyDropdown;
}(typeof window !== "undefined" ? window : (typeof global !== "undefined" ? global : this)));
