---
jsApi: true
title: "[T] NsDecorator"

---
```ts
type NsDecorator: (context, target, ns, prefix?) => void;
```

Specify the XML namespace for this element. It can be used in 2 different ways:
1. `@ns("http://www.example.com/namespace", "ns1")` - specify both namespace and prefix
2. `@Xml.ns(Namespaces.ns1)` - pass a member of an enum decorated with `@nsDeclaration`

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context` | `DecoratorContext` | - |
| `target` | `Type` | - |
| `ns` | `Type` | The namespace URI or a member of an enum decorated with `@nsDeclaration`. |
| `prefix`? | `string` | The namespace prefix. Required if the namespace parameter was passed as a string. |

## Returns

`void`

## Examples

```tsp
@ns( "https://example.com/ns1", "ns1")
model Foo {
  @ns("https://example.com/ns1", "ns1")
  bar: string
  @ns("https://example.com/ns2", "ns2")
  bar: string
}
```

```tsp
@Xml.nsDeclarations
enum Namespaces {
  ns1: "https://example.com/ns1",
  ns2: "https://example.com/ns2"
}

@Xml.ns(Namespaces.ns1)
model Foo {
  @Xml.ns(Namespaces.ns1)
  bar: string
  @Xml.ns(Namespaces.ns2)
  bar: string
}
```
