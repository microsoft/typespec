---
jsApi: true
title: "[F] skipTriviaBackward"

---
```ts
function skipTriviaBackward(
   script, 
   position, 
   endPosition): number
```

## Parameters

| Parameter | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `script` | [`TypeSpecScriptNode`](../interfaces/TypeSpecScriptNode.md) | `undefined` |  |
| `position` | `number` | `undefined` |  |
| `endPosition` | `number` | `-1` | exclude |

## Returns

`number`

return === endPosition (or -1) means not found non-trivia until endPosition + 1
