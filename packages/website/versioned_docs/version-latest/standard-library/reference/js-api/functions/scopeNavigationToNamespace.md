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
| `T` extends `Object` & `Object` & `Object` & `Object` & `Object` & `Object` & `Object` & `Object` & `Object` & `Object` & `Object` & `Object` & `Object` & `Object` & `Object` & `Object` & `Object` & `Object` & `Object` & `Object` & `Object` & `Object` & `Object` & `Object` |

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `namespace` | [`Namespace`](../interfaces/Namespace.md) | Namespace the traversal shouldn't leave. |
| `listeners` | `T` | Type listeners. |
| `options` | [`NamespaceNavigationOptions`](../interfaces/NamespaceNavigationOptions.md) | Scope options |

## Returns

`T`

wrapped listeners that that can be used with `navigateType`
