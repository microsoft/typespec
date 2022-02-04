# Change Log - @cadl-lang/openapi3

This log was last generated on Fri, 04 Feb 2022 17:53:43 GMT and should not be manually modified.

## 0.6.0
Fri, 04 Feb 2022 17:53:43 GMT

### Minor changes

- Support union values for status-code and content-type in responses
- Openapi3 support for discriminated unions
- openapi3 emitter support for @error decorator
- Configure for new emitter syntax
- Internals: switch to internal path manipulation
- Extracted decorators into own library `@cadl-lang/openapi`
- Uptake changes in @cadl-lang/rest library improving operation parameter handling
- Update cadl depdendencies to peerDependencies
- Add support for versioned services
- Add statusCode decorator for http status code

### Patches

- Adding @format decorator support for openapi3 to emit "format" for string types
- **Fix** Added support for nullable array `xzy[] | null`
- **Fix** issue with @body body: bytes producing `type: string, format: bytes` instead of `type: string, format: binary` for requests and responses
- Use assigned @friendlyName on model types when emitting schema definitions and refs
- Refactor and improve openapi3 return type tests
- Fix status code validation and other minor cleanup
- Support nullable in openapi3 emitter
- Renaming @format decorator to @pattern.

## 0.5.0
Thu, 16 Dec 2021 08:02:20 GMT

### Minor changes

- Generate anyOf or oneOf schemas for Cadl unions in openapi3

### Patches

- Update openapi3 emitter to consume new Cadl.Rest route generation API

## 0.4.2
Wed, 01 Dec 2021 22:56:11 GMT

### Patches

- Add support for extension decorator on parameters and tests
- Add openapi3 support for Cadl safeint
- Add README

## 0.4.1
Thu, 18 Nov 2021 13:58:15 GMT

### Patches

- Enable operation generation from interfaces

## 0.4.0
Thu, 11 Nov 2021 21:46:21 GMT

### Minor changes

- **Added** Support for duration type

## 0.3.1
Thu, 28 Oct 2021 21:17:50 GMT

### Patches

- Use strict diagnostics
- Fix crash on empty enum in openapi3 emitter
- Set shared param definitions in components.parameters
- Fix param default to be in schema
- Fix handling of decorators on parameters in openapi3
- Fix generation of openapi3 response headers
- Define response body for primitive response type
- Remove management.azure.com service host default

## 0.3.0
Fri, 15 Oct 2021 21:33:37 GMT

### Minor changes

- **Added** Support for server default

## 0.2.0
Fri, 17 Sep 2021 00:49:37 GMT

### Minor changes

- Add emitter for OpenAPI 3.0
- Remove support for multiple inheritance

### Patches

- Adding changelog for openapi3 package
- Updates for cadl namespace addition
- This is a test
- Support for emitting `bytes` and new number types

