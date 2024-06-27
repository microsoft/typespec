---
jsApi: true
title: "[I] PositionDetail"

---
owner node and other related information according to the position

## Properties

| Property | Modifier | Type | Description |
| :------ | :------ | :------ | :------ |
| `char` | `readonly` | `number` | - |
| `getPositionDetailAfterTrivia` | `readonly` | () => [`PositionDetail`](PositionDetail.md) | get the PositionDetail of positionAfterTrivia |
| `getPositionDetailBeforeTrivia` | `readonly` | () => [`PositionDetail`](PositionDetail.md) | get the PositionDetail of positionBeforeTrivia |
| `inTrivia` | `readonly` | `boolean` | - |
| `nextChar` | `readonly` | `number` | - |
| `node` | `readonly` | `undefined` \| [`Node`](../type-aliases/Node.md) | - |
| `position` | `readonly` | `number` | - |
| `preChar` | `readonly` | `number` | - |
| `triviaEndPosition` | `readonly` | `number` | <p>if the position is in a trivia, return the end position (exclude as other 'end' means) of the trivia containing the position if the position is not a trivia, return the end position (exclude as other 'end' means) of the trivia after the node containing the position</p><p>Please be aware that this may not be the next node in the tree because some non-trivia char is ignored in the tree but will considered here</p><p>also comments are considered as trivia</p> |
| `triviaStartPosition` | `readonly` | `number` | <p>if the position is in a trivia, return the start position of the trivia containing the position if the position is not a trivia, return the start position of the trivia before the text(identifier code) containing the position</p><p>Please be aware that this may not be the pre node in the tree because some non-trivia char is ignored in the tree but will counted here</p><p>also comments are considered as trivia</p> |
