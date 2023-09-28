---
jsApi: true
title: "[F] getParameterVisibility"

---
```ts
getParameterVisibility(program, entity): string[] | undefined
```

Returns the visibilities of the parameters of the given operation, if provided with `@parameterVisibility`.

## Parameters

| Parameter | Type |
| :------ | :------ |
| `program` | [`Program`](Interface.Program.md) |
| `entity` | [`Operation`](Interface.Operation.md) |

## Returns

`string`[] \| `undefined`

## See

[$parameterVisibility](Namespace.decorators.Function.$parameterVisibility.md)
