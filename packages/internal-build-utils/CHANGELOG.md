# Change Log - @typespec/internal-build-utils

## 0.59.0

### Bump dependencies

- [#3948](https://github.com/microsoft/typespec/pull/3948) Update dependencies


## 0.58.0

### Bump dependencies

- [#3718](https://github.com/microsoft/typespec/pull/3718) Dependency updates July 2024


## 0.57.0

### Bump dependencies

- [#3401](https://github.com/microsoft/typespec/pull/3401) Update dependencies - May 2024


## 0.56.0

### Bump dependencies

- [#3169](https://github.com/microsoft/typespec/pull/3169) Update dependencies


## 0.55.0

### Bump dependencies

- [#3027](https://github.com/microsoft/typespec/pull/3027) Update dependencies


## 0.54.0

### Bug Fixes

- [#2914](https://github.com/microsoft/typespec/pull/2914) Bumping PR version will also update the dependencies to be an open range

### Bump dependencies

- [#2900](https://github.com/microsoft/typespec/pull/2900) Update dependencies


## 0.53.0

### Minor Changes

- 4329c78: Change prerelease version bump logic to work with pnpm instead of rush


## 0.52.0

Wed, 24 Jan 2024 05:46:53 GMT

### Updates

- Fix third party generation when there is invalid sourcemaps
- Add `runOrExit` helper to have a cleaner script runner without caring about the failure
- Update dependencies

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

### Updates

- Handle bumping version of prerelease packages
- Update dependencies

## 0.48.0

Tue, 12 Sep 2023 21:47:11 GMT

### Updates

- Add new command to be able to bump version for a PR

## 0.47.0

Tue, 08 Aug 2023 22:32:10 GMT

_Version update only_

## 0.46.0

Tue, 11 Jul 2023 22:06:00 GMT

### Minor changes

- Include previous patch number in dev version count to ensure patches get released in the dev versions

### Patches

- Fix bumping dev version if there is zero changes

### Updates

- Fix repo name in package.json
- Update dependencies

## 0.4.2

Tue, 06 Jun 2023 22:44:16 GMT

### Patches

- Packages with no changes will still release a -dev.0

## 0.4.1

Wed, 10 May 2023 21:24:00 GMT

### Patches

- Make dev version dependency range compatible with other dev versions
- Update dependencies

## 0.4.0

Fri, 03 Mar 2023 19:59:17 GMT

### Minor changes

- Rename to TypeSpec

### Updates

- Revert back changelog
- Update homepage link

## 0.3.3

Fri, 13 Jan 2023 00:05:26 GMT

### Patches

- Update preview release script to work with pinned versions

## 0.3.2

Wed, 07 Dec 2022 17:21:52 GMT

### Patches

- Mark watch options as optional
- Update dependencies

## 0.3.1

Thu, 11 Aug 2022 19:05:23 GMT

_Version update only_

## 0.3.0

Mon, 13 Jun 2022 23:42:28 GMT

### Minor changes

- Dotnet tools allow enforcing dotnet as a requirement and make skipping optional
- Bump minimum dotnet version to dotnet6.0

### Patches

- Improve logging of dotnet errors
- Fix prerelease publishing for packages with no changes.

### Updates

- Upgrade to TS4.7

## 0.2.0

Fri, 06 May 2022 17:19:57 GMT

### Minor changes

- Make RunOptions optional
- Add new util `runDotnetFormat`
- Add logic to publish preview package versions

### Patches

- Add `xplatCmd` helper method
