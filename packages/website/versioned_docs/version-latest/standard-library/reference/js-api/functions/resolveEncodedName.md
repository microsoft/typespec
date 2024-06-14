---
jsApi: true
title: "[F] resolveEncodedName"

---
```ts
function resolveEncodedName(
   program, 
   target, 
   mimeType): string
```

Resolve the encoded name for the given type when serialized to the given mime type.
If a specific value was provided by `@encodedName` decorator for that mime type it will return that otherwise it will return the name of the type.

## Parameters

| Parameter | Type |
| :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) |
| `target` | [`Type`](../type-aliases/Type.md) & `object` |
| `mimeType` | `string` |

## Returns

`string`

## Example

For the given
```tsp
model Certificate {
  @encodedName("application/json", "exp")
  @encodedName("application/xml", "expiry")
  expireAt: utcDateTime;

}
```

```ts
resolveEncodedName(program, type, "application/json") // exp
resolveEncodedName(program, type, "application/merge-patch+json") // exp
resolveEncodedName(program, type, "application/xml") // expireAt
resolveEncodedName(program, type, "application/yaml") // expiry
```
