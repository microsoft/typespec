---
jsApi: true
title: "[V] $lib"

---
```ts
const $lib: TypeSpecLibrary<Object, ProtobufEmitterOptions, never> = TypeSpecProtobufLibrary;
```

## Type declaration

| Member | Type | Description |
| :------ | :------ | :------ |
| `anonymous-model` | `Object` | - |
| `anonymous-model.default` | `string` | - |
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
| `illegal-reservation.default` | `string` | - |
| `invalid-package-name` | `Object` | - |
| `invalid-package-name.default` | `CallableMessage`<[`string`]\> | - |
| `model-not-in-package` | `Object` | - |
| `model-not-in-package.default` | `CallableMessage`<[`string`]\> | - |
| `namespace-collision` | `Object` | - |
| `namespace-collision.default` | `CallableMessage`<[`string`]\> | - |
| `nested-array` | `Object` | - |
| `nested-array.default` | `string` | - |
| `package` | `Object` | - |
| `package.disallowed-option-type` | `CallableMessage`<[`string`, `string`]\> | - |
| `root-operation` | `Object` | - |
| `root-operation.default` | `string` | - |
| `unconvertible-enum` | `Object` | - |
| `unconvertible-enum.default` | `string` | - |
| `unconvertible-enum.no-zero-first` | `string` | - |
| `unsupported-field-type` | `Object` | - |
| `unsupported-field-type.recursive-map` | `string` | - |
| `unsupported-field-type.unconvertible` | `CallableMessage`<[`string`]\> | - |
| `unsupported-field-type.union` | `string` | - |
| `unsupported-field-type.unknown-intrinsic` | `CallableMessage`<[`string`]\> | - |
| `unsupported-field-type.unknown-scalar` | `CallableMessage`<[`string`]\> | - |
| `unsupported-input-type` | `Object` | - |
| `unsupported-input-type.unconvertible` | `string` | - |
| `unsupported-input-type.wrong-number` | `string` | - |
| `unsupported-input-type.wrong-type` | `string` | - |
| `unsupported-intrinsic` | `Object` | - |
| `unsupported-intrinsic.default` | `CallableMessage`<[`string`]\> | - |
| `unsupported-return-type` | `Object` | - |
| `unsupported-return-type.default` | `string` | - |
