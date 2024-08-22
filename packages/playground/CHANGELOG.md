# Change Log - @typespec/playground

## 0.4.1

### Bump dependencies

- [#3948](https://github.com/microsoft/typespec/pull/3948) Update dependencies


## 0.4.0

### Bump dependencies

- [#3718](https://github.com/microsoft/typespec/pull/3718) Dependency updates July 2024

### Features

- [#3585](https://github.com/microsoft/typespec/pull/3585) Add error recovery for viewer that crash
- [#3750](https://github.com/microsoft/typespec/pull/3750) Add new property on the playground to add custom buttons on the toolbar
- [#3713](https://github.com/microsoft/typespec/pull/3713) Extract splitpane into separate package


## 0.3.0

### Bug Fixes

- [#3542](https://github.com/microsoft/typespec/pull/3542) Fix issue where hover tooltip would be cropped or not visible

### Bump dependencies

- [#3401](https://github.com/microsoft/typespec/pull/3401) Update dependencies - May 2024

### Features

- [#3465](https://github.com/microsoft/typespec/pull/3465) Provide ability to add custom program viewers
- [#3569](https://github.com/microsoft/typespec/pull/3569) Support loglevel in playground's logging


## 0.2.2

### Bug Fixes

- [#3170](https://github.com/microsoft/typespec/pull/3170) Add support for new intrinsic vs std lib split in the compiler.
- [#3151](https://github.com/microsoft/typespec/pull/3151) Fix completion of keywords

### Bump dependencies

- [#3169](https://github.com/microsoft/typespec/pull/3169) Update dependencies


## 0.2.1

### Bug Fixes

- [#3031](https://github.com/microsoft/typespec/pull/3031) Add `aria` attributes for accessibility

### Bump dependencies

- [#3027](https://github.com/microsoft/typespec/pull/3027) Update dependencies


## 0.2.0

### Bug Fixes

- [#2888](https://github.com/microsoft/typespec/pull/2888) Refactor of the mapping between Language Server and monaco API

### Bump dependencies

- [#2900](https://github.com/microsoft/typespec/pull/2900) Update dependencies

### Features

- [#2936](https://github.com/microsoft/typespec/pull/2936) Autocomplete installed libraries in `import` statements


## 0.1.0

### Patch Changes



## 0.1.0-alpha.5

Wed, 24 Jan 2024 05:46:53 GMT

### Updates

- Remove `githubIssueUrl` link and replace with a `onFileBug` callback.
- Handle new `$linter` exported variable
- Add `noopener noreferrer` to footer external links
- Fix: Wrong css exports `style.css` was provided instead of `styles.css`. Both are now available for backward compatibility but `styles.css` is the recommended name.

## 0.1.0-alpha.4

Wed, 06 Dec 2023 19:40:58 GMT

### Updates

- Add a format button to the playground command bar
- Add a notification to the standalone playground when the playground has been saved.
- Add ability to pass a custom footer and use `Footer` and `FooterItem` component to build your own
- `registerMonacoDefaultWorkers` renamed to `registerMonacoDefaultWorkersForVite` and must now be called if using vite.
- Move errors and warnings to a dedicated expandable banner at the bottom of the playground.
- Allow standalone playground to show a loading fallback

## 0.1.0-alpha.3

Wed, 08 Nov 2023 00:07:17 GMT

### Updates

- **BREAKING CHANGE** Dropped support for node 16, minimum node version is now 18
- Enable changing the theme
- Add resizable panes for the editor and output
- Ability to configure via `createBrowserHost` if library loading should use system `importmap` or the es-module-shim library with `importmap-shim`. This was added due to the lack of support for external source map in browsers.
- **BREAKING CHANGE** Styles must be imported seperately with `import \"@typespec/playground/styles.css\";`

## 0.1.0-alpha.2

Wed, 03 Oct 2023 18:00:18 GMT

### Updates

- Upgrade swagger-ui

## 0.1.0-alpha.1

Tue, 12 Sep 2023 21:47:11 GMT

### Updates

- Fix: Usage of the package in vite dev mode was broken. Some errors due to the loading of the manifest as well as monaco editor workers.
  **BREAKING CHANGE:** Changed `import { PlaygroundManifest } from "@typespec/playground/manifest";` to`import PlaygroundManifest from "@typespec/playground/manifest";`
