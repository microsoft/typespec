---
jsApi: true
title: "[F] getPatternData"

---
```ts
function getPatternData(program, target): PatternData | undefined
```

Gets the associated pattern data, including the pattern regular expression and optional validation message, if any
has been set.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) | the Program containing the target Type |
| `target` | [`Type`](../type-aliases/Type.md) | the type to get the pattern data for |

## Returns

[`PatternData`](../interfaces/PatternData.md) \| `undefined`

the pattern data, if any was set
