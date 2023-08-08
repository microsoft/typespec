---
jsApi: true
title: "[F] includeInapplicableMetadataInPayload"
---

```ts
includeInapplicableMetadataInPayload(program, property): boolean
```

Determines if the given model property should be included in the payload if it is
inapplicable metadata.

## See

- isApplicableMetadata
- $includeInapplicableMetadataInPayload

## Parameters

| Parameter  | Type            |
| :--------- | :-------------- |
| `program`  | `Program`       |
| `property` | `ModelProperty` |

## Returns

`boolean`

## Source

[decorators.ts:662](https://github.com/markcowl/cadl/blob/3db15286/packages/http/src/decorators.ts#L662)
