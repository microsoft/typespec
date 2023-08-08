---
jsApi: true
title: "[F] getRequestVisibility"
---

```ts
getRequestVisibility(verb): Visibility
```

Determines the visibility to use for a request with the given verb.

- GET | HEAD => Visibility.Query
- POST => Visibility.Update
- PUT => Visibility.Create | Update
- DELETE => Visibility.Delete

## Parameters

| Parameter | Type                           |
| :-------- | :----------------------------- |
| `verb`    | [`HttpVerb`](Type.HttpVerb.md) |

## Returns

[`Visibility`](Enumeration.Visibility.md)

## Source

[metadata.ts:119](https://github.com/markcowl/cadl/blob/3db15286/packages/http/src/metadata.ts#L119)
