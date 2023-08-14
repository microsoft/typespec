---
jsApi: true
title: "[F] getContentTypes"
---

```ts
getContentTypes(property): [string[], readonly Diagnostic[]]
```

Resolve the content types from a model property by looking at the value.

## Parameters

| Parameter  | Type            | Description    |
| :--------- | :-------------- | :------------- |
| `property` | `ModelProperty` | Model property |

## Returns

[`string`[], _readonly_ `Diagnostic`[]]

List of contnet types and any diagnostics if there was an issue.

## Source

[content-types.ts:21](https://github.com/markcowl/cadl/blob/1a6d2b70/packages/http/src/content-types.ts#L21)
