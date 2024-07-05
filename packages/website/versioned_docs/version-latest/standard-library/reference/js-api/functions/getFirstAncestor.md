---
jsApi: true
title: "[F] getFirstAncestor"

---
```ts
function getFirstAncestor(
   node, 
   test, 
   includeSelf): Node | undefined
```

## Parameters

| Parameter | Type | Default value |
| :------ | :------ | :------ |
| `node` | [`Node`](../type-aliases/Node.md) | `undefined` |
| `test` | [`NodeCallback`](../type-aliases/NodeCallback.md)<`boolean`\> | `undefined` |
| `includeSelf` | `boolean` | `false` |

## Returns

[`Node`](../type-aliases/Node.md) \| `undefined`
