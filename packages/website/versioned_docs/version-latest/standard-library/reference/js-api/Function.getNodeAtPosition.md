---
jsApi: true
title: "[F] getNodeAtPosition"

---
```ts
getNodeAtPosition(
  script,
  position,
  filter?): Node | undefined
```

Resolve the node in the syntax tree that that is at the given position.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `script` | [`TypeSpecScriptNode`](Interface.TypeSpecScriptNode.md) | TypeSpec Script node |
| `position` | `number` | Position |
| `filter`? | (`node`) => `boolean` | Filter if wanting to return a parent containing node early. |

## Returns

[`Node`](Type.Node.md) \| `undefined`

```ts
getNodeAtPosition<T>(
  script,
  position,
  filter): T | undefined
```

## Type parameters

| Parameter |
| :------ |
| `T` *extends* [`Node`](Type.Node.md) |

## Parameters

| Parameter | Type |
| :------ | :------ |
| `script` | [`TypeSpecScriptNode`](Interface.TypeSpecScriptNode.md) |
| `position` | `number` |
| `filter` | (`node`) => `node is T` |

## Returns

`T` \| `undefined`
