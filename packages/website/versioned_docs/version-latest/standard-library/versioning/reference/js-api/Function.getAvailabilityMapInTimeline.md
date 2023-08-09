---
jsApi: true
title: "[F] getAvailabilityMapInTimeline"
---

```ts
getAvailabilityMapInTimeline(
  program,
  type,
  timeline): Map< TimelineMoment, Availability > | undefined
```

## Parameters

| Parameter  | Type                 |
| :--------- | :------------------- |
| `program`  | `Program`            |
| `type`     | `Type`               |
| `timeline` | `VersioningTimeline` |

## Returns

`Map`< `TimelineMoment`, [`Availability`](Enumeration.Availability.md) \> \| `undefined`

## Source

[versioning/src/versioning.ts:729](https://github.com/markcowl/cadl/blob/1a6d2b70/packages/versioning/src/versioning.ts#L729)
