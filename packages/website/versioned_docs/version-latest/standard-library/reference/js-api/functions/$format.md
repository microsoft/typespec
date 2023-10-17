---
jsApi: true
title: "[F] $format"

---
```ts
$format(
   context, 
   target, 
   format): void
```

`@format` - specify the data format hint for a string type

The first argument is a string that identifies the format that the string type expects.  Any string
can be entered here, but a TypeSpec emitter must know how to interpret

For TypeSpec specs that will be used with an OpenAPI emitter, the OpenAPI specification describes possible
valid values for a string type's format:

https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.3.md#dataTypes

`@format` can be specified on a type that extends from `string` or a `string`-typed model property.

## Parameters

| Parameter | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `target` | [`ModelProperty`](../interfaces/ModelProperty.md) \| [`Scalar`](../interfaces/Scalar.md) |
| `format` | `string` |
