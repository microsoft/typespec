---
jsApi: true
title: "[F] listOperationsIn"

---
```ts
listOperationsIn(container, options): Operation[]
```

List operations in the given container. Will list operation recursively by default(Check subnamespaces.)

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `container` | [`Interface`](../interfaces/Interface.md) \| [`Namespace`](../interfaces/Namespace.md) | Container. |
| `options` | [`ListOperationOptions`](../interfaces/ListOperationOptions.md) | Options. |
