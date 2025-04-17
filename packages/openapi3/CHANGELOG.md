# Change Log - @typespec/openapi3

## 1.0.0-rc.0

### Breaking Changes

- [#6557](https://github.com/microsoft/typespec/pull/6557) Remove support for removed feature implicit multipart.
- [#6563](https://github.com/microsoft/typespec/pull/6563) Separate file bodies into their own `bodyKind`.
  
  The HTTP library will now return a body with `bodyKind: "file"` in all cases where emitters should treat the body as a file upload or download. Emitters that previously attempted to recognize File bodies by checking the `type` of an HTTP `"single"` body may now simply check if the `bodyKind` is `"file"`. This applies to all HTTP payloads where an `HttpOperationBody` can appear, including requests, responses, and multipart parts.

### Bump dependencies

- [#6595](https://github.com/microsoft/typespec/pull/6595) Upgrade dependencies

### Bug Fixes

- [#6559](https://github.com/microsoft/typespec/pull/6559) Fix missing application of description on multipart properties
- [#6729](https://github.com/microsoft/typespec/pull/6729) Fix duplicate name error when using named union inside multipart part.
- [#6506](https://github.com/microsoft/typespec/pull/6506) Fix union of custom scalar with `null` creating an `object` with `allOf` reference


## 0.67.0

### Breaking Changes

- [#5977](https://github.com/microsoft/typespec/pull/5977) Minimum node version is now 20

### Deprecations

- [#6305](https://github.com/microsoft/typespec/pull/6305) Related changes based on `http` library deprecation removal.

### Features

- [#6268](https://github.com/microsoft/typespec/pull/6268) `@typespec/versioning` is now an optional dependency.
- [#6286](https://github.com/microsoft/typespec/pull/6286) Remove support for `@discriminator` on union
- [#6327](https://github.com/microsoft/typespec/pull/6327) Remove reference to delete projection feature

### Bump dependencies

- [#6266](https://github.com/microsoft/typespec/pull/6266) Update dependencies

### Bug Fixes

- [#6289](https://github.com/microsoft/typespec/pull/6289) Fix `utcDateTime` and `offsetDateTime` not using format `http-date` in header by default as the default http encoding defines
- [#6411](https://github.com/microsoft/typespec/pull/6411) Add support for new `dryRun` emitter option
- [#6473](https://github.com/microsoft/typespec/pull/6473) Adds support for `@encode` to specify array encodings for `@query` parameters


## 0.66.0

### Breaking Changes

- [#6182](https://github.com/microsoft/typespec/pull/6182) Using `{service-name}` in `tspconfig.yaml` will always interpolate the current service name. `{service-name-if-multiple}` can be used to get the previous behavior

### Features

- [#6059](https://github.com/microsoft/typespec/pull/6059) Add support for new `@discriminated` unions
- [#5994](https://github.com/microsoft/typespec/pull/5994) Adds `seal-object-schemas` emitter option to automatically set additionalProperties/unevaluatedProperties to `{ not: {} }` wherever possible
- [#5961](https://github.com/microsoft/typespec/pull/5961) Updates JsonSchema and Open API 3.1 emitters to use unevaluatedProperties instead of additionalProperties, and updates Open API 3 emitters to match JsonSchema behavior of treating `Record<never>` as setting `additionalProperties: { not: {} }`
- [#6130](https://github.com/microsoft/typespec/pull/6130) updates openapi3 to respect `@headers` `explode` option and use value syntax
- [#6157](https://github.com/microsoft/typespec/pull/6157) Shared operations operationId can now be set if they all share the same value provided by `@operationId`
- [#6006](https://github.com/microsoft/typespec/pull/6006) Expose core library types in API surface.

### Bug Fixes

- [#5901](https://github.com/microsoft/typespec/pull/5901) Fix: `@typespec/openapi3/invalid-component-fixed-field-key` show on incorrect target


## 0.65.0

### Bug Fixes

- [#5893](https://github.com/microsoft/typespec/pull/5893) Updates tsp-openapi3 to support $ref in requestBodies

### Bump dependencies

- [#5690](https://github.com/microsoft/typespec/pull/5690) Upgrade dependencies

### Features

- [#5831](https://github.com/microsoft/typespec/pull/5831) Updates tsp-openapi3 operation response generation to inline expressions and pare down fields with default values. Also adds support for Open API headers and responses $refs.
- [#4931](https://github.com/microsoft/typespec/pull/4931) Migrate versioning implementation to use mutator approach.


## 0.64.0

### Bug Fixes

- [234eaeb](https://github.com/microsoft/typespec/commit/234eaeb223b85689f73ac3971e09f26c985f6c87) Allow void to be the response body type when other fields are present in the model. Previously, using `void` as a response body type would fail compilation if the model contained other fields (like `statusCode`).
- [#5456](https://github.com/microsoft/typespec/pull/5456) Fix: OpenAPI YAML converts strings to boolean

### Features

- [#5372](https://github.com/microsoft/typespec/pull/5372) Adds support for @typespec/json-schema decorators with Open API 3.0 and 3.1 emitters.
- [#5372](https://github.com/microsoft/typespec/pull/5372) Adds support for emitting Open API 3.1 models using the `openapi-versions` emitter configuration option.
Open API 3.0 is emitted by default.


## 0.63.0

### Bug Fixes

- [#5006](https://github.com/microsoft/typespec/pull/5006) Illegal characters in component keys
- [#5274](https://github.com/microsoft/typespec/pull/5274) Added missing peer dependency "openapi-types"

### Features

- [#5029](https://github.com/microsoft/typespec/pull/5029) Add support for `#deprecated` for OpenAPI3Parameter


## 0.62.0

### Bug Fixes

- [#4663](https://github.com/microsoft/typespec/pull/4663) Discriminator properties are marked as required regardless if they are in TypeSpec to match OpenAPI3 spec.
- [#4934](https://github.com/microsoft/typespec/pull/4934) tsp-openapi3 - fixes typespec generation for empty schema
- [#4727](https://github.com/microsoft/typespec/pull/4727) Nullable enum use `allOf` instead of `oneOf`
- [#4708](https://github.com/microsoft/typespec/pull/4708) Updates tsp-openapi3 to include path-level parameters in generated typespec operations.
- [#4873](https://github.com/microsoft/typespec/pull/4873) Updates tsp-openapi3 query decorator generation to use the value arguments.
- [#4672](https://github.com/microsoft/typespec/pull/4672) OpenAPI3 type property should always be set when nullable property is present.

### Bump dependencies

- [#4679](https://github.com/microsoft/typespec/pull/4679) Upgrade dependencies - October 2024

### Features

- [#4761](https://github.com/microsoft/typespec/pull/4761) Add `@cookie` decorator to specify cookie parameters
- [#4214](https://github.com/microsoft/typespec/pull/4214) Add XML support using `@typespec/xml` library
- [#4834](https://github.com/microsoft/typespec/pull/4834) Add support for `@tagMetadata` decorator
- [#4906](https://github.com/microsoft/typespec/pull/4906) Updates tsp-openapi3 to support generating `@summary` decorators for models and operations from schema title and path item summary fields.


## 0.61.0

### Bump dependencies

- [#4424](https://github.com/microsoft/typespec/pull/4424) Bump dependencies

### Features

- [#4423](https://github.com/microsoft/typespec/pull/4423) Added support to use Scalar and Object as default types


## 0.60.0

### Bug Fixes

- [#4133](https://github.com/microsoft/typespec/pull/4133) Fix Bug for OpenAPI 3 Emitter crash on `@useAuth({})`
- [#4123](https://github.com/microsoft/typespec/pull/4123) Fix OpenAPI3 union names when declared within a namespace
- [#4216](https://github.com/microsoft/typespec/pull/4216) Fixes issue in tsp-openapi3 that resulted in component schemas and parameters with the same name being merged into a single TypeSpec data type.
- [#4232](https://github.com/microsoft/typespec/pull/4232) Improves tsp-openapi3 model generation from schemas utilizing allOf. Models will now extend an allOf member if it is a schema reference and the only member with a discriminator. Other members will be spread into the model if defined as a schema reference, or have their properties treated as top-level properties if they are an inline-schema.
- [#4149](https://github.com/microsoft/typespec/pull/4149) Updates tsp-openapi3 conversion of OpenAPI3 component schemas to improve handling of enums, unions, scalars, and aliases.

### Features

- [#4139](https://github.com/microsoft/typespec/pull/4139) Internals: Migrate to new api for declaring decorator implementation


## 0.59.1

### Bug Fixes

- [#4168](https://github.com/microsoft/typespec/pull/4168) Fix: query params are `explode: true` by default in OpenAPI 3.0


## 0.59.0

### Bug Fixes

- [#4046](https://github.com/microsoft/typespec/pull/4046) Fix issue where operation example would produce an empty object when `@body`/`@bodyRoot` was used
- [#4046](https://github.com/microsoft/typespec/pull/4046) Fix operation response body examples showing up for each response.
- [#3912](https://github.com/microsoft/typespec/pull/3912) Fixes bug where union documentation was being applied to each union member in emitted output.
- [#3908](https://github.com/microsoft/typespec/pull/3908) Fixes bug where circular references in unions caused an empty object to be emitted instead of a ref.

### Bump dependencies

- [#3948](https://github.com/microsoft/typespec/pull/3948) Update dependencies

### Features

- [#3894](https://github.com/microsoft/typespec/pull/3894) Add support for `@useRef` on responses
- [#4020](https://github.com/microsoft/typespec/pull/4020) Add support for encoding numeric types as string
- [#3890](https://github.com/microsoft/typespec/pull/3890) `@extension` used on the service namespace will set extension at the root of the document
- [#3932](https://github.com/microsoft/typespec/pull/3932) Add support for URI templates in routes


## 0.58.0

### Bug Fixes

- [#3516](https://github.com/microsoft/typespec/pull/3516) Fix issue that could result in invalid document generation when running `tsp compile` from another directory
- [#3794](https://github.com/microsoft/typespec/pull/3794) Updates tsp-openapi3 to always emit main.tsp when formatting encounters an error.
- [#3839](https://github.com/microsoft/typespec/pull/3839) Updates tsp-openapi3 doc line wrapping to only automatically create newlines when they are present in the original documentation.

### Bump dependencies

- [#3718](https://github.com/microsoft/typespec/pull/3718) Dependency updates July 2024

### Features

- [#3572](https://github.com/microsoft/typespec/pull/3572) Add support for new `@example` and `@opExample` decorator
- [#3663](https://github.com/microsoft/typespec/pull/3663) Adds support for converting OpenAPI3 specs to TypeSpec via the new tsp-openapi3 CLI included in the `@typespec/openapi3` package.
- [#3732](https://github.com/microsoft/typespec/pull/3732) Apply openapi3 extension on Security schemes
- [#3844](https://github.com/microsoft/typespec/pull/3844) Updates tsp-openapi3 to escape identifiers that would otherwise be invalid, and automatically resolve namespaces for schemas with dots in their names.


## 0.57.0

### Bug Fixes

- [#3342](https://github.com/microsoft/typespec/pull/3342) Add support for new multipart constructs in http library
- [#3574](https://github.com/microsoft/typespec/pull/3574) Emit diagnostic when an invalid type is used as a property instead of crashing.

### Bump dependencies

- [#3401](https://github.com/microsoft/typespec/pull/3401) Update dependencies - May 2024

### Features

- [#3022](https://github.com/microsoft/typespec/pull/3022) Add support for new object and array values as default values (e.g. `decimals: decimal[] = #[123, 456.7];`)


## 0.56.0

### Bug Fixes

- [#3218](https://github.com/microsoft/typespec/pull/3218) Fix: `@path` property should be included in unreachable models

### Bump dependencies

- [#3169](https://github.com/microsoft/typespec/pull/3169) Update dependencies

### Features

- [#2945](https://github.com/microsoft/typespec/pull/2945) Add support for new `@bodyRoot` and `@body` distinction


## 0.55.0

### Bug Fixes

- [#3077](https://github.com/microsoft/typespec/pull/3077) Do not crash if using an unsupported intrinsic type
- [#2967](https://github.com/microsoft/typespec/pull/2967) Fix crash: emit `{nullable: true}` when trying to emit `null` in openapi3
- [#3013](https://github.com/microsoft/typespec/pull/3013) Fix: OpenAPI3 not marking part of bytes or something else as `format: binary`
- [#3090](https://github.com/microsoft/typespec/pull/3090) Fix: Literal unions with the same variants keep adding duplicate entries
- [#3049](https://github.com/microsoft/typespec/pull/3049) Fix visibility naming conflict when a model used with `extends` was used in different visibility.

### Bump dependencies

- [#3027](https://github.com/microsoft/typespec/pull/3027) Update dependencies


## 0.54.0

### Bump dependencies

- [#2900](https://github.com/microsoft/typespec/pull/2900) Update dependencies

### Features

- [#2902](https://github.com/microsoft/typespec/pull/2902) Add support for all properties of openapi `info` object on the `@info` decorator
- [#2950](https://github.com/microsoft/typespec/pull/2950) Add `getOpenAPI3` function that takes a TypeSpec program and returns the emitted OpenAPI as an object. Useful for other emitters and tools that want to work with emitted OpenAPI directly without writing it to disk.
- [#2933](https://github.com/microsoft/typespec/pull/2933) Add a new option `safeint-strategy` that can be set to `double-int` to emit `type: integer, format: double-int` instead of `type: integer, format: int64` when using the `safeint` scalar.


## 0.53.2

### Patch Changes

- 4915d5b: Fix: `required` array on schema wasn't using the value provided by `@encodedName`

## 0.53.1

### Patch Changes

- e6a045b: Allow using default values for union property types
- e6a045b: Fix: union of primitive types that gets emitted as an `enum` keeps the description

## 0.53.0

### Patch Changes

- 9726b3d: Fix issues with `nullable` properties used in a cycle being wrapped in `allOf` when not needed
- 05c8597: Fix circular reference would not always inline array properties
- 8ed1d82: Add support for OpenIdConnect auth scheme


## 0.52.0

Wed, 24 Jan 2024 05:46:53 GMT

### Updates

- Add support for `@encodedName` decorator
- Update dependencies

## 0.51.1

Wed, 13 Dec 2023 23:28:17 GMT

### Patches

- Fix: Multipart part of type `bytes[]` is now treated as multiple binary part
- Fix: OpenAPI3 creating conflicting type declaration when type was used in multipart implicit body and json body

## 0.51.0

Wed, 06 Dec 2023 19:40:58 GMT

### Updates

- Handle `bytes` as a multipart part type correctly and produce `type: string, format: binary`
- Added support for string template literals
- Handle: union variants as discriminator
- Migrate code to use the emitter framework
- Emitter will now emit all properties on unreferenced schemas.

## 0.50.0

Wed, 08 Nov 2023 00:07:17 GMT

### Updates

- Fix: Stops emitting an error when using `@body _: void` in operation parameters and treat it as no body.
- Fix issue where using shared routes would, in some cases, result in a "duplicate-header" error.
- `TypeScript` use `types` entry under `exports` of `package.json` instead of legacy `typesVersions` to provide the definition files
- Support `@summary` on data types which emits the JSON Schema `title` property.
- **BREAKING CHANGE** Dropped support for node 16, minimum node version is now 18

## 0.49.0

Wed, 11 Oct 2023 23:31:35 GMT

### Updates

- Removes `@typespec/rest` as a `peerDependency`. Relates to #2391
- Add support for constraints on unions
- Add support for `@returns` and `@errors` doc comment tags.
- Add support for http status code ranges
- Fix: Correctly generate discriminated union mapping property with multiple visibilities involved
- Fix: Crash when assigning a numeric default to a union
- Fix: Using format `ssv` or `pipes` in `@header` produced an invalid OpenAPI3 schema. It will now change the type to string and ignore the format as well as logging a warning.
- Fix: Use `null` as a default
- Allow use of `@oneOf` on model properties
- Fix `OpenAPI` namespace to be `TypeSpec.OpenAPI`.
- Fix issue with CSV format representation.
- Fix issue where openAPI3 for shared routes incorrectly output a statusCode field.
- Update dependencies
- Disable folding of serialized yaml if line is above 80 characters

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
- Add support for `@info` decorator providing the ability to specify the additional fields from openapi info object.
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
- Uptake move of `@discriminator` into compiler
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
