# Change Log - typespec-vs

## 0.59.0

### Bug Fixes

- [#4115](https://github.com/microsoft/typespec/pull/4115) Fixed a router bug where paths would sometimes fail to match after a parameter was bound.


## 0.58.0

No changes, version bump only.

## 0.57.0

### Features

- [#3461](https://github.com/microsoft/typespec/pull/3461) Support Arm64


## 0.56.0

No changes, version bump only.

## 0.55.0

No changes, version bump only.

## 0.54.0

### Bump dependencies

- [#2900](https://github.com/microsoft/typespec/pull/2900) Update dependencies


## 0.53.0


## 0.52.1

Wed, 24 Jan 2024 05:46:53 GMT

_Version update only_

## 0.52.0

Wed, 24 Jan 2024 05:46:53 GMT

_Version update only_

## 0.51.0

Wed, 06 Dec 2023 19:40:58 GMT

_Version update only_

## 0.50.0

Wed, 08 Nov 2023 00:07:17 GMT

### Updates

- `TypeScript` use `types` entry under `exports` of `package.json` instead of legacy `typesVersions` to provide the definition files
- **BREAKING CHANGE** Dropped support for node 16, minimum node version is now 18

## 0.49.0

Wed, 11 Oct 2023 23:31:35 GMT

_Version update only_

## 0.48.0

Tue, 12 Sep 2023 21:47:11 GMT

_Version update only_

## 0.47.0

Tue, 08 Aug 2023 22:32:10 GMT

_Version update only_

## 0.46.0

Tue, 11 Jul 2023 22:06:00 GMT

_Version update only_

## 0.45.0

Tue, 06 Jun 2023 22:44:16 GMT

_Version update only_

## 0.44.0

Wed, 10 May 2023 21:24:00 GMT

_Version update only_

## 0.43.0

Tue, 11 Apr 2023 18:49:17 GMT

_Version update only_

## 0.42.0

Mon, 13 Mar 2023 21:30:44 GMT

_Version update only_

## 0.41.0

Fri, 03 Mar 2023 19:59:17 GMT

### Updates

- Adding .cadl file support and markdown code block fence support for tsp, cadl, and typespec
- Remove support for Visual Studio 2019
- Revert back changelog
- Rename to TypeSpec
- Update homepage link

## 0.40.0

Tue, 07 Feb 2023 21:56:17 GMT

### Updates

- Explicitly adding NewtonSoft.Json 13.0.2 to address vulnerability

## 0.39.0

Fri, 13 Jan 2023 00:05:26 GMT

_Version update only_

## 0.38.0

Wed, 07 Dec 2022 17:21:52 GMT

_Version update only_

## 0.9.0

Sat, 12 Nov 2022 00:14:04 GMT

### Minor changes

- Extension lookup for a local cadl compiler first instead of a global

## 0.8.0

Thu, 08 Sep 2022 01:04:53 GMT

### Minor changes

- Add support for `${workspaceFolder}` interpolation in configuration

### Patches

- Fix issue with configured cadl-server location not being found when opening a solution.

## 0.7.2

Thu, 11 Aug 2022 19:05:23 GMT

### Patches

- Providing `cadl.cadl-server.path` option will force the specified compiler to be used

## 0.7.1

Mon, 13 Jun 2022 23:42:28 GMT

### Patches

- Improve error reporting when cadl-server is not found

## 0.7.0

Fri, 06 May 2022 17:19:57 GMT

### Minor changes

- Remove node 14 support

## 0.6.2

Thu, 31 Mar 2022 17:10:49 GMT

### Patches

- Fix null ref in VS extension activation
- Customize VS output when language server activation fails

## 0.6.1

Wed, 09 Mar 2022 17:42:09 GMT

### Patches

- Remove debug assert for stderr output from language server

## 0.6.0

Fri, 04 Feb 2022 18:00:18 GMT

### Minor changes

- Add cadl project file to list of files watched

## 0.5.0

Thu, 16 Dec 2021 08:02:20 GMT

### Minor changes

- **Fix** Issues with resolving `cadl-server` path + added support for passing `cadl.cadl-server.path` setting via `.vs/VSWorkspaceSettings.json` file

## 0.4.3

Wed, 01 Dec 2021 22:56:11 GMT

### Patches

- Update README

## 0.4.2

Thu, 11 Nov 2021 21:46:21 GMT

### Patches

- Fix Visual Studio 2022 support

## 0.4.1

Fri, 15 Oct 2021 21:33:37 GMT

_Version update only_

## 0.4.0

Tue, 10 Aug 2021 20:23:04 GMT

### Minor changes

- Rename package to cadl-vs

## 0.3.0

Mon, 02 Aug 2021 18:17:00 GMT

### Minor changes

- Rename ADL to Cadl

## 0.2.0

Fri, 09 Jul 2021 20:21:06 GMT

### Minor changes

- Add semantic analysis to language server

### Patches

- Use LSP to log messages from client to server

## 0.1.6

Thu, 24 Jun 2021 03:57:43 GMT

### Patches

- Add support for Visual Studio 2022

## 0.1.5

Tue, 18 May 2021 23:43:31 GMT

_Version update only_

## 0.1.4

Thu, 06 May 2021 14:56:02 GMT

_Version update only_

## 0.1.3

Tue, 20 Apr 2021 15:23:29 GMT

### Patches

- Log messages from language server in output window pane
- Set .vsix version correctly

## 0.1.2

Tue, 06 Apr 2021 01:23:07 GMT

### Patches

- Improve debugging of VS extension itself

## 0.1.1

Wed, 31 Mar 2021 22:00:43 GMT

### Patches

- Initial release
