---
jsApi: true
title: "[V] $lib"

---
```ts
const $lib: TypeSpecLibrary<object, Record<string, any>, never>;
```

## Type declaration

| Name | Type | Default value |
| ------ | ------ | ------ |
| `duplicate-key` | `object` | - |
| `duplicate-key.default` | `CallableMessage`<[`"resourceName"`]\> | - |
| `duplicate-parent-key` | `object` | - |
| `duplicate-parent-key.default` | `CallableMessage`<[`"resourceName"`, `"keyName"`]\> | - |
| `invalid-action-name` | `object` | - |
| `invalid-action-name.default` | `"Action name cannot be empty string."` | "Action name cannot be empty string." |
| `not-key-type` | `object` | - |
| `not-key-type.default` | `"Cannot copy keys from a non-key type (KeysOf<T> or ParentKeysOf<T>)"` | "Cannot copy keys from a non-key type (KeysOf<T\> or ParentKeysOf<T\>)" |
| `resource-missing-error` | `object` | - |
| `resource-missing-error.default` | `CallableMessage`<[`"modelName"`]\> | - |
| `resource-missing-key` | `object` | - |
| `resource-missing-key.default` | `CallableMessage`<[`"modelName"`]\> | - |
| `shared-route-unspecified-action-name` | `object` | - |
| `shared-route-unspecified-action-name.default` | `CallableMessage`<[`"decoratorName"`]\> | - |
