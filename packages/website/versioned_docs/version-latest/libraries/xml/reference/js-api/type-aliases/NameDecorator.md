---
jsApi: true
title: "[T] NameDecorator"

---
```ts
type NameDecorator: (context, target, name) => void;
```

Provide the name of the XML element or attribute. This means the same thing as
 `@encodedName("application/xml", value)`

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context` | `DecoratorContext` | - |
| `target` | `Type` | - |
| `name` | `string` | The name of the XML element or attribute |

## Returns

`void`

## Example

```tsp
@name("XmlBook")
model Book {
  @name("XmlId") id: string;
  @encodedName("application/xml", "XmlName") name: string;
  content: string;
}
```

```xml
<XmlBook>
  <XmlId>string</XmlId>
  <XmlName>string</XmlName>
  <content>string</content>
</XmlBook>
```
