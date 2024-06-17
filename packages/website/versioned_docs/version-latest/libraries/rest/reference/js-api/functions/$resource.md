---
jsApi: true
title: "[F] $resource"

---
```ts
function $resource(
   context, 
   target, 
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
| `target` | `Model` |
| `collectionName` | `string` |

## Returns

`void`
