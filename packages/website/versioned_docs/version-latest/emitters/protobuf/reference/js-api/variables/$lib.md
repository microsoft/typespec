---
jsApi: true
title: "[V] $lib"

---
```ts
const $lib: TypeSpecLibrary<object, ProtobufEmitterOptions, never> = TypeSpecProtobufLibrary;
```

## Type declaration

| Name | Type | Default value |
| ------ | ------ | ------ |
| `anonymous-model` | `object` | - |
| `anonymous-model.default` | `"anonymous models cannot be used in Protobuf messages"` | "anonymous models cannot be used in Protobuf messages" |
| `field-index` | `object` | - |
| `field-index.invalid` | `CallableMessage`<[`"index"`]\> | - |
| `field-index.missing` | `CallableMessage`<[`"name"`]\> | - |
| `field-index.out-of-bounds` | `CallableMessage`<[`"index"`, `"max"`]\> | - |
| `field-index.reserved` | `CallableMessage`<[`"index"`]\> | - |
| `field-index.user-reserved` | `CallableMessage`<[`"index"`]\> | - |
| `field-index.user-reserved-range` | `CallableMessage`<[`"index"`]\> | - |
| `field-name` | `object` | - |
| `field-name.user-reserved` | `CallableMessage`<[`"name"`]\> | - |
| `illegal-reservation` | `object` | - |
| `illegal-reservation.default` | `"reservation value must be a string literal, uint32 literal, or a tuple of two uint32 literals denoting a range"` | "reservation value must be a string literal, uint32 literal, or a tuple of two uint32 literals denoting a range" |
| `invalid-package-name` | `object` | - |
| `invalid-package-name.default` | `CallableMessage`<[`"name"`]\> | - |
| `model-not-in-package` | `object` | - |
| `model-not-in-package.default` | `CallableMessage`<[`"name"`]\> | - |
| `namespace-collision` | `object` | - |
| `namespace-collision.default` | `CallableMessage`<[`"name"`]\> | - |
| `nested-array` | `object` | - |
| `nested-array.default` | `"nested arrays are not supported by the Protobuf emitter"` | "nested arrays are not supported by the Protobuf emitter" |
| `package` | `object` | - |
| `package.disallowed-option-type` | `CallableMessage`<[`"name"`, `"type"`]\> | - |
| `root-operation` | `object` | - |
| `root-operation.default` | `"operations in the root namespace are not supported (no associated Protobuf service)"` | "operations in the root namespace are not supported (no associated Protobuf service)" |
| `unconvertible-enum` | `object` | - |
| `unconvertible-enum.default` | `"enums must explicitly assign exactly one integer to each member to be used in a Protobuf message"` | "enums must explicitly assign exactly one integer to each member to be used in a Protobuf message" |
| `unconvertible-enum.no-zero-first` | `"the first variant of an enum must be set to zero to be used in a Protobuf message"` | "the first variant of an enum must be set to zero to be used in a Protobuf message" |
| `unspeakable-template-argument` | `object` | - |
| `unspeakable-template-argument.default` | `CallableMessage`<[`"name"`]\> | - |
| `unsupported-field-type` | `object` | - |
| `unsupported-field-type.recursive-map` | `"a protobuf map's 'value' type may not refer to another map"` | "a protobuf map's 'value' type may not refer to another map" |
| `unsupported-field-type.unconvertible` | `CallableMessage`<[`"type"`]\> | - |
| `unsupported-field-type.union` | `"a message field's type may not be a union"` | "a message field's type may not be a union" |
| `unsupported-field-type.unknown-intrinsic` | `CallableMessage`<[`"name"`]\> | - |
| `unsupported-field-type.unknown-scalar` | `CallableMessage`<[`"name"`]\> | - |
| `unsupported-input-type` | `object` | - |
| `unsupported-input-type.unconvertible` | `"input parameters cannot be converted to a Protobuf message"` | "input parameters cannot be converted to a Protobuf message" |
| `unsupported-input-type.wrong-number` | `"Protobuf methods must accept exactly one Model input (an empty model will do)"` | "Protobuf methods must accept exactly one Model input (an empty model will do)" |
| `unsupported-input-type.wrong-type` | `"Protobuf methods may only accept a named Model as an input"` | "Protobuf methods may only accept a named Model as an input" |
| `unsupported-intrinsic` | `object` | - |
| `unsupported-intrinsic.default` | `CallableMessage`<[`"name"`]\> | - |
| `unsupported-return-type` | `object` | - |
| `unsupported-return-type.default` | `"Protobuf methods must return a named Model"` | "Protobuf methods must return a named Model" |
