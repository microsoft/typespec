[JS Api](../index.md) / JSONSchemaValidator

# Interface: JSONSchemaValidator

## Table of contents

### Methods

- [validate](JSONSchemaValidator.md#validate)

## Methods

### validate

▸ **validate**(`config`, `target`): [`Diagnostic`](Diagnostic.md)[]

Validate the configuration against its JSON Schema.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `config` | `unknown` | Configuration to validate. |
| `target` | [`SourceFile`](SourceFile.md) \| typeof [`NoTarget`](../index.md#notarget) | Source file target to use for diagnostics. |

#### Returns

[`Diagnostic`](Diagnostic.md)[]

Diagnostics produced by schema validation of the configuration.
