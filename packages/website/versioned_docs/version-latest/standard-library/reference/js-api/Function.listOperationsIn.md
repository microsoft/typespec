---
jsApi: true
title: "[F] listOperationsIn"

---
```ts
listOperationsIn(container, options = {}): Operation[]
```

List operations in the given container. Will list operation recursively by default(Check subnamespaces.)

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `container` | [`Interface`](Interface.Interface.md) \| [`Namespace`](Interface.Namespace.md) | Container. |
| `options` | [`ListOperationOptions`](Interface.ListOperationOptions.md) | Options. |

## Returns

[`Operation`](Interface.Operation.md)[]
