# SuperSexyDropdown

SuperSexyDropdown is a vanilla JavaScript dropdown/select component with searchable options, multi-select support, inline styling, icon rendering, event hooks, and behavior overrides. It is built for people who want a custom dropdown without adopting a framework-specific widget or a CSS dependency chain.

## Why this exists

| Need | What the library gives you |
| --- | --- |
| Replace a native select | A fully rendered dropdown UI with programmatic control. |
| Support single or multi-select | One component, both modes. |
| Search options quickly | Built-in search input and custom matcher support. |
| Sync state with code | A full value API plus lifecycle events. |
| Customize visuals without CSS files | Inline styles and behavior hooks. |

## What it does and does not do

| Can do | Cannot do |
| --- | --- |
| Render a dropdown from a config object | Fetch remote data for you |
| Upgrade a native `<select>` | Virtualize thousands of rows automatically |
| Support multi-select | Render grouped trees out of the box |
| Show icons in the trigger and options | Load Material Symbols for you |
| Emit cancelable lifecycle events | Replace your application form library |
| Let you override render/filter/sort logic | Become a CSS theme engine |

## Start here

```js
const dropdown = new SuperSexyDropdown({
  name: "office",
  placeholder: "Select office",
  multiple: true,
  options: [
    { value: "NYC", view: "NYC - United States", icon: "business" },
    { value: "SIN", view: "SIN - Singapore", icon: "business" },
    { value: "LHR", view: "LHR - United Kingdom", icon: "business" }
  ]
});

dropdown.mount("#office-host");
```

```js
console.log(dropdown.getValue());
console.log(dropdown.getSelectedOptions());
```

## Include it

### Browser script

```html
<script src="./src/supersexydropdown.js"></script>
<script>
  const dropdown = new SuperSexyDropdown({
    options: [{ value: "a", view: "Option A" }]
  });
  dropdown.mount("#app");
</script>
```

### CommonJS

```js
const SuperSexyDropdown = require("./src/supersexydropdown");
```

## Create an instance

```js
const dropdown = new SuperSexyDropdown(config);
```

The constructor accepts one config object. There are no mandatory keys at the type level, but `options` is the practical minimum if you want a useful control.

| Config | Required | Default | Notes |
| --- | --- | --- | --- |
| `options` | No | `[]` | Source option list. Recommended. |
| `value` | No | `null` | Initial value. |
| `multiple` | No | `false` | Enables multi-select mode. |
| `placeholder` | No | `"Select"` | Text shown when nothing is selected. |
| `disabled` | No | `false` | Disables the trigger and selection. |
| `name` | No | `""` | Stored on the root as `data-ssd-name`. |
| `id` | No | `""` | Root element id. Generated if omitted. |

## Mount it

```js
dropdown.mount(target, { position: "append" });
```

| Argument | Type | Required | Notes |
| --- | --- | --- | --- |
| `target` | `HTMLElement \| string` | Yes | Element or selector. |
| `options.position` | `append \| prepend \| replace \| before \| after` | No | Defaults to `append`. |

| Position | Behavior |
| --- | --- |
| `append` | Insert as the last child of `target`. |
| `prepend` | Insert as the first child of `target`. |
| `replace` | Clear `target` and insert the dropdown. |
| `before` | Insert before `target`. |
| `after` | Insert after `target`. |

### Example

```js
const host = document.querySelector("#filters");
dropdown.mount(host, { position: "append" });
```

## Upgrade a native select

```js
const dropdown = SuperSexyDropdown.fromSelect("#country-select", {
  placeholder: "Choose a country"
});
```

`fromSelect` reads the existing `<option>` elements, hides the native select, mounts the custom UI after it, and keeps the native select in sync on `change`.

| Step | Behavior |
| --- | --- |
| Read options | Pulls `value`, `text`, and `disabled` from each option. |
| Read selection | Uses the native selected value(s) as the initial state. |
| Hide source | Sets the native select to `display: none`. |
| Mount UI | Inserts the dropdown after the select. |
| Sync back | Dispatches a bubbling `change` event on the source select. |

## Public methods

| Method | Returns | Use when |
| --- | --- | --- |
| `mount(target, options)` | Instance | Attach the control to the DOM. |
| `unmount()` | Instance | Remove the control without losing state. |
| `destroy()` | `void` | Tear everything down. |
| `on(eventName, handler)` | Instance | Subscribe at runtime. |
| `off(eventName, handler)` | Instance | Remove a runtime listener. |
| `open(options)` | Instance | Open the menu programmatically. |
| `close(options)` | Instance | Close the menu programmatically. |
| `toggle()` | Instance | Toggle open/closed. |
| `getValue()` | `* \| Array<*> \| null` | Read the selected value. |
| `getSelectedOptions()` | `Array<Object>` | Read selected normalized options. |
| `setValue(value, options)` | Instance | Replace selected value(s). |
| `select(value, options)` | Instance | Select one option. |
| `unselect(value, options)` | Instance | Unselect one option. |
| `toggleValue(value, options)` | Instance | Toggle one option by value. |
| `clear(options)` | Instance | Clear all selections. |
| `setOptions(options, optionsArg)` | Instance | Replace the option list. |
| `addOption(option)` | Instance | Add one option. |
| `removeOption(value)` | Instance | Remove one option by value. |
| `search(term, options)` | Instance | Set the current search term. |
| `refresh()` | Instance | Re-render the UI. |
| `disable()` | Instance | Disable interaction. |
| `enable()` | Instance | Re-enable interaction. |
| `focus()` | Instance | Focus the trigger button. |

### Common call order

| Scenario | Calls |
| --- | --- |
| Create then mount | `new SuperSexyDropdown(...)` -> `mount(...)` |
| Load data later | `new SuperSexyDropdown(...)` -> `mount(...)` -> `setOptions(...)` |
| Set initial state after data | `setOptions(...)` -> `setValue(...)` |
| Replace a selection from code | `select(...)`, `unselect(...)`, `toggleValue(...)`, `clear(...)` |
| Tear down | `close()` -> `destroy()` |

## Events

Events can be attached three ways:

1. `config.events`
2. `config.onX` aliases such as `onChange`
3. `instance.on(eventName, handler)`

Every event payload includes `type`, `instance`, and `preventDefault()`. Returning `false` from a `before*` event also cancels the default behavior.

| Event | When it fires | Cancelable |
| --- | --- | --- |
| `created` | After the instance is created. | No |
| `mounted` | After `mount(...)` completes. | No |
| `beforeOpen` | Before the menu opens. | Yes |
| `open` | After the menu opens. | No |
| `beforeClose` | Before the menu closes. | Yes |
| `close` | After the menu closes. | No |
| `beforeSearch` | Before the search term updates. | Yes |
| `search` | After the search term updates. | No |
| `beforeSelect` | Before an option is selected. | Yes |
| `select` | After an option is selected. | No |
| `beforeUnselect` | Before an option is unselected. | Yes |
| `unselect` | After an option is unselected. | No |
| `beforeChange` | Before a committed value change. | Yes |
| `change` | After the selected value changes. | No |
| `beforeClear` | Before selections are cleared. | Yes |
| `clear` | After selections are cleared. | No |
| `beforeRender` | Before the trigger and menu re-render. | Yes |
| `render` | After the UI re-renders. | No |
| `beforeRenderOption` | Before one option row is created. | Yes |
| `renderOption` | After one option row is created. | No |
| `beforeApplyOptionState` | Before selected/highlighted/disabled state is applied. | Yes |
| `applyOptionState` | After state is applied to one option row. | No |
| `destroy` | During teardown. | No |

### Example

```js
dropdown.on("change", ({ value, previousValue }) => {
  console.log("before:", previousValue);
  console.log("after:", value);
});
```

## Config reference

<details>
<summary><strong>Core config</strong></summary>

| Key | Default | Notes |
| --- | --- | --- |
| `options` | `[]` | Flat option list. |
| `value` | `null` | Initial selected value(s). |
| `multiple` | `false` | Multi-select mode. |
| `disabled` | `false` | Disables interaction. |
| `placeholder` | `"Select"` | Empty-state text. |
| `noMatchesText` | `"No matches"` | Empty-state message for filtered menus. |
| `closeOnSelect` | `null` | Auto-closes in single-select and stays open in multi-select. |
| `clearSearchOnClose` | `false` | Clears search when closing. |
| `clearSearchOnSelect` | `false` | Clears search after a selection. |
| `labelAsHtml` | `false` | Renders option text with `innerHTML`. Use trusted content only. |
| `trackBy` | `null` | Custom identity key or function. |

</details>

<details>
<summary><strong>Search config</strong></summary>

| Key | Default | Notes |
| --- | --- | --- |
| `search.enabled` | `true` | Shows the search input. |
| `search.placeholder` | `"Type to search..."` | Search placeholder. |
| `search.autofocus` | `true` | Focuses the search input on open. |
| `search.caseSensitive` | `false` | Matching mode. |
| `search.trim` | `true` | Trims the term before matching. |
| `search.debounce` | `0` | Debounce in milliseconds. |
| `search.keys` | `["view", "label", "value", "searchText"]` | Fields used in the search haystack. |
| `search.matcher` | `null` | Custom filter function. |

</details>

<details>
<summary><strong>Sort config</strong></summary>

| Key | Default | Notes |
| --- | --- | --- |
| `sort.mode` | `"selectedFirst"` | `none`, `alphabetical`, `selectedFirst`, or `selectedFirstAlphabetical`. |
| `sort.direction` | `"asc"` | Use `desc` to reverse alphabetical/custom comparisons. |
| `sort.compare` | `null` | Custom comparator. |

</details>

<details>
<summary><strong>Icons config</strong></summary>

| Key | Default | Notes |
| --- | --- | --- |
| `icons.enabled` | `true` | Enables icon rendering. |
| `icons.className` | `"material-symbols-outlined"` | Class used for icon spans. |
| `icons.library` | `"material-symbols"` | Reserved metadata; not used by rendering. |
| `icons.caret` | `"expand_more"` | Default caret glyph. |
| `icons.defaultOption` | `""` | Fallback option icon. |
| `icons.selected` | `"done"` | Multi-select selected glyph. |
| `icons.unselected` | `"check_box_outline_blank"` | Multi-select unselected glyph. |
| `icons.singleSelected` | `"radio_button_checked"` | Single-select selected glyph. |
| `icons.singleUnselected` | `"radio_button_unchecked"` | Single-select unselected glyph. |
| `icons.trigger` | `""` | Optional trigger icon. |
| `icons.renderer` | `null` | Custom icon renderer. |
| `icons.checkRenderer` | `null` | Custom check icon renderer. |
| `icons.caretRenderer` | `null` | Custom caret renderer. |

</details>

<details>
<summary><strong>Summary config</strong></summary>

| Key | Default | Notes |
| --- | --- | --- |
| `summary.maxLabels` | `2` | Max labels before overflow text. |
| `summary.separator` | `", "` | Label separator. |
| `summary.overflowPrefix` | `" +"` | Prefix before the overflow count. |
| `summary.useView` | `true` | Reserved in defaults; not currently consumed by the renderer. |
| `summary.renderer` | `null` | Custom summary renderer. |
| `summary.placeholderRenderer` | `null` | Custom placeholder renderer. |

</details>

<details>
<summary><strong>Effects config</strong></summary>

| Key | Default | Notes |
| --- | --- | --- |
| `effects.hover` | `true` | Enables hover highlighting. |
| `effects.focus` | `true` | Enables focus styling. |
| `effects.openAnimation` | `false` | Animates open. |
| `effects.closeAnimation` | `false` | Animates close. |
| `effects.animationDuration` | `120` | Duration in milliseconds. |
| `effects.animationEasing` | `"ease"` | CSS easing string. |
| `effects.closeOnOutsideClick` | `true` | Closes when clicking outside. |
| `effects.closeOnEscape` | `true` | Closes on Escape. |
| `effects.keyboard` | `true` | Enables keyboard navigation. |
| `effects.rotateCaret` | `false` | Rotates caret when open. |

</details>

<details>
<summary><strong>Behavior hooks</strong></summary>

| Hook | Purpose |
| --- | --- |
| `behavior.normalizeOption` | Replace option normalization. |
| `behavior.renderTrigger` | Replace trigger rendering. |
| `behavior.renderSummary` | Replace summary generation. |
| `behavior.renderIcon` | Replace icon rendering. |
| `behavior.renderCheckIcon` | Replace check glyph rendering. |
| `behavior.renderOption` | Replace the full option row. |
| `behavior.renderOptionContent` | Replace only the row content. |
| `behavior.applyOptionState` | Replace selected/highlighted/disabled styling logic. |
| `behavior.filterOptions` | Replace filtering logic. |
| `behavior.sortOptions` | Replace sorting logic. |
| `behavior.toggleOption` | Replace toggle behavior. |
| `behavior.select` | Replace select behavior. |
| `behavior.unselect` | Replace unselect behavior. |
| `behavior.setValue` | Replace value setting. |
| `behavior.clear` | Replace clear behavior. |
| `behavior.open` | Replace open behavior. |
| `behavior.close` | Replace close behavior. |

</details>

## Option shapes

### Default option object

```js
{
  value: "NYC",
  view: "New York City",
  label: "NYC",
  icon: "business",
  disabled: false,
  searchText: "New York",
  styles: {},
  meta: {}
}
```

### Mapping arbitrary data

```js
new SuperSexyDropdown({
  fields: {
    value: "code",
    label: "shortName",
    view: "displayName"
  },
  options: [
    { code: "sg", shortName: "SG", displayName: "Singapore" }
  ]
});
```

## Icons

Icon inputs can be:

| Input | Result |
| --- | --- |
| `"business"` | A material-symbols style span. |
| `HTMLElement` | The node is cloned and inserted. |
| `{ type: "material", name: "terminal" }` | A material icon span. |
| `{ type: "image", src: "...", alt: "..." }` | An image element. |
| `{ type: "html", html: "..." }` | A span with raw HTML. |
| `function` | A function that returns an element. |

## Common patterns

### Single-select with a custom summary

```js
const dropdown = new SuperSexyDropdown({
  placeholder: "Pick one",
  options: [
    { value: "apple", view: "Apple" },
    { value: "orange", view: "Orange" }
  ],
  summary: {
    renderer: ({ selectedOptions }) => `Chosen: ${selectedOptions[0]?.view || ""}`
  }
});
```

### Multi-select that stays open

```js
const dropdown = new SuperSexyDropdown({
  multiple: true,
  closeOnSelect: false,
  options: [
    { value: "a", view: "Alpha" },
    { value: "b", view: "Beta" }
  ]
});
```

### Custom search matching

```js
const dropdown = new SuperSexyDropdown({
  search: {
    matcher(option, term) {
      return String(option.view).toLowerCase().startsWith(term);
    }
  }
});
```

### Keep the default rendering and add a small tweak

```js
const dropdown = new SuperSexyDropdown({
  behavior: {
    renderOption({ option, runDefault }) {
      const element = runDefault();
      element.title = option.view;
      return element;
    }
  }
});
```

## Troubleshooting

| Problem | What to check |
| --- | --- |
| Menu is empty | Confirm `options` is an array and values are not filtered out by search. |
| Text looks like raw HTML | Check whether `labelAsHtml` is enabled and whether the markup is trusted. |
| Icons do not render | Load the Material Symbols font or provide custom icon rendering. |
| Click outside does not close | Verify `effects.closeOnOutsideClick` is enabled. |
| Keyboard navigation feels off | Confirm `effects.keyboard` is enabled. |
| Native select not syncing | Use `fromSelect(...)` and make sure the source select still exists in the DOM. |
| Option changes are not visible | Call `refresh()` after custom DOM/state changes. |

## Limitations

| Limit | Reality |
| --- | --- |
| Async loading | Not built in. Use `setOptions(...)` after fetching data yourself. |
| Tree/grouped menus | Not built in. |
| Virtual scrolling | Not built in. |
| CSS theming layer | Not built in. |
| Icon font delivery | Not built in. |
| Reserved defaults | `dataAttributes`, `icons.library`, and `summary.useView` exist in defaults, but the renderer does not currently consume them. |

## Static surface

| Static member | Purpose |
| --- | --- |
| `SuperSexyDropdown.VERSION` | Version string. |
| `SuperSexyDropdown.defaults` | The full default config object. |
| `SuperSexyDropdown.merge` | Deep merge helper. |
| `SuperSexyDropdown.mergeConfig()` | Merge defaults with one or more config objects. |
| `SuperSexyDropdown.fromSelect()` | Upgrade a native select. |

## Release checklist

Before publishing, make sure the repository has:

1. A real `repository` entry in `package.json`.
2. Real `homepage`, `bugs`, and `author` metadata if you want discoverability.
3. A screenshot or demo GIF in the README if you want the project to feel finished.
4. The Material Symbols font loaded in any demo page that uses the default icon names.

