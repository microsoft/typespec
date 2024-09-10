---
jsApi: true
title: "[F] setExtension"

---
```ts
function setExtension(
   program, 
   entity, 
   extensionName, 
   data): void
```

Set OpenAPI extension on the given type. Equivalent of using `@extension` decorator

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `program` | `Program` | Program |
| `entity` | `Type` | Type to annotate |
| `extensionName` | \`x-$\{string\}\` | Extension key |
| `data` | `unknown` | Extension value |

## Returns

`void`
