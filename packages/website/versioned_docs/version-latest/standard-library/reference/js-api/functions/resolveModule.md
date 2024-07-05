---
jsApi: true
title: "[F] resolveModule"

---
```ts
function resolveModule(
   host, 
   name, 
options): Promise<ModuleResolutionResult>
```

Resolve a module

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `host` | [`ResolveModuleHost`](../interfaces/ResolveModuleHost.md) |  |
| `name` | `string` |  |
| `options` | [`ResolveModuleOptions`](../interfaces/ResolveModuleOptions.md) |  |

## Returns

`Promise`<[`ModuleResolutionResult`](../type-aliases/ModuleResolutionResult.md)\>
