---
jsApi: true
title: "[T] UnwrappedDecorator"

---
```ts
type UnwrappedDecorator: (context, target) => void;
```

Specify that the target property shouldn't create a wrapper node. This can be used to flatten list nodes into the model node or to include raw text in the model node.
It cannot be used with `@attribute`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | `DecoratorContext` |
| `target` | `ModelProperty` |

## Returns

`void`

## Examples

```tsp
model Pet {
  tags: Tag[];
}
```

```xml
<XmlPet>
  <ItemsTags>
    <XmlTag>
      <name>string</name>
    </XmlTag>
  </ItemsTags>
</XmlPet>
```

```tsp
model Pet {
  @unwrapped tags: Tag[];
}
```

```xml
<XmlPet>
  <XmlTag>
    <name>string</name>
  </XmlTag>
</XmlPet>
```

```tsp
model BlobName {
  content: string;
}
```

```xml
<BlobName>
  <content>
    abcdef
  </content>
</BlobName>
```

```tsp
model BlobName {
  @unwrapped content: string;
}
```

```xml
<BlobName>
  abcdef
</BlobName>
```
