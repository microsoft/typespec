---
jsApi: true
title: "[F] getService"

---
```ts
getService(program, namespace): Service | undefined
```

Get the service information for the given namespace.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) | Program |
| `namespace` | [`Namespace`](../interfaces/Namespace.md) | Service namespace |

## Returns

Service information or undefined if namespace is not a service namespace.
