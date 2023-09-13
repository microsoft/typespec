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
| `program` | [`Program`](Interface.Program.md) | Program |
| `namespace` | [`Namespace`](Interface.Namespace.md) | Service namespace |

## Returns

[`Service`](Namespace.decorators.Interface.Service.md) \| `undefined`

Service information or undefined if namespace is not a service namespace.
