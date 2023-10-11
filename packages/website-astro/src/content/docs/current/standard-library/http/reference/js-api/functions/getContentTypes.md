---
jsApi: true
title: "[F] getContentTypes"

---
```ts
getContentTypes(property): [string[], readonly Diagnostic[]]
```

Resolve the content types from a model property by looking at the value.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `property` | `ModelProperty` | Model property |

## Returns

List of contnet types and any diagnostics if there was an issue.
