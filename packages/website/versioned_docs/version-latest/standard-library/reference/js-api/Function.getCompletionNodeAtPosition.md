---
jsApi: true
title: "[F] getCompletionNodeAtPosition"

---
```ts
getCompletionNodeAtPosition(
  script,
  position,
  filter = ...): Node | undefined
```

Resolve the node that should be auto completed at the given position.
It will try to guess what node it could be as during auto complete the ast might not be complete.

## Parameters

| Parameter | Type |
| :------ | :------ |
| `script` | [`TypeSpecScriptNode`](Interface.TypeSpecScriptNode.md) |
| `position` | `number` |
| `filter` | (`node`) => `boolean` |

## Returns

[`Node`](Type.Node.md) \| `undefined`
