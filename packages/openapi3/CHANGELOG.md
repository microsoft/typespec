# Change Log - @typespec/openapi3

This log was last generated on Tue, 19 Sep 2023 19:28:32 GMT and should not be manually modified.

## 0.48.1
Tue, 19 Sep 2023 19:28:32 GMT

### Patches

- Fix: Correctly generate discriminated union mapping property with multiple visibilities involved

## 0.48.0
Tue, 12 Sep 2023 21:47:11 GMT

### Updates

- Fixed issue where parameters on a PATCH request marked with visibility "create" did not appear.
- Changed yaml parser from `js-yaml` to `yaml`
- Fix: `exclusiveMinimum` and `exclusiveMaximum` properties are booleans in openapi3
- Use `anyOf` instead of `oneOf` for shared route with different request/response bodies
- Fix handling of `Record<T>` in `model is` and `model extends`

## 0.47.0
Tue, 08 Aug 2023 22:32:10 GMT

### Updates

- Handle general encodings for utcDateTime
- Add support for  `@info` decorator providing the ability to specify the additional fields from openapi info object.
- Emit diagnostic for empty unions
- Fix: Apply `@minItems` and `@maxItems` decorators on model array.
- Fix `@useRef` decorator serializing `$ref` as an object.
- Support collection formats: simple, form, ssv and pipes.

## 0.46.0
Tue, 11 Jul 2023 22:06:00 GMT

### Updates

- Omitting `x-typespec-name` extension by default from openapi3 output. A new flag `include-x-typespec-name: "inline-only" | "never"` has been added to get previous behavior.
- Update dependencies

## 0.45.0
Tue, 06 Jun 2023 22:44:16 GMT

### Updates

- Support decimal and decimal128 scalar types.
- Uptake doc comment changes. Standard built-in scalar will not have the description included as they are inlined.
- Add description to emitter options
- Update decorators signature to use `{}` instead of `object`
- Fix: Documentation on `model is x[]` was not included in schema description
- Fix: `@encode` encoding doesn't override target type format
- Fix: Encoding resolution for model properties and add back `unixtime`
- Fix: derived scalar doc ignored
- Add signature for missing decorators
- Add handling of `integer`, `float` and `numeric`

## 0.44.0
Wed, 10 May 2023 21:24:00 GMT

### Updates

- **Added** support for `@encode` decorator
- Fix openapi3 emitter to mark request body required
- Support multiple responses for the same status code and content type.
- Fix issue where shared request bodies did not emit correctly.
- Update decorator declaration to use `Model` instead of `object`
- Update dependencies

## 0.43.0
Tue, 11 Apr 2023 18:49:17 GMT

### Updates

- Support shared routes.
- Update to use new `interpolatePath` logic to resolve the `output-file`
- Add tests for overloads within interfaces
- Support new datetime types

## 0.42.0
Mon, 13 Mar 2023 21:30:44 GMT

### Updates

- Avoid Read suffix in schemas split by visibility.

## 0.41.0
Fri, 03 Mar 2023 19:59:17 GMT

### Updates

- Support additionalProperties
- Stop treating models spread into parameters as unreferenced.
- Revert back changelog
- Use new `@typespec/http` library
- Update package.json entrypoint to tspMain
- Rename to TypeSpec
- Update homepage link

## 0.40.0
Tue, 07 Feb 2023 21:56:17 GMT

### Patches

- Convert Ref objects to ref string in OpenAPI YAML output

### Updates

- Fix issue where operation parameters could not target a ModelProperty.
- Sort OpenAPI 3 output
- Don't emit extra "canonical" model when always impacted by visibility

## 0.39.0
Fri, 13 Jan 2023 00:05:26 GMT

### Patches

- Emit style & explode per encoding options
- Generate recursive update schemas with optional properties for resource update operation

### Updates

- Add support for emitting exclusiveMinimum and exclusiveMaximum based on the corresponding decorators
- **Breaking Change** Add yaml serialization for openapi output. Default has been changed to yaml. Use `file-type: json` or `output-file: myfile.json` to use json

## 0.38.0
Wed, 07 Dec 2022 17:21:52 GMT

### Minor changes

- Omit metadata properties of type `never`
- Internal: update to use new `getTypeName` and `getNamespaceString` helper
- Uptake change to `onEmit` signature
- **Breaking change** using new built-in `emitter-output-dir` option instead of custom `output-dir`.
- Add support for multiple services
- Uptake changes to compiler api to support Scalars
- Add support for renamed `url` scalar
- Uptake changes to rest library api

### Patches

- Emit 'deprecated' operation property in openapi3
- Internal: Update tests to change from `emitters` compiler options to `emit` and `options`
- Fix: Respect `@header` and `@query` over the wire name
- Update dependencies

### Updates

- Remove undocumented use of atVersion projection

## 0.17.0
Sat, 12 Nov 2022 00:14:04 GMT

### Minor changes

- Declare decorators in cadl using `extern dec`
- Feature: Add support for `unknown`

### Patches

- Fix: @extension on a model is intrinsic types are being applied

## 0.16.0
Wed, 12 Oct 2022 21:12:35 GMT

### Minor changes

- Use new `getDiscriminatedUnion` helper from compiler
- Empty object as a response will not produce a 204 response anymore
- Implement automatic visibility transformations
- Add support for `@minItems` and `@maxItems` decorators
- Add support for referencing model properties.
- Emitted openapi3 document include all types under the service namespace
- Uptake move of  `@discriminator` into compiler
- Add `output-dir` emitter option
- Add support for overloads(Using `@overload` decorator)
- Uptake changes to rest library

### Patches

- Fix: Response headers are marked as required unless optional
- Fix: `Content-Type` request header lookup is case insensitive
- Exclude properties of type `never` when emitting model schemas

## 0.15.0
Thu, 08 Sep 2022 01:04:53 GMT

### Minor changes

- Uptake change to enum members map type 
- Use projectedName projection for `json` to get the real over the wire properties.
- Uptake changes to compiler with current projection
- Update decororator state key to allow multiple instance of library to work together.
- React to Type suffix removal
- Support more kinds of unions, fix various union bugs, and add support for @discriminator on unions
- Uptake changes to http service authentication oauth2 scopes

### Patches

- Add support for `@extension` on Server variables

## 0.14.0
Thu, 11 Aug 2022 19:05:23 GMT

### Minor changes

- Added support for default value for properties with enum type.
- Use authentication configured via `@useAuth` http decorator
- Add new emitter option `new-line` to configure emitted line endings
- Uptake changes to type relations
- Support set of unannotated parameters as request body
- Inline generic instantiations without `@friendlyName`
- Uptake new `resolveOperationId` helper from openapi library improving the logic
- Add warning if there is no exposed routes
- Internal: Uptake new compiler helpers to work with template types

### Patches

- Fix: Description being ignored on non-string primitive models
- Fix uninitialized parent namespaces in projection
- Run projections on types returned from getEffectiveType
- fix infinite recursion with self referencing model
- Remove `summary` property set on schemas
- Make response descriptions more consistent

### Updates

- Update Readme.md for new decorators.

## 0.13.0
Fri, 08 Jul 2022 23:22:57 GMT

### Minor changes

- Emitter can take `outputFile` as an option
- Rename emitter options to be `kebab-case`

### Patches

- Inline parameters spread from anonymous model

## 0.12.0
Mon, 13 Jun 2022 23:42:28 GMT

### Minor changes

- Uptake changes to @cadl-lang/rest libraries around accessor
- Uptake changes to decorator context
- Add support for new @server decorator used to specify api endpoints.
- Find good names where possible for anonymous models that differ from named models only by properties that are not part of the schema
- Uptake changes to versioning library using enums for version

### Updates

- Upgrade to TS4.7

## 0.11.0
Fri, 06 May 2022 17:19:57 GMT

### Minor changes

- Uptake change in compiler with children references
- Move decorators to `OpenAPI` namespace
- Uptake change to versioning library
- Remove node 14 support

### Patches

- Fix issue not excluding template models from derived models causing crash
- Fix duplicate `description` in parameters
- Rearrange some aspects of operation output in the OpenAPI emitter
- URI-encode refs

## 0.10.0
Thu, 31 Mar 2022 17:10:49 GMT

### Minor changes

- Include discriminator property in base schema with a boilerplace description
- Add support for `void` type
- Moved http response interpretation to @cadl-lang/rest library.
- implement multiple response content types
- Uptake change to allow versioned dependency with unversioned service

### Patches

- Fix bug with number enums that reference `0`.
- Use parent .model of ModelTypeProperty
- Support browser builds

## 0.9.0
Wed, 09 Mar 2022 17:42:09 GMT

### Minor changes

- @doc and @summary will set the description and summary on extended primitive types
- Emit child models to OpenAPI when parent is emitted
- **Added** support for `@externalDocs` decorator
- Added support for `@knownValues` decorator
- @doc on service namespace set openapi description
- Uptake change to intrinsic types
- Fix issue where a model name the same as Cadl Intrinsic type would be treated the same.

### Patches

- Fix duplicate parameter type definitions in OpenAPI 3 output

## 0.8.0
Tue, 15 Feb 2022 22:35:02 GMT

### Minor changes

- Add validation to oneOf decorator

### Patches

- Add support for separate `@summary` from `@doc`

## 0.7.0
Mon, 14 Feb 2022 03:01:07 GMT

### Minor changes

- refactor status code handling to http library
- Take change in openapi upstream library
- Update decorators to take in api change

### Patches

- Bump dependency versions

## 0.6.0
Fri, 04 Feb 2022 18:00:18 GMT

### Minor changes

- Support union values for status-code and content-type in responses
- Openapi3 support for discriminated unions
- openapi3 emitter support for @error decorator
- Configure for new emitter syntax
- Internals: switch to internal path manipulation
- Extracted decorators into own library `@cadl-lang/openapi`
- Uptake changes in @cadl-lang/rest library improving operation parameter handling
- Update cadl dependencies to peerDependencies
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

