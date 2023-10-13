---
jsApi: true
title: "[F] isApplicableMetadata"

---
```ts
isApplicableMetadata(
   program, 
   property, 
   visibility, 
   isMetadataCallback): boolean
```

Determines if the given property is metadata that is applicable with the
given visibility.

- No metadata is applicable with Visibility.Item present.
- If only Visibility.Read is present, then only `@header` and `@status`
  properties are applicable.
- If Visibility.Read is not present, all metadata properties other than
  `@statusCode` are applicable.

## Parameters

| Parameter | Type | Default value |
| :------ | :------ | :------ |
| `program` | `Program` | `undefined` |
| `property` | `ModelProperty` | `undefined` |
| `visibility` | [`Visibility`](../enumerations/Visibility.md) | `undefined` |
| `isMetadataCallback` | (`program`, `property`) => `boolean` | `isMetadata` |
