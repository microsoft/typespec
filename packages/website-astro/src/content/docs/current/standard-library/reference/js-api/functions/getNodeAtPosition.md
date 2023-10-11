---
jsApi: true
title: "[F] getNodeAtPosition"

---
## getNodeAtPosition(script, position, filter)

```ts
getNodeAtPosition(
   script, 
   position, 
   filter?): Node | undefined
```

Resolve the node in the syntax tree that that is at the given position.

### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `script` | [`TypeSpecScriptNode`](../interfaces/TypeSpecScriptNode.md) | TypeSpec Script node |
| `position` | `number` | Position |
| `filter`? | (`node`) => `boolean` | Filter if wanting to return a parent containing node early. |

## getNodeAtPosition(script, position, filter)

```ts
getNodeAtPosition<T>(
   script, 
   position, 
   filter): T | undefined
```

### Type parameters

| Parameter |
| :------ |
| `T` extends [`Node`](../type-aliases/Node.md) |

### Parameters

| Parameter | Type |
| :------ | :------ |
| `script` | [`TypeSpecScriptNode`](../interfaces/TypeSpecScriptNode.md) |
| `position` | `number` |
| `filter` | (`node`) => `node is T` |
