---
jsApi: true
title: "[F] getPattern"

---
```ts
function getPattern(program, target): string | undefined
```

Gets the pattern regular expression associated with a given type, if one has been set.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) | the Program containing the target Type |
| `target` | [`Type`](../type-aliases/Type.md) | the type to get the pattern for |

## Returns

`string` \| `undefined`

the pattern string, if one was set

## See

getPatternData
