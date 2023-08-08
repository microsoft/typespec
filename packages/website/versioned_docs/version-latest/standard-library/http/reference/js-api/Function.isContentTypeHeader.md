---
jsApi: true
title: "[F] isContentTypeHeader"
---

```ts
isContentTypeHeader(program, property): boolean
```

Check if the given model property is the content type header.

## Parameters

| Parameter  | Type            | Description     |
| :--------- | :-------------- | :-------------- |
| `program`  | `Program`       | Program         |
| `property` | `ModelProperty` | Model property. |

## Returns

`boolean`

True if the model property is marked as a header and has the name `content-type`(case insensitive.)

## Source

[content-types.ts:11](https://github.com/markcowl/cadl/blob/3db15286/packages/http/src/content-types.ts#L11)
