---
jsApi: true
title: "[F] getTypeBeforeVersion"
---

```ts
getTypeBeforeVersion(
  p,
  t,
  versionKey): Type | undefined
```

## Parameters

| Parameter    | Type         |
| :----------- | :----------- |
| `p`          | `Program`    |
| `t`          | `Type`       |
| `versionKey` | `ObjectType` |

## Returns

`Type` \| `undefined`

get old type if applicable.

## Source

[versioning/src/versioning.ts:213](https://github.com/markcowl/cadl/blob/3db15286/packages/versioning/src/versioning.ts#L213)
