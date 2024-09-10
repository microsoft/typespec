---
jsApi: true
title: "[T] DefaultResponseDecorator"

---
```ts
type DefaultResponseDecorator: (context, target) => void;
```

Specify that this model is to be treated as the OpenAPI `default` response.
This differs from the compiler built-in `@error` decorator as this does not necessarily represent an error.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | `DecoratorContext` |
| `target` | `Model` |

## Returns

`void`

## Example

```typespec
@defaultResponse
model PetStoreResponse is object;

op listPets(): Pet[] | PetStoreResponse;
```
