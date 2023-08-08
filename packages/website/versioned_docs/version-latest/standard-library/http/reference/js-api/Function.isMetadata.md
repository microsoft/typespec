---
jsApi: true
title: "[F] isMetadata"
---

```ts
isMetadata(program, property): boolean
```

Determines if a property is metadata. A property is defined to be
metadata if it is marked `@header`, `@query`, `@path`, or `@statusCode`.

## Parameters

| Parameter  | Type            |
| :--------- | :-------------- |
| `program`  | `Program`       |
| `property` | `ModelProperty` |

## Returns

`boolean`

## Source

[metadata.ts:205](https://github.com/markcowl/cadl/blob/3db15286/packages/http/src/metadata.ts#L205)
