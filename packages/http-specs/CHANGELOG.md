# @typespec/http-specs

## 0.1.0-alpha.17

No changes, version bump only.

## 0.1.0-alpha.16

### Bug Fixes

- [#6565](https://github.com/microsoft/typespec/pull/6565) Fix specs to handle body correctly with new spector change
- [#6533](https://github.com/microsoft/typespec/pull/6533) Update outdated multipart cases

### Bump dependencies

- [#6595](https://github.com/microsoft/typespec/pull/6595) Upgrade dependencies


## 0.1.0-alpha.15

### Bug Fixes

- [#6521](https://github.com/microsoft/typespec/pull/6528) Add explicit `application/json` content type for some test cases to avoid wrong content type inferred from http lib.


## 0.1.0-alpha.14

### Bug Fixes

- [#6521](https://github.com/microsoft/typespec/pull/6521) Fix response scenarios


## 0.1.0-alpha.13

### Breaking Changes

- [#6361](https://github.com/microsoft/typespec/pull/6361) Remove tsv test and migrate ssv/pipes test of collection format.

### Bug Fixes

- [#6464](https://github.com/microsoft/typespec/pull/6464) Suppress implicit multipart deprecation for this release
- [#6425](https://github.com/microsoft/typespec/pull/6425) Remove SpreadRecordForDiscriminatedUnion case


## 0.1.0-alpha.12

### Features

- [#6327](https://github.com/microsoft/typespec/pull/6327) Remove reference to delete projection feature
- [#6201](https://github.com/microsoft/typespec/pull/6201) Add tests for basic jsonl streaming.

### Bump dependencies

- [#6266](https://github.com/microsoft/typespec/pull/6266) Update dependencies

### Bug Fixes

- [#6286](https://github.com/microsoft/typespec/pull/6286) Replace @discriminator union with @discriminated

## 0.1.0-alpha.11

### Features

- [#6140](https://github.com/microsoft/typespec/pull/6140) all parameters including headers and queries shall be passed when next call for continuation token paging

## 0.1.0-alpha.10

### Bug Fixes

- [#6013](https://github.com/microsoft/typespec/pull/6013) Fixed paths in the specs/routes.

### Features

- [#6038](https://github.com/microsoft/typespec/pull/6038) Add test case for continuationtoken paging

## 0.1.0-alpha.9

### Bug Fixes

- [#5717](https://github.com/microsoft/typespec/pull/5717) Fixed paths in the specs/routes.
- [#5875](https://github.com/microsoft/typespec/pull/5875) Upgrade to new `@visibility` syntax

### Bump dependencies

- [#5690](https://github.com/microsoft/typespec/pull/5690) Upgrade dependencies

### Features

- [#5577](https://github.com/microsoft/typespec/pull/5577) Add test case on status code range

## 0.1.0-alpha.8

### Bug Fixes

- [#5717](https://github.com/microsoft/typespec/pull/5717) Fixed paths in the specs/routes.

## 0.1.0-alpha.7

No changes, version bump only.

## 0.1.0-alpha.6

### Bug Fixes

- [#5545](https://github.com/microsoft/typespec/pull/5545) remove unsupported pageable things
- [#5401](https://github.com/microsoft/typespec/pull/5401) fix missing `@list` decorator for unbranded pageable operation

## 0.1.0-alpha.5

### Bug Fixes

- [#5049](https://github.com/microsoft/typespec/pull/5049) Fix dotnet compatibility failure in http-specs
- [#5184](https://github.com/microsoft/typespec/pull/5184) Fix api-key mockapi
- [#5217](https://github.com/microsoft/typespec/pull/5217) update code in versioning/removed and removed type/model/templated.

### Features

- [#5211](https://github.com/microsoft/typespec/pull/5211) add link case of server driven pagination test
- [#5210](https://github.com/microsoft/typespec/pull/5210) add none visibility test

## 0.1.0-alpha.4

- Update Versioning/Removed Project And Removed Type/Model/Templated. Please refer [PR #5217](https://github.com/microsoft/typespec/pull/5217) for further details.

## 0.1.0-alpha.3

- Create coverages container if not existing

## 0.1.0-alpha.2

- Minor `api-key` in the `authentication` specs

## 0.1.0-alpha.1

No changes, version bump only.
