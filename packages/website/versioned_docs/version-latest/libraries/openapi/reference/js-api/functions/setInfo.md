---
jsApi: true
title: "[F] setInfo"

---
```ts
function setInfo(
   program, 
   entity, 
   data): void
```

Set the OpenAPI info node on for the given service namespace.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `program` | `Program` | Program |
| `entity` | `Namespace` | Service namespace |
| `data` | [`AdditionalInfo`](../interfaces/AdditionalInfo.md) & `Record`<\`x-$\{string\}\`, `unknown`\> | OpenAPI Info object |

## Returns

`void`
