# Change Log - @typespec/internal-build-utils

This log was last generated on Tue, 12 Sep 2023 21:47:11 GMT and should not be manually modified.

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

