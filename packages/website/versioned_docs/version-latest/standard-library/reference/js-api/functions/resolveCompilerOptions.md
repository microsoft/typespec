---
jsApi: true
title: "[F] resolveCompilerOptions"

---
```ts
resolveCompilerOptions(host, options): Promise<[CompilerOptions, readonly Diagnostic[]]>
```

Resolve the compiler options for the given entrypoint by resolving the tspconfig.yaml.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `host` | [`CompilerHost`](../interfaces/CompilerHost.md) | Compiler host |
| `options` | [`ResolveCompilerOptionsOptions`](../interfaces/ResolveCompilerOptionsOptions.md) | - |
