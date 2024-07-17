---
jsApi: true
title: "[F] serializeValueAsJson"

---
```ts
function serializeValueAsJson(
   program, 
   value, 
   type, 
   encodeAs?): unknown
```

Serialize the given TypeSpec value as a JSON object using the given type and its encoding annotations.
The Value MUST be assignable to the given type.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `program` | [`Program`](../interfaces/Program.md) |
| `value` | [`Value`](../type-aliases/Value.md) |
| `type` | [`Type`](../type-aliases/Type.md) |
| `encodeAs`? | [`EncodeData`](../interfaces/EncodeData.md) |

## Returns

`unknown`
