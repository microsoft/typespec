---
jsApi: true
title: "[F] isContentTypeHeader"

---
```ts
function isContentTypeHeader(program, property): boolean
```

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `program` | `Program` | Program |
| `property` | `ModelProperty` | Model property. |

## Returns

`boolean`

True if the model property is marked as a header and has the name `content-type`(case insensitive.)

## Deprecated

Use `OperationProperty.kind === 'contentType'` instead.
Check if the given model property is the content type header.
