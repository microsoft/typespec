# Change Log - @cadl-lang/openapi

This log was last generated on Wed, 12 Oct 2022 21:12:35 GMT and should not be manually modified.

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

