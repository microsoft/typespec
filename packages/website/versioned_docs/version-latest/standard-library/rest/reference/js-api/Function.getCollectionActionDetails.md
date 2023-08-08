---
jsApi: true
title: "[F] getCollectionActionDetails"
---

```ts
getCollectionActionDetails(program, operation): ActionDetails | undefined
```

Gets the ActionDetails for the specified operation if it has previously been marked with @collectionAction.

## Parameters

| Parameter   | Type        |
| :---------- | :---------- |
| `program`   | `Program`   |
| `operation` | `Operation` |

## Returns

[`ActionDetails`](Interface.ActionDetails.md) \| `undefined`

## Source

[rest.ts:529](https://github.com/markcowl/cadl/blob/3db15286/packages/rest/src/rest.ts#L529)
