---
jsApi: true
title: "[F] $segment"

---
```ts
$segment(
   context, 
   entity, 
   name): void
```

`@segment` defines the preceding path segment for a `@path` parameter in auto-generated routes

The first argument should be a string that will be inserted into the operation route before the
path parameter's name field.

`@segment` can only be applied to model properties, operation parameters, or operations.

## Parameters

| Parameter | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Model` \| `ModelProperty` \| `Operation` |
| `name` | `string` |
