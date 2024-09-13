---
jsApi: true
title: "[T] InfoDecorator"

---
```ts
type InfoDecorator: (context, target, additionalInfo) => void;
```

Specify OpenAPI additional information.
The service `title` and `version` are already specified using `@service`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context` | `DecoratorContext` | - |
| `target` | `Namespace` | - |
| `additionalInfo` | `Type` | Additional information |

## Returns

`void`
