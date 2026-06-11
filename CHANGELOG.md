# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-06-11

### Added

- Initial public release of `SuperSexyDropdown`.
- Vanilla JavaScript dropdown/select control with inline-only styling.
- `new SuperSexyDropdown(config)` constructor with deep configuration support.
- `SuperSexyDropdown.fromSelect(select, config)` for upgrading native `<select>` elements.
- Mounting and lifecycle controls: `mount`, `unmount`, `destroy`, `refresh`, `focus`, `enable`, and `disable`.
- Value controls: `getValue`, `getSelectedOptions`, `setValue`, `select`, `unselect`, `toggleValue`, `clear`.
- Option controls: `setOptions`, `addOption`, `removeOption`, and `search`.
- Event hooks for creation, mount, open/close, search, select/unselect, change, render, option rendering, and destroy.
- Custom behavior overrides for rendering, filtering, sorting, selection, and state application.
- Built-in support for Material Symbols style icon rendering, custom icon factories, and HTML/icon element inputs.

### Notes

- The library ships as source in `src/supersexydropdown.js` and exports a CommonJS module while also attaching `window.SuperSexyDropdown` in browsers.
