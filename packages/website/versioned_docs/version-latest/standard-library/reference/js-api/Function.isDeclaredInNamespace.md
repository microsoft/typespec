---
jsApi: true
title: "[F] isDeclaredInNamespace"

---
```ts
isDeclaredInNamespace(
  type,
  namespace,
  options = ...): boolean
```

Check if the given type is declared in the specified namespace or, optionally, its child namespaces.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `type` | [`Model`](Interface.Model.md) \| [`Interface`](Interface.Interface.md) \| [`Enum`](Interface.Enum.md) \| [`Namespace`](Interface.Namespace.md) \| [`Operation`](Interface.Operation.md) | Type |
| `namespace` | [`Namespace`](Interface.Namespace.md) | Namespace |
| `options` | `object` | - |
| `options.recursive`? | `boolean` | - |

## Returns

`boolean`
