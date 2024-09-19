---
jsApi: true
title: "[V] $lib"

---
```ts
const $lib: TypeSpecLibrary<object, Record<string, any>, "attribute" | "unwrapped" | "ns" | "nsDeclaration">;
```

TypeSpec Xml Library Definition

## Type declaration

| Name | Type | Default value |
| ------ | ------ | ------ |
| `invalid-ns-declaration-member` | `object` | - |
| `invalid-ns-declaration-member.default` | `CallableMessage`<[`"name"`]\> | - |
| `ns-enum-not-declaration` | `object` | - |
| `ns-enum-not-declaration.default` | `"Enum member used as namespace must be part of an enum marked with @nsDeclaration."` | "Enum member used as namespace must be part of an enum marked with @nsDeclaration." |
| `ns-missing-prefix` | `object` | - |
| `ns-missing-prefix.default` | `"When using a string namespace you must provide a prefix as the 2nd argument."` | "When using a string namespace you must provide a prefix as the 2nd argument." |
| `ns-not-uri` | `object` | - |
| `ns-not-uri.default` | `"Namespace namespace is not a valid URI."` | - |
| `prefix-not-allowed` | `object` | - |
| `prefix-not-allowed.default` | `"@ns decorator cannot have the prefix parameter set when using an enum member."` | "@ns decorator cannot have the prefix parameter set when using an enum member." |
