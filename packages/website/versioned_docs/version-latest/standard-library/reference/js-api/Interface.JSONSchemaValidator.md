---
jsApi: true
title: "[I] JSONSchemaValidator"

---
## Methods

### validate

```ts
validate(config, target): Diagnostic[]
```

Validate the configuration against its JSON Schema.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `config` | `unknown` | Configuration to validate. |
| `target` | [`SourceFile`](Interface.SourceFile.md) \| `YamlScript` \| *typeof* [`NoTarget`](Variable.NoTarget.md) | Source file target to use for diagnostics. |

#### Returns

[`Diagnostic`](Interface.Diagnostic.md)[]

Diagnostics produced by schema validation of the configuration.
