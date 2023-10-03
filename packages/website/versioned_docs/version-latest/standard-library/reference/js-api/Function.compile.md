---
jsApi: true
title: "[F] compile"

---
```ts
compile(
  host,
  mainFile,
  options = {},
  oldProgram?): Promise< Program >
```

## Parameters

| Parameter | Type |
| :------ | :------ |
| `host` | [`CompilerHost`](Interface.CompilerHost.md) |
| `mainFile` | `string` |
| `options` | [`CompilerOptions`](Interface.CompilerOptions.md) |
| `oldProgram`? | [`Program`](Interface.Program.md) |

## Returns

`Promise`< [`Program`](Interface.Program.md) \>
