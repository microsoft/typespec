---
jsApi: true
title: "[F] $resource"

---
```ts
$resource(
   context, 
   entity, 
   collectionName): void
```

`@resource` marks a model as a resource type.

The first argument should be the name of the collection that the resources
belong to.  For example, a resource type `Widget` might have a collection
name of `widgets`.

`@resource` can only be applied to models.

## Parameters

| Parameter | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Model` |
| `collectionName` | `string` |
