---
jsApi: true
title: "[F] indexTimeline"
---

```ts
indexTimeline(
  program,
  timeline,
  projectingMoment): ObjectType & TypePrototype & {isFinished: boolean;}
```

## Parameters

| Parameter          | Type                 |
| :----------------- | :------------------- |
| `program`          | `Program`            |
| `timeline`         | `VersioningTimeline` |
| `projectingMoment` | `TimelineMoment`     |

## Returns

`ObjectType` & `TypePrototype` & \{`isFinished`: `boolean`;}

## Source

[versioning/src/versioning.ts:552](https://github.com/markcowl/cadl/blob/3db15286/packages/versioning/src/versioning.ts#L552)
