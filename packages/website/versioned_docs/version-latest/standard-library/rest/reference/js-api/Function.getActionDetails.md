---
jsApi: true
title: "[F] getActionDetails"
---

```ts
getActionDetails(program, operation): ActionDetails | undefined
```

Gets the ActionDetails for the specified operation if it has previously been marked with @action.

## Parameters

| Parameter   | Type        |
| :---------- | :---------- |
| `program`   | `Program`   |
| `operation` | `Operation` |

## Returns

[`ActionDetails`](Interface.ActionDetails.md) \| `undefined`

## Source

[rest.ts:485](https://github.com/markcowl/cadl/blob/1a6d2b70/packages/rest/src/rest.ts#L485)
