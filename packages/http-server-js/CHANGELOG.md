# Changelog - @typespec/http-server-js

## 0.58.0-alpha.11

### Features

- [#6447](https://github.com/microsoft/typespec/pull/6447) Return data stubs from scaffolded controllers
- [#6327](https://github.com/microsoft/typespec/pull/6327) Remove reference to delete projection feature

### Bump dependencies

- [#6266](https://github.com/microsoft/typespec/pull/6266) Update dependencies

### Bug Fixes

- [#6411](https://github.com/microsoft/typespec/pull/6411) Add support for new `dryRun` emitter option


## 0.58.0-alpha.10

### Features

- [#5996](https://github.com/microsoft/typespec/pull/5996) Emitter Framework V2
- [#6164](https://github.com/microsoft/typespec/pull/6164) Renamed package `@typespec/http-server-javascript` to `@typespec/http-server-js`.
- [#6006](https://github.com/microsoft/typespec/pull/6006) Implement Swagger UI support when generating Express server model.


## 0.58.0-alpha.9

### Features

- [#5906](https://github.com/microsoft/typespec/pull/5906) Implement basic project scaffolding.


## 0.58.0-alpha.8

### Bump dependencies

- [#5690](https://github.com/microsoft/typespec/pull/5690) Upgrade dependencies


## 0.58.0-alpha.7

### Features

- [#5514](https://github.com/microsoft/typespec/pull/5514) - Implemented new-style multipart request handling.
- Fixed JSON serialization/deserialization in some cases where models that required serialization occurred within arrays.


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



