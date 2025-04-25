# Changelog - @typespec/http-client-js

## 0.4.0

### Features

- [#6875](https://github.com/microsoft/typespec/pull/6875) Upgrade to alloy 0.10.0
- [#6709](https://github.com/microsoft/typespec/pull/6709) Add support for OAuth2 authentication scheme
- [#6725](https://github.com/microsoft/typespec/pull/6725) Add paging support

### Bump dependencies

- [#7017](https://github.com/microsoft/typespec/pull/7017) Alloy 0.11

### Bug Fixes

- [#6899](https://github.com/microsoft/typespec/pull/6899) Fix File serialization issue and enable building e2e tests


## 0.3.0

### Bump dependencies

- [#6595](https://github.com/microsoft/typespec/pull/6595) Upgrade dependencies

## 0.2.0

### Deprecations

- [#6306](https://github.com/microsoft/typespec/pull/6306) Remove the use of deprecated getDiscriminatedUnion

### Features

- [#6178](https://github.com/microsoft/typespec/pull/6178) Introducing the JS Http Client emitter

### Bug Fixes

- [#6460](https://github.com/microsoft/typespec/pull/6460) Update dependency structure for EmitterFramework, HttpClient and JS Emitter
- [#6390](https://github.com/microsoft/typespec/pull/6390) Fix Multipart handling for model with @body
- [#6348](https://github.com/microsoft/typespec/pull/6348) handle model property references in union types correctly
- [#6286](https://github.com/microsoft/typespec/pull/6286) Replace @discriminator union with @discriminated
