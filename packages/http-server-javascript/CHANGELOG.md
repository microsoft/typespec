# Changelog - @typespec/http-server-javascript

## 0.58.0-alpha.6

### Bug Fixes

- [#5253](https://github.com/microsoft/typespec/pull/5253) Added an additional check for the presence of a property before performing a bounds check on integer properties constrained to a range.
- [#5253](https://github.com/microsoft/typespec/pull/5253) Fixed a null check in query parameter requiredness check by replacing it with a falseness check.
- [#5188](https://github.com/microsoft/typespec/pull/5188) Added logic to handle "unspeakable" identifier names (#5185)


## 0.58.0-alpha.5

### Bump dependencies

- [#4679](https://github.com/microsoft/typespec/pull/4679) Upgrade dependencies - October 2024

### Features

- [#4761](https://github.com/microsoft/typespec/pull/4761) Add `@cookie` decorator to specify cookie parameters


## 0.58.0-alpha.4

### Bump dependencies

- [#4424](https://github.com/microsoft/typespec/pull/4424) Bump dependencies


## 0.58.0-alpha.3

No changes, version bump only.

## 0.58.0-alpha.2

### Bug Fixes

- [#3933](https://github.com/microsoft/typespec/pull/3933) Fix some diagnostic not showing the right message
- [#4101](https://github.com/microsoft/typespec/pull/4101) Fixed enum representation, an edge case with optional parameter joining, and a couple of type errors around query/header params.
- [#4115](https://github.com/microsoft/typespec/pull/4115) Fixed a router bug where paths would sometimes fail to match after a parameter was bound.

### Bump dependencies

- [#3948](https://github.com/microsoft/typespec/pull/3948) Update dependencies



