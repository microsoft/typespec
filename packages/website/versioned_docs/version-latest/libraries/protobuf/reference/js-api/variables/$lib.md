---
jsApi: true
title: "[V] $lib"

---
```ts
const $lib: TypeSpecLibrary<Object, ProtobufEmitterOptions, never> = TypeSpecProtobufLibrary;
```

## Type declaration

| Member | Type | Value |
| :------ | :------ | :------ |
| `anonymous-model` | `Object` | - |
| `anonymous-model.default` | `string` | "anonymous models cannot be used in Protobuf messages" |
| `field-index` | `Object` | - |
| `field-index.invalid` | `CallableMessage`<[`string`]\> | - |
| `field-index.missing` | `CallableMessage`<[`string`]\> | - |
| `field-index.out-of-bounds` | `CallableMessage`<[`string`, `string`]\> | - |
| `field-index.reserved` | `CallableMessage`<[`string`]\> | - |
| `field-index.user-reserved` | `CallableMessage`<[`string`]\> | - |
| `field-index.user-reserved-range` | `CallableMessage`<[`string`]\> | - |
| `field-name` | `Object` | - |
| `field-name.user-reserved` | `CallableMessage`<[`string`]\> | - |
| `illegal-reservation` | `Object` | - |
| `illegal-reservation.default` | `string` | "reservation value must be a string literal, uint32 literal, or a tuple of two uint32 literals denoting a range" |
| `invalid-package-name` | `Object` | - |
| `invalid-package-name.default` | `CallableMessage`<[`string`]\> | - |
| `model-not-in-package` | `Object` | - |
| `model-not-in-package.default` | `CallableMessage`<[`string`]\> | - |
| `namespace-collision` | `Object` | - |
| `namespace-collision.default` | `CallableMessage`<[`string`]\> | - |
| `nested-array` | `Object` | - |
| `nested-array.default` | `string` | "nested arrays are not supported by the Protobuf emitter" |
| `package` | `Object` | - |
| `package.disallowed-option-type` | `CallableMessage`<[`string`, `string`]\> | - |
| `root-operation` | `Object` | - |
| `root-operation.default` | `string` | "operations in the root namespace are not supported (no associated Protobuf service)" |
| `unconvertible-enum` | `Object` | - |
| `unconvertible-enum.default` | `string` | "enums must explicitly assign exactly one integer to each member to be used in a Protobuf message" |
| `unconvertible-enum.no-zero-first` | `string` | "the first variant of an enum must be set to zero to be used in a Protobuf message" |
| `unspeakable-template-argument` | `Object` | - |
| `unspeakable-template-argument.default` | `CallableMessage`<[`string`]\> | - |
| `unsupported-field-type` | `Object` | - |
| `unsupported-field-type.recursive-map` | `string` | "a protobuf map's 'value' type may not refer to another map" |
| `unsupported-field-type.unconvertible` | `CallableMessage`<[`string`]\> | - |
| `unsupported-field-type.union` | `string` | "a message field's type may not be a union" |
| `unsupported-field-type.unknown-intrinsic` | `CallableMessage`<[`string`]\> | - |
| `unsupported-field-type.unknown-scalar` | `CallableMessage`<[`string`]\> | - |
| `unsupported-input-type` | `Object` | - |
| `unsupported-input-type.unconvertible` | `string` | "input parameters cannot be converted to a Protobuf message" |
| `unsupported-input-type.wrong-number` | `string` | "Protobuf methods must accept exactly one Model input (an empty model will do)" |
| `unsupported-input-type.wrong-type` | `string` | "Protobuf methods may only accept a named Model as an input" |
| `unsupported-intrinsic` | `Object` | - |
| `unsupported-intrinsic.default` | `CallableMessage`<[`string`]\> | - |
| `unsupported-return-type` | `Object` | - |
| `unsupported-return-type.default` | `string` | "Protobuf methods must return a named Model" |
