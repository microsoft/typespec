---
jsApi: true
title: "[F] positionInRange"

---
```ts
function positionInRange(position, range): boolean
```

check whether a position belongs to a range (excluding the start and end pos)
i.e. <range.pos>{<start to return true>...<end to return true>}<range.end>

remark: if range.pos is -1 means no start point found, so return false
        if range.end is -1 means no end point found, so return true if position is greater than range.pos

## Parameters

| Parameter | Type |
| :------ | :------ |
| `position` | `number` |
| `range` | [`TextRange`](../interfaces/TextRange.md) |

## Returns

`boolean`
