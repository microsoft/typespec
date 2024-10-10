---
jsApi: true
title: "[F] resolveModule"

---
```ts
function resolveModule(
   host, 
   specifier, 
options): Promise<ModuleResolutionResult>
```

Resolve a module

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `host` | [`ResolveModuleHost`](../interfaces/ResolveModuleHost.md) |  |
| `specifier` | `string` |  |
| `options` | [`ResolveModuleOptions`](../interfaces/ResolveModuleOptions.md) |  |

## Returns

`Promise`<[`ModuleResolutionResult`](../type-aliases/ModuleResolutionResult.md)\>

## Throws

When the module cannot be resolved.
