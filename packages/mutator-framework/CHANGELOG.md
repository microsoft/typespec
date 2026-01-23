# Changelog - @typespec/mutator-framework

## 0.15.0

### Breaking Changes

- [#9141](https://github.com/microsoft/typespec/pull/9141) Many other bug fixes, removals, and additions as described in this pull request: https://github.com/microsoft/typespec/pull/9141
- [#9141](https://github.com/microsoft/typespec/pull/9141) Fix mutations not handling linkage to parent types (e.g. model property -> model). Remove mutation subgraph, nodes are now unique per (type, key) pair. Remove reference mutations, use a distinct key for references if needed.

### Bump dependencies

- [#9223](https://github.com/microsoft/typespec/pull/9223) Upgrade dependencies


## 0.14.0

### Features

- [#9133](https://github.com/microsoft/typespec/pull/9133) Add `EnumMutation` and `EnumMemberMutation` to the Mutator Framework

### Bump dependencies

- [#9046](https://github.com/microsoft/typespec/pull/9046) Upgrade dependencies


## 0.13.0

### Features

- [#8822](https://github.com/microsoft/typespec/pull/8822) Add experimental mutator framework.

### Bump dependencies

- [#8823](https://github.com/microsoft/typespec/pull/8823) Upgrade dependencies
