---
jsApi: true
title: "[F] getReturnTypeVisibility"

---
```ts
getReturnTypeVisibility(program, entity): string[] | undefined
```

Returns the visibilities of the return type of the given operation, if provided with `@returnTypeVisibility`.

## Parameters

| Parameter | Type |
| :------ | :------ |
| `program` | [`Program`](Interface.Program.md) |
| `entity` | [`Operation`](Interface.Operation.md) |

## Returns

`string`[] \| `undefined`

## See

[$returnTypeVisibility](Namespace.decorators.Function.$returnTypeVisibility.md)
