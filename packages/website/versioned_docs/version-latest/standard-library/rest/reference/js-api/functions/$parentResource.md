---
jsApi: true
title: "[F] $parentResource"

---
```ts
$parentResource(
   context, 
   entity, 
   parentType): void
```

`@parentResource` marks a model with a reference to its parent resource type

The first argument should be a reference to a model type which will be treated as the parent
type of the target model type.  This will cause the `@key` properties of all parent types of
the target type to show up in operations of the `Resource*<T>` interfaces defined in this library.

`@parentResource` can only be applied to models.

## Parameters

| Parameter | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Type` |
| `parentType` | `Model` |
