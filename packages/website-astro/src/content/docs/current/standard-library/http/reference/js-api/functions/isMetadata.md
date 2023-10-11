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

| Parameter | Type |
| :------ | :------ |
| `program` | `Program` |
| `property` | `ModelProperty` |
