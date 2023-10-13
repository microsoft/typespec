---
jsApi: true
title: "[F] scopeNavigationToNamespace"

---
```ts
scopeNavigationToNamespace<T>(
   namespace, 
   listeners, 
   options): T
```

Scope the current navigation to the given namespace.

## Type parameters

| Parameter |
| :------ |
| `T` extends `object` & `object` & `object` & `object` & `object` & `object` & `object` & `object` & `object` & `object` & `object` & `object` & `object` & `object` & `object` & `object` & `object` & `object` & `object` & `object` & `object` |

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `namespace` | [`Namespace`](../interfaces/Namespace.md) | Namespace the traversal shouldn't leave. |
| `listeners` | `T` | Type listeners. |
| `options` | [`NamespaceNavigationOptions`](../interfaces/NamespaceNavigationOptions.md) | Scope options |

## Returns

wrapped listeners that that can be used with `navigateType`
