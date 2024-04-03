# Change Log - @typespec/json-schema

## 0.55.0

### Bump dependencies

- [#3027](https://github.com/microsoft/typespec/pull/3027) Update dependencies


## 0.54.0

### Bug Fixes

- [#2977](https://github.com/microsoft/typespec/pull/2977) Respect compiler `noEmit` flag

### Bump dependencies

- [#2900](https://github.com/microsoft/typespec/pull/2900) Update dependencies


## 0.53.1

### Patch Changes

- e6a045b: Allow using default values for union property types
- Updated dependencies [e6a045b]
  - @typespec/compiler@0.53.1

## 0.53.0

### Patch Changes


## 0.52.0

Wed, 24 Jan 2024 05:46:53 GMT

### Updates

- Rename template parameters in preparation for named template argument instantiation.
- Update dependencies

## 0.51.0

Wed, 06 Dec 2023 19:40:58 GMT

### Updates

- Add support for simple literal default on model properties
- Added support for string template literals
- Fix: Enum with a value of `0` would have resulting in `type` of `string` and `number`
- Fix: Scalar constraints combine with base scalar constraints
- JsonSchema: Fix `@maxValueExclusive` setting `minimumExclusive` instead of `maximumExclusive`
- Report diagnostic instead of throwing errors in the case of duplicate ids or unknown scalar
- Add support for templated scalars.

## 0.50.0

Wed, 08 Nov 2023 00:07:17 GMT

### Updates

- Add TupleLiteral support.
- `TypeScript` use `types` entry under `exports` of `package.json` instead of legacy `typesVersions` to provide the definition files
- **BREAKING CHANGE** Dropped support for node 16, minimum node version is now 18

## 0.49.0

Wed, 11 Oct 2023 23:31:35 GMT

### Updates

- Update dependencies
- Disable folding of serialized yaml if line is above 80 characters

## 0.48.0

Tue, 12 Sep 2023 21:47:11 GMT

### Updates

- Changed yaml parser from `js-yaml` to `yaml`
- Support decimal scalar types.

## 0.47.0

Tue, 08 Aug 2023 22:32:10 GMT

### Updates

- Uptake breaking change to `emitSourceFile` returning a `Promise`
- Fix: Crash when using interfaces inside a `@jsonSchema` namespace

## 0.46.0

Tue, 11 Jul 2023 22:06:00 GMT

### Updates

- Add support for enum member references.
- Export the emitter and related types from the package.
- Fix a bug that could result in a schema being bundled more than once.
- By default, types that are not marked with @jsonSchema or are within a namespace with @jsonSchema are bundled into the schemas that reference them. Set the `emitAllRefs` option to true to get the previous behavior of emitting all types referenced as JSON Schema.
- Support @extension for adding arbitrary vendor extensions into the output.
- Breaking change: the namespace has been corrected to TypeSpec.JsonSchema.
- Fix: Make sure `$lib` is exported
- Add support for Record<T>
- Support templates instantiated with intrinsic types and type expressions.
- Update dependencies

## 0.45.0

Tue, 06 Jun 2023 22:44:16 GMT

### Minor changes

- Add @typespec/json-schema for defining and emitting TypeSpec to standard JSON Schema
