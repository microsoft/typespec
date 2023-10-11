---
jsApi: true
title: "[F] $route"

---
```ts
$route(
   context, 
   entity, 
   path, 
   parameters?): void
```

`@route` defines the relative route URI for the target operation

The first argument should be a URI fragment that may contain one or more path parameter fields.
If the namespace or interface that contains the operation is also marked with a `@route` decorator,
it will be used as a prefix to the route URI of the operation.

`@route` can only be applied to operations, namespaces, and interfaces.

## Parameters

| Parameter | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Type` |
| `path` | `string` |
| `parameters`? | `Model` |
