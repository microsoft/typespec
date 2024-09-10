---
jsApi: true
title: "[T] ExtensionDecorator"

---
```ts
type ExtensionDecorator: (context, target, key, value) => void;
```

Attach some custom data to the OpenAPI element generated from this type.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context` | `DecoratorContext` | - |
| `target` | `Type` | - |
| `key` | `string` | Extension key. Must start with `x-` |
| `value` | `Type` | Extension value. |

## Returns

`void`

## Example

```typespec
@extension("x-custom", "My value")
@extension("x-pageable", {nextLink: "x-next-link"})
op read(): string;
```
