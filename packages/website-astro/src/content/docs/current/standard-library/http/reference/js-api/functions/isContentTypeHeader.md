---
jsApi: true
title: "[F] isContentTypeHeader"

---
```ts
isContentTypeHeader(program, property): boolean
```

Check if the given model property is the content type header.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `program` | `Program` | Program |
| `property` | `ModelProperty` | Model property. |

## Returns

True if the model property is marked as a header and has the name `content-type`(case insensitive.)
