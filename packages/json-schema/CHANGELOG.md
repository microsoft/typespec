# Change Log - @typespec/json-schema

This log was last generated on Wed, 11 Oct 2023 23:31:35 GMT and should not be manually modified.

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

