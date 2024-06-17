---
jsApi: true
title: "[F] getOpenAPI3"

---
```ts
function getOpenAPI3(program, options): Promise<OpenAPI3ServiceRecord[]>
```

Get the OpenAPI 3 document records from the given program. The documents are
returned as a JS object.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `program` | `Program` | The program to emit to OpenAPI 3 |
| `options` | `Omit`<`OpenAPI3EmitterOptions`, `IrrelevantOpenAPI3EmitterOptionsForObject`\> | OpenAPI 3 emit options |

## Returns

`Promise`<`OpenAPI3ServiceRecord`[]\>

An array of OpenAPI 3 document records.
