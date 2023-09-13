---
jsApi: true
title: "[F] resolveCompilerOptions"

---
```ts
resolveCompilerOptions(host, options): Promise< [CompilerOptions, readonly Diagnostic[]] >
```

Resolve the compiler options for the given entrypoint by resolving the tspconfig.yaml.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `host` | [`CompilerHost`](Interface.CompilerHost.md) | Compiler host |
| `options` | [`ResolveCompilerOptionsOptions`](Interface.ResolveCompilerOptionsOptions.md) | - |

## Returns

`Promise`< [[`CompilerOptions`](Interface.CompilerOptions.md), *readonly* [`Diagnostic`](Interface.Diagnostic.md)[]] \>
