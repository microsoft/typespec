# Changelog - @typespec/http-canonicalization

## 0.16.3

No changes, version bump only.

## 0.16.2

### Bug Fixes

- [#11456](https://github.com/microsoft/typespec/pull/11456) Re-release to realign the `@typespec/emitter-framework` dependency (Alloy `0.24`). The previous `0.16.1` still required `@typespec/emitter-framework@^0.17.0` (Alloy `0.22`), which caused `npm` installs of `@typespec/http-server-csharp` to load two incompatible `@alloy-js/core` versions ("Multiple versions of Alloy are loaded").


## 0.16.1

### Bump dependencies

- [#9838](https://github.com/microsoft/typespec/pull/9838) Upgrade dependencies


## 0.16.0

### Bump dependencies

- [#9446](https://github.com/microsoft/typespec/pull/9446) Upgrade dependencies


## 0.15.0

### Breaking Changes

- [#9141](https://github.com/microsoft/typespec/pull/9141) Many other bug fixes, removals, and additions as described in this pull request: https://github.com/microsoft/typespec/pull/9141

### Bump dependencies

- [#9223](https://github.com/microsoft/typespec/pull/9223) Upgrade dependencies

### Bug Fixes

- [#9141](https://github.com/microsoft/typespec/pull/9141) Fix canonicalization of merge patch models.
- [#9141](https://github.com/microsoft/typespec/pull/9141) Remove metadata properties from wire types.


## 0.14.0

### Bump dependencies

- [#9046](https://github.com/microsoft/typespec/pull/9046) Upgrade dependencies


## 0.13.0

### Features

- [#8822](https://github.com/microsoft/typespec/pull/8822) Add experimental HTTP canonicalization utilities.

### Bump dependencies

- [#8823](https://github.com/microsoft/typespec/pull/8823) Upgrade dependencies

### Bug Fixes

- [#8833](https://github.com/microsoft/typespec/pull/8833) Add forgotten index file.
