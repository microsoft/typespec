---
jsApi: true
title: "[F] resolveUsages"

---
```ts
resolveUsages(types): UsageTracker
```

Resolve usage(input, output or both) of various types in the given namespace.
Will recursively scan all namespace, interfaces and operations contained inside the namespace.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `types` | [`OperationContainer`](Type.OperationContainer.md) \| [`OperationContainer`](Type.OperationContainer.md)[] | Entrypoint(s) namespace, interface or operations to get usage from. |

## Returns

[`UsageTracker`](Interface.UsageTracker.md)

Map of types to usage.
