---
jsApi: true
title: "[T] AttributeDecorator"

---
```ts
type AttributeDecorator: (context, target) => void;
```

Specify that the target property should be encoded as an XML attribute instead of node.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | `DecoratorContext` |
| `target` | `ModelProperty` |

## Returns

`void`

## Examples

```tsp
model Blob {
  id: string;
}
```

```xml
<Blob>
  <id>abcdef</id>
</Blob>
```

```tsp
model Blob {
  @attribute id: string;
}
```

```xml
<Blob id="abcdef">
</Blob>
```
