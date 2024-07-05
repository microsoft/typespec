---
jsApi: true
title: "[F] getParameterVisibility"

---
```ts
function getParameterVisibility(program, entity): string[] | undefined
```

Returns the visibilities of the parameters of the given operation, if provided with `@parameterVisibility`.

## Parameters

| Parameter | Type |
| :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) |
| `entity` | [`Operation`](../interfaces/Operation.md) |

## Returns

`string`[] \| `undefined`

## See

[$parameterVisibility]($parameterVisibility.md)
