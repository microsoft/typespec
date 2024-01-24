---
jsApi: true
title: "[I] HttpOperation"

---
## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `container` | [`OperationContainer`](../type-aliases/OperationContainer.md) | Parent type being the interface, namespace or global namespace. |
| `operation` | `Operation` | Operation type reference. |
| `overloading?` | [`HttpOperation`](HttpOperation.md) | Overload this operation |
| `overloads?` | [`HttpOperation`](HttpOperation.md)[] | List of operations that overloads this one. |
| `parameters` | [`HttpOperationParameters`](HttpOperationParameters.md) | Parameters. |
| `path` | `string` | Route path |
| `pathSegments` | `string`[] | Path segments |
| `responses` | [`HttpOperationResponse`](HttpOperationResponse.md)[] | Responses. |
| `verb` | [`HttpVerb`](../type-aliases/HttpVerb.md) | Route verb. |
