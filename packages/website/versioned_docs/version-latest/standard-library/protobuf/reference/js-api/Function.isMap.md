---
jsApi: true
title: "[F] isMap"
---

```ts
isMap(program, m): boolean
```

Determines whether a type represents a Protobuf map.

## Parameters

| Parameter | Type      | Description         |
| :-------- | :-------- | :------------------ |
| `program` | `Program` | the program context |
| `m`       | `Type`    | the type to test    |

## Returns

`boolean`

true if the internal representation of a Protobuf map is bound to this type.

## Source

[proto.ts:81](https://github.com/markcowl/cadl/blob/1a6d2b70/packages/protobuf/src/proto.ts#L81)
