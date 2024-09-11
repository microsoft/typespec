# Change Log - @typespec/openapi

## 0.60.0

### Features

- [#4139](https://github.com/microsoft/typespec/pull/4139) Internals: Migrate to new api for declaring decorator implementation


## 0.59.0

### Bump dependencies

- [#3948](https://github.com/microsoft/typespec/pull/3948) Update dependencies


## 0.58.0

### Bump dependencies

- [#3718](https://github.com/microsoft/typespec/pull/3718) Dependency updates July 2024

### Features

- [#3626](https://github.com/microsoft/typespec/pull/3626) Adds public function for setting info object


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

### Bump dependencies

- [#2900](https://github.com/microsoft/typespec/pull/2900) Update dependencies

### Features

- [#2902](https://github.com/microsoft/typespec/pull/2902) Add support for all properties of openapi `info` object on the `@info` decorator


## 0.53.0

### Patch Changes



## 0.52.0

Wed, 24 Jan 2024 05:46:53 GMT

### Updates

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

- Removes `@typespec/rest` as a `peerDependency`. Relates to #2391
- Add support for http status code ranges
- Changed namespace from `OpenAPI` to `TypeSpec.OpenAPI`.
- Update dependencies

## 0.48.0

Tue, 12 Sep 2023 21:47:11 GMT

_Version update only_

## 0.47.0

Tue, 08 Aug 2023 22:32:10 GMT

### Updates

- Add new `@info` decorator providing the ability to specify the additional fields from openapi info object.

## 0.46.0

Tue, 11 Jul 2023 22:06:00 GMT

### Updates

- Fix repo name in package.json
- Update dependencies

## 0.45.0

Tue, 06 Jun 2023 22:44:16 GMT

### Updates

- Update decorators to use `valueof`

## 0.44.0

Wed, 10 May 2023 21:24:00 GMT

### Updates

- Update decorator declaration to use `Model` instead of `object`
- Update dependencies

## 0.43.0

Tue, 11 Apr 2023 18:49:17 GMT

_Version update only_

## 0.42.0

Mon, 13 Mar 2023 21:30:44 GMT

_Version update only_

## 0.41.0

Fri, 03 Mar 2023 19:59:17 GMT

### Updates

- Revert back changelog
- Use new `@typespec/http` library
- Update package.json entrypoint to tspMain
- Rename to TypeSpec
- Update homepage link

## 0.40.0

Tue, 07 Feb 2023 21:56:17 GMT

_Version update only_

## 0.39.0

Fri, 13 Jan 2023 00:05:26 GMT

_Version update only_

## 0.38.0

Wed, 07 Dec 2022 17:21:52 GMT

### Minor changes

- Internal: update to use new `getTypeName` and `getNamespaceString` helper
- Add support for multiple services
- Uptake changes to compiler api with new `scalar` type

### Patches

- Add cadl docs on decorators
- Update dependencies

## 0.14.0

Sat, 12 Nov 2022 00:14:04 GMT

### Minor changes

- Declare decorators in cadl using `extern dec`

## 0.13.0

Wed, 12 Oct 2022 21:12:35 GMT

### Minor changes

- Implement automatic visibility transformations

### Patches

- Remove workaround for issue with `KeysOf` https://github.com/microsoft/cadl/issues/462
- Add/update docs for openapi3 emitter

## 0.12.0

Thu, 08 Sep 2022 01:04:53 GMT

### Minor changes

- Update decororator state key to allow multiple instance of library to work together.
- React to Type suffix removal

### Patches

- Api: Operation id resolver takes projection into account

## 0.11.0

Thu, 11 Aug 2022 19:05:23 GMT

### Minor changes

- Uptake changes to type relations
- Inline generic instantiations without `@friendlyName`
- Added helper to resolve operation id
- Internal: Uptake new compiler helpers to work with template types

## 0.10.1

Fri, 08 Jul 2022 23:22:57 GMT

_Version update only_

## 0.10.0

Mon, 13 Jun 2022 23:42:28 GMT

### Minor changes

- Uptake changes to decorator context

### Updates

- Upgrade to TS4.7

## 0.9.0

Fri, 06 May 2022 17:19:57 GMT

### Minor changes

- Move decorators into `OpenAPI` namespace
- Remove node 14 support
- Add shared helpers for OpenAPI 2 and 3 emit

## 0.8.0

Thu, 31 Mar 2022 17:10:49 GMT

### Minor changes

- Update `@extension` to allow value to be a complex object or array
- `@defaultResponse` set status code for model

## 0.7.0

Wed, 09 Mar 2022 17:42:09 GMT

### Minor changes

- **Added** `@externalDocs` decorator to specify `externalDocs` OpenAPI field

## 0.6.1

Tue, 15 Feb 2022 22:35:02 GMT

_Version update only_

## 0.6.0

Mon, 14 Feb 2022 03:01:07 GMT

### Minor changes

- refactor status code handling to http library
- Validate `@extension` decorator extension name start with `x-`
- Update decorators to take in api change

### Patches

- Bump dependency versions

## 0.5.1

Fri, 04 Feb 2022 18:00:18 GMT

_Initial release_
