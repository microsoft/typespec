# Change Log - typespec-vscode

## 0.59.0

### Bump dependencies

- [#3948](https://github.com/microsoft/typespec/pull/3948) Update dependencies


## 0.58.0

### Bump dependencies

- [#3718](https://github.com/microsoft/typespec/pull/3718) Dependency updates July 2024


## 0.57.0

### Bump dependencies

- [#3401](https://github.com/microsoft/typespec/pull/3401) Update dependencies - May 2024

### Features

- [#3533](https://github.com/microsoft/typespec/pull/3533) Enhance logging and trace
 1. Support "Developer: Set Log Level..." command to filter logs in TypeSpec output channel
 2. Add "typespecLanguageServer.trace.server" config for whether and how to send the traces from TypeSpec language server to client. (It still depends on client to decide whether to show these traces based on the configured Log Level.)
 3. More logs and traces are added for diagnostic and troubleshooting
- [#3385](https://github.com/microsoft/typespec/pull/3385) Add 'TypeSpec: Show Output Channel' command in VSCode extension


## 0.56.0

### Bump dependencies

- [#3169](https://github.com/microsoft/typespec/pull/3169) Update dependencies


## 0.55.0

### Bump dependencies

- [#3027](https://github.com/microsoft/typespec/pull/3027) Update dependencies


## 0.54.0

### Bump dependencies

- [#2900](https://github.com/microsoft/typespec/pull/2900) Update dependencies


## 0.53.0

### Patch Changes

- ba02533: Added icons to the extensions


## 0.52.1

Wed, 24 Jan 2024 05:46:53 GMT

_Version update only_

## 0.52.0

Wed, 24 Jan 2024 05:46:53 GMT

### Updates

- Update dependencies

## 0.51.0

Wed, 06 Dec 2023 19:40:58 GMT

_Version update only_

## 0.50.0

Wed, 08 Nov 2023 00:07:17 GMT

### Updates

- `TypeScript` use `types` entry under `exports` of `package.json` instead of legacy `typesVersions` to provide the definition files

## 0.49.0

Wed, 11 Oct 2023 23:31:35 GMT

### Updates

- Update dependencies

## 0.48.0

Tue, 12 Sep 2023 21:47:11 GMT

### Updates

- Add colors definition for `param`

## 0.47.0

Tue, 08 Aug 2023 22:32:10 GMT

_Version update only_

## 0.46.0

Tue, 11 Jul 2023 22:06:00 GMT

### Updates

- Remove `mkdirp` dependencies and replace with built-in `mkdir({recursive: true})`.
- Update dependencies

## 0.45.0

Tue, 06 Jun 2023 22:44:16 GMT

_Version update only_

## 0.44.0

Wed, 10 May 2023 21:24:00 GMT

### Updates

- Update dependencies

## 0.43.0

Tue, 11 Apr 2023 18:49:17 GMT

### Updates

- Fix highlighting of TypeSpec code blocks in markdown.

## 0.42.0

Mon, 13 Mar 2023 21:30:44 GMT

_Version update only_

## 0.41.0

Fri, 03 Mar 2023 19:59:17 GMT

### Updates

- Adding .cadl file support
- Revert back changelog
- Rename to TypeSpec
- Update homepage link

## 0.40.0

Tue, 07 Feb 2023 21:56:17 GMT

_Version update only_

## 0.39.0

Fri, 13 Jan 2023 00:05:26 GMT

### Updates

- Internal: Update TS module resolution to node16
- Internal: package with newest vsce

## 0.38.0

Wed, 07 Dec 2022 17:21:52 GMT

### Patches

- Update dependencies

## 0.17.0

Sat, 12 Nov 2022 00:14:04 GMT

### Minor changes

- Extension lookup for a local cadl compiler first instead of a global

### Patches

- Internal: Fix loading VS Code extension unbundled in F5 dev scenario

## 0.16.1

Wed, 12 Oct 2022 21:12:35 GMT

### Patches

- Fix preference documentation for cadl-server path configuration

## 0.16.0

Thu, 08 Sep 2022 01:04:53 GMT

### Minor changes

- Add support for `${workspaceFolder}` interpolation in configuration. As `workspaceRoot` is deprecated by VSCode

### Patches

- Allow cadl.restartServer command to work when no .cadl file has been opened

## 0.15.2

Thu, 11 Aug 2022 19:05:23 GMT

### Patches

- Providing `cadl.cadl-server.path` option will force the specified compiler to be used

## 0.15.1

Fri, 08 Jul 2022 23:22:58 GMT

_Version update only_

## 0.15.0

Mon, 13 Jun 2022 23:42:28 GMT

### Minor changes

- Update tmLanguage grammar for operation signature support
- Add semantic colorization

### Patches

- Improve error reporting when cadl-server is not found
- Resolve issue with `language-configuration.json` being excluded from extension

### Updates

- Upgrade to TS4.7

## 0.14.0

Fri, 06 May 2022 17:19:57 GMT

### Minor changes

- Color decorators differently than operations
- Uptake `mixes` -> `extends` rename
- Update `language-configuration.json` to newer format and generate it from cadl language server data
- Remove node 14 support
- Add command to restart language server

## 0.13.1

Thu, 31 Mar 2022 17:10:49 GMT

_Version update only_

## 0.13.0

Wed, 09 Mar 2022 17:42:09 GMT

### Minor changes

- Allow `op` interfaces
- Add punctuation and additional fine grain scopes to grammar

## 0.12.1

Mon, 14 Feb 2022 03:01:08 GMT

### Patches

- Bump dependency versions

## 0.12.0

Fri, 04 Feb 2022 18:00:18 GMT

### Minor changes

- Add cadl project file to list of files watched

## 0.11.0

Wed, 01 Dec 2021 22:56:11 GMT

### Minor changes

- Add syntax highlighting code-fenced cadl blocks in markdown

### Patches

- Fix colorization of multiple mixes
- Fix syntax highlighting of namespace-qualified decorator application
- Update README

## 0.10.0

Thu, 11 Nov 2021 21:46:21 GMT

### Minor changes

- **Change** `cadl.cadl-server.path` should point to the `@cadl-lang/compiler` package instead of `cadl-server` binary.

## 0.9.0

Fri, 15 Oct 2021 21:33:37 GMT

### Minor changes

- **Added** Language server support for directives
- Add colorization for interfaces
- Add colorization of union declarations

## 0.8.0

Tue, 10 Aug 2021 20:23:04 GMT

### Minor changes

- React to package renames

## 0.7.0

Mon, 02 Aug 2021 18:17:00 GMT

### Minor changes

- Rename ADL to Cadl

## 0.6.0

Fri, 09 Jul 2021 20:21:06 GMT

### Minor changes

- Add semantic analysis to language server

## 0.5.2

Thu, 24 Jun 2021 03:57:43 GMT

### Patches

- Handle untitled source files in VS Code

## 0.5.1

Tue, 18 May 2021 23:43:31 GMT

### Patches

- Fix issue launching adl-server on Mac OS

## 0.5.0

Thu, 06 May 2021 14:56:02 GMT

### Minor changes

- Implement alias and enum, remove model =

### Patches

- Update syntax highlighting for string literal change

## 0.4.5

Tue, 20 Apr 2021 15:23:29 GMT

### Patches

- Fix syntax highlighting for tuple expressions

## 0.4.4

Wed, 31 Mar 2021 22:00:43 GMT

### Patches

- Add syntax highlighting for import and using statements
- Add VS Code configuration option for adl-server path
- Use PList for textmate grammar

## 0.4.3

Fri, 26 Mar 2021 17:06:33 GMT

### Patches

- Fix commenting and indenting behaviors

## 0.4.2

Wed, 24 Mar 2021 18:40:21 GMT

### Patches

- Extract textmate generator to helper library

## 0.4.1

Tue, 23 Mar 2021 01:06:29 GMT

### Patches

- Remove unnecessary npm dependency

## 0.4.0

Tue, 16 Mar 2021 23:13:42 GMT

### Minor changes

- Introduce language server and add live parse errors to VS Code

### Patches

- Initial version of VS Code extension
