---
jsApi: true
title: "[F] $autoRoute"

---
```ts
$autoRoute(context, entity): void
```

`@autoRoute` enables automatic route generation for an operation or interface.

When applied to an operation, it automatically generates the operation's route based on path parameter
metadata.  When applied to an interface, it causes all operations under that scope to have
auto-generated routes.

## Parameters

| Parameter | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Interface` \| `Operation` |
