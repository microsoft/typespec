---
jsApi: true
title: "[F] isApplicableMetadataOrBody"
---

```ts
isApplicableMetadataOrBody(
  program,
  property,
  visibility,
  isMetadataCallback = isMetadata): boolean
```

Determines if the given property is metadata or marked `@body` and
applicable with the given visibility.

## Parameters

| Parameter            | Type                                      | Default value |
| :------------------- | :---------------------------------------- | :------------ |
| `program`            | `Program`                                 | `undefined`   |
| `property`           | `ModelProperty`                           | `undefined`   |
| `visibility`         | [`Visibility`](Enumeration.Visibility.md) | `undefined`   |
| `isMetadataCallback` | (`program`, `property`) => `boolean`      | `isMetadata`  |

## Returns

`boolean`

## Source

[metadata.ts:244](https://github.com/markcowl/cadl/blob/1a6d2b70/packages/http/src/metadata.ts#L244)
