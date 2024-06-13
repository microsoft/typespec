---
jsApi: true
title: "[F] compile"

---
```ts
function compile(
   host, 
   mainFile, 
   options, 
oldProgram?): Promise<Program>
```

## Parameters

| Parameter | Type |
| :------ | :------ |
| `host` | [`CompilerHost`](../interfaces/CompilerHost.md) |
| `mainFile` | `string` |
| `options` | [`CompilerOptions`](../interfaces/CompilerOptions.md) |
| `oldProgram`? | [`Program`](../interfaces/Program.md) |

## Returns

`Promise`<[`Program`](../interfaces/Program.md)\>
