# Changelog - @typespec/http-server-js

## 0.58.0-alpha.18

### Bump dependencies

- [#7978](https://github.com/microsoft/typespec/pull/7978) Upgrade dependencies

### Bug Fixes

- [#8084](https://github.com/microsoft/typespec/pull/8084) Corrected an error that caused Array and Record responses to fail to serialize correctly when they were variants of a Union return type.
- [#7940](https://github.com/microsoft/typespec/pull/7940) Fixed an issue where JSON serialization would not correctly handle optional properties in some cases.
  
  Fixed an issue where body serialization would sometimes fail to name anonymous response items, even if a name is required
  to dispatch serialization code.


## 0.58.0-alpha.16

### Bump dependencies

- [#7674](https://github.com/microsoft/typespec/pull/7674) Upgrade dependencies


## 0.58.0-alpha.15

### Features

- [#7256](https://github.com/microsoft/typespec/pull/7256) Implemented canonical visibility transforms. When HTTP operations imply particular implicit visibility transforms, this change enables `@typespec/http-server-js` to perform those transforms, removing invisible properties in contexts where they cannot be used.

### Bug Fixes

- [#7554](https://github.com/microsoft/typespec/pull/7554) Fixes emitter crash when operation return types included metadata or `@body` properties that only contained underscores
- [#7494](https://github.com/microsoft/typespec/pull/7494) Corrected a bug that sometimes caused the generated server code to sometimes attempt to extract path parameters from the wrong location.
  
  Fixed an issue that caused all generated helper modules to be emitted even if they were not used. Now, the generator will only emit the helper modules that are actually used by the generated code.
- [#7280](https://github.com/microsoft/typespec/pull/7280) Fixed an error in which the scaffolding script incorrectly considered built-in Node.js modules external dependencies.
- [#7276](https://github.com/microsoft/typespec/pull/7276) Fixed an issue in which differences between model and JSON serialized property names were not correctly detected and property names for JSON serialization were not correctly quoted as necessary.


## 0.58.0-alpha.14

### Bug Fixes

- [#7234](https://github.com/microsoft/typespec/pull/7234) Fixed a few bugs with output directory resolution logic in `hsjs-scaffolding`, improving robustness of the scaffolding script by re-using existing compiler logic to resolve emitter options.
- [#7225](https://github.com/microsoft/typespec/pull/7225) Added a missing shebang line to `hsjs-scaffold` for better platform compatibility.


## 0.58.0-alpha.13

### Features

- [#6971](https://github.com/microsoft/typespec/pull/6971) Added support for and enabled by default using the JS Temporal API for DateTime/Duration types. DateTime representation supports three modes:
  
  - "temporal-polyfill" (default): uses the [Temporal API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal) and imports it from [temporal-polyfill](https://npmjs.com/package/temporal-polyfill).
  - "temporal": uses the Temporal API and assumes it is available on the `globalThis` object (you are responsible for ensuring it is available in your environment). When Temporal is well-supported by JavaScript engines and TypeScript `global.d.ts` definitions for it are widely available, this will become the default mode.
  - "date-duration": uses JavaScript `Date` and a custom `Duration` object. This mode is not recommended but is provided if you really don't want to depend on Temporal.
  
  Set the DateTime mode using the `"datetime"` emitter option in `tspconfig.yaml`:
  
  ```yaml
  options:
    @typespec/http-server-js:
      datetime: temporal-polyfill
  ```
- [#6914](https://github.com/microsoft/typespec/pull/6914) Add support for TypeSpec.decimal, TypeSpec.decimal128, TypeSpec.float, and TypeSpec.numeric, all represented as `Decimal` from the 'decimal.js' package.
- [#6898](https://github.com/microsoft/typespec/pull/6898) Enabled 'text/plain' serialization for scalars that extend `TypeSpec.string`.
  
  Enabled fallback logic for all unrecognized content-types with a body type that is or extends `TypeSpec.bytes`.
  
  Enhanced route differentiation logic for shared routes, allowing them to differentiate routes in more cases using headers other than `content-type`.
- [#6885](https://github.com/microsoft/typespec/pull/6885) Added typereferences for Tuples and EnumMember types.
- [#6896](https://github.com/microsoft/typespec/pull/6896) Added support for Enums in request/response serialization.

### Bug Fixes

- [#7069](https://github.com/microsoft/typespec/pull/7069) Handle types without node
- [#6924](https://github.com/microsoft/typespec/pull/6924) Correctly ignore uninstantiated operations that are direct children of namespaces. This prevents a fatal error where TemplateParameter types can be encountered in such templates.
- [#6796](https://github.com/microsoft/typespec/pull/6796) Fixes the mocks in hsjs-scaffold to use bigints for large integer types and `Duration` objects as appropriate.
- [#6885](https://github.com/microsoft/typespec/pull/6885) Corrected router parameter generation so that it avoids using JavaScript reserved keywords for route controller parameters.
  
  Corrected models that extend `Record` so that they refer to TypeScript's `Record` type by name instead of using a literal interface with an indexer.


## 0.58.0-alpha.12

### Features

- [#5819](https://github.com/microsoft/typespec/pull/5819) Added support for encoding and decoding scalar types and default encodings prescribed by convention.

### Bump dependencies

- [#6595](https://github.com/microsoft/typespec/pull/6595) Upgrade dependencies

### Bug Fixes

- [#6710](https://github.com/microsoft/typespec/pull/6710) Updates to scaffolding script and scaffold commands for consistency
- [#6809](https://github.com/microsoft/typespec/pull/6809) Ignore unfinished types when visiting service namespace for completeness. This avoids crashes that result from encountering TemplateParameter instances.
- [#6810](https://github.com/microsoft/typespec/pull/6810) Correct implementation of JSON body deserialization when the body type is an array or record requiring interior serialization/deserialization.
- [#6813](https://github.com/microsoft/typespec/pull/6813) Handle parameter and variable names that could be keywords correctly in more cases, preventing syntax errors.


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



