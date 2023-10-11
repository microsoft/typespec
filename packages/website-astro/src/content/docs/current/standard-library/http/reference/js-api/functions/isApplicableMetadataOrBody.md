---
jsApi: true
title: "[F] isApplicableMetadataOrBody"

---
```ts
isApplicableMetadataOrBody(
   program, 
   property, 
   visibility, 
   isMetadataCallback): boolean
```

Determines if the given property is metadata or marked `@body` and
applicable with the given visibility.

## Parameters

| Parameter | Type | Default value |
| :------ | :------ | :------ |
| `program` | `Program` | `undefined` |
| `property` | `ModelProperty` | `undefined` |
| `visibility` | [`Visibility`](../enumerations/Visibility.md) | `undefined` |
| `isMetadataCallback` | (`program`, `property`) => `boolean` | `isMetadata` |
