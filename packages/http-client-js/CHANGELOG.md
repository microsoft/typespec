# Changelog - @typespec/http-client-js

## 0.10.0

### Bug Fixes

- [#8613](https://github.com/microsoft/typespec/pull/8613) Remove warning when no explicit content type is provided to a multipart part


## 0.9.0

### Features

- [#8145](https://github.com/microsoft/typespec/pull/8145) Enable component overrides for extensibility

### Bump dependencies

- [#8317](https://github.com/microsoft/typespec/pull/8317) Upgrade dependencies

### Bug Fixes

- [#8362](https://github.com/microsoft/typespec/pull/8362) Upgrade alloy to 0.20


## 0.8.0

### Bump dependencies

- [#8050](https://github.com/microsoft/typespec/pull/8050) Upgrade alloy 0.19
- [#7978](https://github.com/microsoft/typespec/pull/7978) Upgrade dependencies

### Bug Fixes

- [#8056](https://github.com/microsoft/typespec/pull/8056) Fix the missing `main` field issue in package.json


## 0.7.0

### Bump dependencies

- [#7655](https://github.com/microsoft/typespec/pull/7655) Upgrade to alloy 0.18.0
- [#7674](https://github.com/microsoft/typespec/pull/7674) Upgrade dependencies

### Bug Fixes

- [#6477](https://github.com/microsoft/typespec/pull/6477) Bypass nested paging compile issue

## 0.6.0

### Features

- [#7039](https://github.com/microsoft/typespec/pull/7039) Export some of the components for reuse.
- [#7409](https://github.com/microsoft/typespec/pull/7409) Emit TypeSpec comments as JSDoc in TypeScript components

### Bump dependencies

- [#7605](https://github.com/microsoft/typespec/pull/7605) Updates alloy to 0.17
- [#7363](https://github.com/microsoft/typespec/pull/7363) Upgrade alloy 16
- [#7323](https://github.com/microsoft/typespec/pull/7323) Upgrade dependencies

### Bug Fixes

- [#7194](https://github.com/microsoft/typespec/pull/7194) Emit correct diagnostic for unsupported API key auth

## 0.5.0

### Bump dependencies

- [#7186](https://github.com/microsoft/typespec/pull/7186) Upgrade to alloy 15

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
