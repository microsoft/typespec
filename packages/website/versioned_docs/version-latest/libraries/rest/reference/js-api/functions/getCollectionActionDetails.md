---
jsApi: true
title: "[F] getCollectionActionDetails"

---
```ts
function getCollectionActionDetails(program, operation): ActionDetails | undefined
```

Gets the ActionDetails for the specified operation if it has previously been marked with @collectionAction.

## Parameters

| Parameter | Type |
| :------ | :------ |
| `program` | `Program` |
| `operation` | `Operation` |

## Returns

[`ActionDetails`](../interfaces/ActionDetails.md) \| `undefined`
