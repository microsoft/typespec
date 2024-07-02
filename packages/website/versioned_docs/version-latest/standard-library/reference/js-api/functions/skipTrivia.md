---
jsApi: true
title: "[F] skipTrivia"

---
```ts
function skipTrivia(
   input, 
   position, 
   endPosition): number
```

## Parameters

| Parameter | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `input` | `string` | `undefined` |  |
| `position` | `number` | `undefined` |  |
| `endPosition` | `number` | `input.length` | exclude |

## Returns

`number`

return === endPosition (or input.length) means not found non-trivia until endPosition - 1
