---
jsApi: true
title: "[F] isMap"

---
```ts
isMap(program, m): boolean
```

Determines whether a type represents a Protobuf map.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `program` | `Program` | the program context |
| `m` | `Type` | the type to test |

## Returns

true if the internal representation of a Protobuf map is bound to this type.
