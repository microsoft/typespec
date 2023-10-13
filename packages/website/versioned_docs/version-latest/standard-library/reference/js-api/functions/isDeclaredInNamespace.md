---
jsApi: true
title: "[F] isDeclaredInNamespace"

---
```ts
isDeclaredInNamespace(
   type, 
   namespace, 
   options): boolean
```

Check if the given type is declared in the specified namespace or, optionally, its child namespaces.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `type` |    \| [`Model`](../interfaces/Model.md)   \| [`Interface`](../interfaces/Interface.md)   \| [`Enum`](../interfaces/Enum.md)   \| [`Namespace`](../interfaces/Namespace.md)   \| [`Operation`](../interfaces/Operation.md) | Type |
| `namespace` | [`Namespace`](../interfaces/Namespace.md) | Namespace |
| `options` | `object` | - |
| `options.recursive`? | `boolean` | - |

## Returns
