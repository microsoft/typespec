---
jsApi: true
title: "[I] HttpOperation"

---
## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `container` | [`OperationContainer`](Type.OperationContainer.md) | Parent type being the interface, namespace or global namespace. |
| `operation` | `Operation` | Operation type reference. |
| `overloading`? | [`HttpOperation`](Interface.HttpOperation.md) | Overload this operation |
| `overloads`? | [`HttpOperation`](Interface.HttpOperation.md)[] | List of operations that overloads this one. |
| `parameters` | [`HttpOperationParameters`](Interface.HttpOperationParameters.md) | Parameters. |
| `path` | `string` | Route path |
| `pathSegments` | `string`[] | Path segments |
| `responses` | [`HttpOperationResponse`](Interface.HttpOperationResponse.md)[] | Responses. |
| `verb` | [`HttpVerb`](Type.HttpVerb.md) | Route verb. |
