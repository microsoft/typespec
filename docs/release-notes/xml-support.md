# Xml Basic Support Proposal

To get basic support for xml we should get parity with OpenAPI

- Swagger/OAS 2.0: https://swagger.io/specification/v2/#xml-object
- OAS 3.0: https://swagger.io/specification/v3/#xml-object\
- OAS 3.1: https://spec.openapis.org/oas/latest.html#xml-modeling

This means we need to have ways of specifying the following:

| Field Name | Type    | Description                                                                                                                                                                                                                                                                                                                                                  |
| ---------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| name       | string  | Replaces the name of the element/attribute used for the described schema property. When defined within items, it will affect the name of the individual XML elements within the list. When defined alongside type being array (outside the items), it will affect the wrapping element and only if wrapped is true. If wrapped is false, it will be ignored. |
| namespace  | string  | The URI of the namespace definition. This MUST be in the form of an absolute URI.                                                                                                                                                                                                                                                                            |
| prefix     | string  | The prefix to be used for the name.                                                                                                                                                                                                                                                                                                                          |
| attribute  | boolean | Declares whether the property definition translates to an attribute instead of an element. Default value is false.                                                                                                                                                                                                                                           |
| wrapped    | boolean | MAY be used only for an array definition. Signifies whether the array is wrapped (for example, <books><book/><book/></books>) or unwrapped (<book/><book/>). Default value is false. The definition takes effect only when defined alongside type being array (outside the items).                                                                           |
| x-ms-text  | boolean | [Autorest doc](https://azure.github.io/autorest/extensions/#x-ms-text) \| [OpenAPI Issue](https://github.com/OAI/OpenAPI-Specification/issues/630)                                                                                                                                                                                                           |

## Attributes coverage

### 1. `name`

Name is something we can already provide with `@encodedName("application/xml", "<newname>")`

#### 1.b Consider `@Xml.name` decorator

If overriding the name is common enough we could consider adding a `@Xml.name` decorator that would just call `@encodedName("application/xml", "<newname>")` for you.

### 2. `attribute`

Decorator would specify that this property should be serialized as an attribute instead.

```tsp
extern dec attribute(target: ModelProperty);
```

### 3. `wrapped` and `x-ms-text`

Proposing that when dealing with arrays we always wrap them by default.
We are saying that there is always a node created for a property.
We then have a decorator `@unwrapped` that allows you to not wrap the property content.
In the case of an array property this is equivalent to setting `wrapped: false` in OpenAPI.
In the case of a scalar property this is equivalent to setting `x-ms-text: true` in OpenAPI with Autorest extensions.

```tsp
extern dec unwrapped(target: ModelProperty);
```

### 4. `namespace` and `prefix`

Define a new `namespace` decorator that can be used in two ways.

```tsp
extern dec namespace(target: unknown, prefix: string, namespace: string)
extern dec namespace(target: unknown, namespace: EnumMember)
```

1. Simple but more verbose as you need to keep reusing the same namespace

```tsp
@namespace("ns1", "https://example.com/ns1")
model Foo {
  @namespace("ns1", "https://example.com/ns1")
  bar: string
  @namespace("ns2", "https://example.com/ns2")
  bar: string
}
```

You could also use an alias to reuse

```tsp
alias ns1 = "https://example.com/ns1";
alias ns2 = "https://example.com/ns2";
@namespace("ns1", ns1)
model Foo {
  @namespace("ns1", ns1)
  bar: string
  @namespace("ns2", ns2)
  bar: string
}
```

2. Using an enum to define the namespace:

```tsp
enum Namespaces {
  ns1 = "https://example.com/ns1",
  ns2 = "https://example.com/ns2"
}

@Xml.namespace(Namespaces.ns1)
model Foo {
  @Xml.namespace(Namespaces.ns1)
  bar: string
  @Xml.namespace(Namespaces.ns2)
  bar: string
}
```

#### 4.a Do we need a decorator to annoate the enum?

```tsp
@Xml.namespaceDeclarations
enum Namespaces {
  ns1 = "https://example.com/ns1",
  ns2 = "https://example.com/ns2"
}

@Xml.namespace(Namespaces.ns1)
model Foo {
  @Xml.namespace(Namespaces.ns1)
  bar: string
  @Xml.namespace(Namespaces.ns2)
  bar: string
}
```

### 5. `x-ms-text`

## Shorter names

- `@encodedName` -> `@Xml.name`
- `@Xml.attribute` -> `@Xml.attr`
- `@Xml.namespace` -> `@Xml.ns`
- `@Xml.namespaceDeclarations` -> `@Xml.nsDeclarations`
- `@Xml.unwrapped` -> `@Xml.unwrapped`

## Examples

### 1. Array of primitive types

<table>
<tr>
  <td>Scenario</td>
  <td>TypeSpec</td>
  <td>Xml</td>
  <td>OpenAPI3</td>
</tr>
<!-- ---------------------------------------------------  SCENARIO 1.1  ----------------------------------------------------------- -->
<tr>
<td>

**Scenario 1.1:**

- ❌ ItemsName
- ❌ Wrapped

</td>
<td>

```tsp
@encodedName("application/xml", "XmlPet")
model Pet {
  @xml.unwrapped
  tags: string[];
}
```

</td>
<td>

```xml
<XmlPet>
  <tags>string</tags>
</XmlPet>
```

</td>
<td>

```yaml
Pet:
  type: "object"
  properties:
    tags:
      type: "array"
      items:
        type: string
  xml:
    name: "XmlPet"
```

</td>
</tr>

<!-- --------------------------------------------------  SCENARIO 1.2 ------------------------------------------------------------ -->
<tr>
<td>

**Scenario 1.2:**

- ❌ ItemsName
- ✅ Wrapped

</td>
<td>

```tsp
@encodedName("application/xml", "XmlPet")
model Pet {
  @encodedName("application/xml", "ItemsTags")
  tags: string[];
}
```

</td>
<td>

```xml
<XmlPet>
  <ItemsTags>
    <ItemsTags>string</ItemsTags>
  </ItemsTags>
</XmlPet>
```

</td>
<td>

```yaml
Pet:
  type: "object"
  properties:
    tags:
      type: "array"
      xml:
        name: "ItemsTags"
        wrapped: true
      items:
        type: string
  xml:
    name: "XmlPet"
```

</td>
</tr>

<!-- ----------------------------------------------------  SCENARIO 1.3 ---------------------------------------------------------- -->
<tr>
<td>

**Scenario 1.3:**

- ✅ ItemsName
- ❌ Wrapped

</td>
<td>

```tsp
@encodedName("application/xml", "ItemsName")
scalar tag extends string;

@encodedName("application/xml", "XmlPet")
model Pet {
  @xml.unwrapped
  tags: tag[];
}
```

</td>
<td>

```xml
<XmlPet>
  <ItemsName>string</ItemsName>
</XmlPet>
```

</td>
<td>

```yaml
Pet:
  type: "object"
  properties:
    tags:
      type: "array"
      xml:
        name: "ItemsTags"
      items:
        type: string
        xml:
          name: ItemsName
  xml:
    name: "XmlPet"
```

</td>
</tr>

<!-- ----------------------------------------------------  SCENARIO 1.4 ---------------------------------------------------------- -->
<tr>
<td>

**Scenario 1.4:**

- ✅ ItemsName
- ✅ Wrapped

</td>
<td>

```tsp
@encodedName("application/xml", "ItemsName")
scalar tag extends string;

@encodedName("application/xml", "XmlPet")
model Pet {
  tags: tag[];
}
```

</td>
<td>

```xml
<XmlPet>
  <ItemsTags>
    <ItemsName>string</ItemsName>
  </ItemsTags>
</XmlPet>
```

</td>
<td>

```yaml
Pet:
  type: "object"
  properties:
    tags:
      type: "array"
      xml:
        name: "ItemsTags"
        wrapped: true
      items:
        type: string
        xml:
          name: ItemsName
  xml:
    name: "XmlPet"
```

</td>
</tr>
<!-- -------------------------------------------------------------------------------------------------------------- -->

</table>

### 2. Complex array types

<table>
<tr>
  <td>Scenario</td>
  <td>TypeSpec</td>
  <td>Xml</td>
  <td>OpenAPI3</td>
</tr>
<!-- ---------------------------------------------------  SCENARIO 2.1  ----------------------------------------------------------- -->
<tr>
<td>

**Scenario 2.1:**

- ❌ ItemsName
- ❌ Wrapped

</td>
<td>

```tsp
@encodedName("application/xml", "XmlPet")
model Pet {
  @xml.unwrapped
  tags: Tag[];
}

@encodedName("application/xml", "XmlTag")
model Tag {
  name: string;
}
```

</td>
<td>

```xml
<XmlPet>
  <XmlTag>
    <name>string</name>
  </XmlTag>
</XmlPet>
```

</td>
<td>

```yaml
Tag:
  type: "object"
  properties:
    name:
      type: "string"
  xml:
    name: "XmlTag"
Pet:
  type: "object"
  properties:
    tags:
      type: "array"
      items:
        $ref: "#/definitions/Tag"
  xml:
    name: "XmlPet"
```

</td>
</tr>

<!-- --------------------------------------------------  SCENARIO 2.2 ------------------------------------------------------------ -->
<tr>
<td>

**Scenario 2.2:**

- ❌ ItemsName
- ✅ Wrapped

</td>
<td>

```tsp
@encodedName("application/xml", "XmlPet")
model Pet {
  tags: Tag[];
}

@encodedName("application/xml", "XmlTag")
model Tag {
  name: string;
}
```

</td>
<td>

```xml
<XmlPet>
  <ItemsTags>
    <XmlTag>
      <name>string</name>
    </XmlTag>
  </ItemsTags>
</XmlPet>
```

</td>
<td>

```yaml
Tag:
  type: "object"
  properties:
    name:
      type: "string"
  xml:
    name: "XmlTag"
Pet:
  type: "object"
  properties:
    tags:
      type: "array"
      xml:
        name: "ItemsTags"
        wrapped: true
      items:
        $ref: "#/definitions/Tag"
  xml:
    name: "XmlPet"
```

</td>
</tr>

<!-- ----------------------------------------------------  SCENARIO 2.3 ---------------------------------------------------------- -->
<tr>
<td>

**Scenario 2.3:**

- ✅ ItemsName
- ❌ Wrapped

</td>
<td>

```tsp
@encodedName("application/xml", "XmlPet")
model Pet {
  @encodedName("application/xml", "ItemsTags")
  @xml.unwrapped
  tags: Tag[];
}

@encodedName("application/xml", "XmlTag")
model Tag {
  name: string;
}
```

</td>
<td>

```xml
<XmlPet>
  <ItemsTag>
    <name>string</name>
  </ItemsTag>
</XmlPet>
```

</td>
<td>

```yaml
Tag:
    type: "object"
    properties:
      name:
        type: "string"
    xml:
      name: "XmlTag"
  Pet:
    type: "object"
    properties:
      tags:
        type: "array"
        xml:
          name: "ItemsTags"
        items:
          $ref: "#/definitions/Tag"
          xml:
              name: ItemsXMLName
    xml:
      name: "XmlPet"
```

</td>
</tr>

<!-- ----------------------------------------------------  SCENARIO 2.4 ---------------------------------------------------------- -->
<tr>
<td>

**Scenario 2.4:**

- ✅ ItemsName
- ✅ Wrapped

</td>
<td>

```tsp
@encodedName("application/xml", "XmlPet")
model Pet {
  @encodedName("application/xml", "ItemsTags")
  tags: Tag[];
}

@encodedName("application/xml", "XmlTag")
model Tag {
  name: string;
}
```

</td>
<td>

```xml
<XmlPet>
  <ItemsTags>
    <XmlTag>
      <name>string</name>
    </XmlTag>
  </ItemsTags>
</XmlPet>
```

</td>
<td>

```yaml
Tag:
  type: "object"
  properties:
    name:
      type: "string"
Pet:
  type: "object"
  properties:
    tags:
      type: "array"
      xml:
        name: "ItemsTags"
        wrapped: true
      items:
        $ref: "#/definitions/Tag"
  xml:
    name: "XmlPet"
```

</td>
</tr>
<!-- -------------------------------------------------------------------------------------------------------------- -->

</table>

### 3. Nested models

<table>
<tr>
  <td>Scenario</td>
  <td>TypeSpec</td>
  <td>Xml</td>
  <td>OpenAPI3</td>
</tr>
<!-- ---------------------------------------------------  SCENARIO 3.1  ----------------------------------------------------------- -->
<tr>
<td>

**Scenario 3.1:**

No annotations

</td>
<td>

```tsp
model Book {
  author: Author;
}

model Author {
  name: string;
}
```

</td>
<td>

```xml
<Book>
  <author>
    <name>string</name>
  </author>
</Book>
```

</td>
<td>

```yaml
Book:
  type: object
  properties:
    author:
      $ref: "#/components/schemas/Author"
Author:
  type: object
  properties:
    name:
      type: string
```

</td>
</tr>

<!-- ---------------------------------------------------  SCENARIO 3.2  ----------------------------------------------------------- -->
<tr>
<td>

**Scenario 3.2:**

Nested model has xml encoded name.

_⚠️ no op in serialization of Book_

</td>
<td>

```tsp
model Book {
  author: Author;
}

@encodedName("application/xml", "XmlAuthor")
model Author {
  name: string;
}
```

</td>
<td>

```xml
<Book>
  <author>
    <name>string</name>
  </author>
</Book>
```

</td>
<td>

```yaml
Book:
  type: object
  properties:
    author:
      allOf:
        - $ref: "#/components/schemas/Author"
      xml:
        name: "author" # Here we have to redefine this name otherwise in OpenAPI semantic the `XmlAuthor` name would be used
Author:
  type: object
  properties:
    name:
      type: string
  xml:
    name: "XmlAuthor"
```

</td>
</tr>

<!-- ---------------------------------------------------  SCENARIO 3.3  ----------------------------------------------------------- -->
<tr>
<td>

**Scenario 3.2:**

Property has encoded name

</td>
<td>

```tsp
model Book {
  @encodedName("application/xml", "xml-author")
  author: Author;
}

model Author {
  name: string;
}
```

</td>
<td>

```xml
<Book>
  <xml-author>
    <name>string</name>
  </xml-author>
</Book>
```

</td>
<td>

```yaml
Book:
  type: object
  properties:
    author:
      allOf:
        - $ref: "#/components/schemas/Author"
      xml:
        name: "xml-author"
Author:
  type: object
  properties:
    name:
      type: string
```

</td>
</tr>

<!-- -------------------------------------------------------------------------------------------------------------- -->

</table>

### 4. Attributes

<table>
<tr>
  <td>Scenario</td>
  <td>TypeSpec</td>
  <td>Xml</td>
  <td>OpenAPI3</td>
</tr>
<!-- ---------------------------------------------------  SCENARIO 4.1  ----------------------------------------------------------- -->
<tr>
<td>

**Scenario 4.1:**

Convert a property to an attribute

</td>
<td>

```tsp
model Book {
  @Xml.attribute
  id: string;

  title: string;
  author: string;
}
```

</td>
<td>

```xml
<Book>
  <id>0</id>
  <xml-title>string</xml-title>
  <author>string</author>
</Book>
```

</td>
<td>

```yaml
Book:
  type: object
  properties:
    id:
      type: integer
    title:
      type: string
      xml:
        name: "xml-title"
    author:
      type: string
```

</td>
</tr>

<!-- -------------------------------------------------------------------------------------------------------------- -->

</table>

### 5. Namespace and prefix (inline form)

<table>
<tr>
  <td>Scenario</td>
  <td>TypeSpec</td>
  <td>Xml</td>
  <td>OpenAPI3</td>
</tr>
<!-- ---------------------------------------------------  SCENARIO 5.1  ----------------------------------------------------------- -->
<tr>
<td>

**Scenario 5.1:**

On model

</td>
<td>

```tsp
@Xml.namespace("smp", "http://example.com/schema")
model Book {
  id: string;
  title: string;
  author: string;
}
```

</td>
<td>

```xml
<smp:Book xmlns:smp="http://example.com/schema">
  <id>0</id>
  <title>string</title>
  <author>string</author>
</smp:Book>
```

</td>
<td>

```yaml
Book:
  type: object
  properties:
    id:
      type: integer
    title:
      type: string
    author:
      type: string
  xml:
    prefix: "smp"
    namespace: "http://example.com/schema"
```

</td>
</tr>

<!-- ---------------------------------------------------  SCENARIO 5.2  ----------------------------------------------------------- -->
<tr>
<td>

**Scenario 5.2:**

On model and properties

</td>
<td>

```tsp
@Xml.namespace("smp", "http://example.com/schema")
model Book {
  id: string;
  @Xml.namespace("smp", "http://example.com/schema")
  title: string;
  @Xml.namespace("ns2", "http://example.com/ns2")
  author: string;
}
```

</td>
<td>

```xml
<smp:Book xmlns:smp="http://example.com/schema" xmlns:sn2="http://example.com/ns2">
  <id>0</id>
  <smp:title>string</smp:title>
  <ns2:author>string</ns2:author>
</smp:Book>
```

</td>
<td>

```yaml
Book:
  type: object
  properties:
    id:
      type: integer
    title:
      type: string
       xml:
        prefix: "smp"
        namespace: "http://example.com/schema"
    author:
      type: string
      xml:
        prefix: "ns2"
        namespace: "http://example.com/ns2"
  xml:
    prefix: "smp"
    namespace: "http://example.com/schema"
```

</td>
</tr>

<!-- -------------------------------------------------------------------------------------------------------------- -->

</table>

### 6. Namespace and prefix (normalized form)

<table>
<tr>
  <td>Scenario</td>
  <td>TypeSpec</td>
  <td>Xml</td>
  <td>OpenAPI3</td>
</tr>
<!-- ---------------------------------------------------  SCENARIO 6.1  ----------------------------------------------------------- -->
<tr>
<td>

**Scenario 6.1:**

On model

</td>
<td>

```tsp
@Xml.namespaceDeclarations
enum Namespaces {
  smp = "http://example.com/schema"
}

@Xml.namespace(Namespaces.smp)
model Book {
  id: string;
  title: string;
  author: string;
}
```

</td>
<td>

```xml
<smp:Book xmlns:smp="http://example.com/schema">
  <id>0</id>
  <title>string</title>
  <author>string</author>
</smp:Book>
```

</td>
<td>

```yaml
Book:
  type: object
  properties:
    id:
      type: integer
    title:
      type: string
    author:
      type: string
  xml:
    prefix: "smp"
    namespace: "http://example.com/schema"
```

</td>
</tr>

<!-- ---------------------------------------------------  SCENARIO 6.2  ----------------------------------------------------------- -->
<tr>
<td>

**Scenario 6.2:**

On model and properties

</td>
<td>

```tsp
@Xml.namespaceDeclarations
enum Namespaces {
  smp = "http://example.com/schema",
  ns2 = "http://example.com/ns2"
}

@Xml.namespace(Namespaces.smp)
model Book {
  id: string;
  @Xml.namespace(Namespaces.smp)
  title: string;
  @Xml.namespace(Namespaces.ns2)
  author: string;
}
```

</td>
<td>

```xml
<smp:Book xmlns:smp="http://example.com/schema" xmlns:sn2="http://example.com/ns2">
  <id>0</id>
  <smp:title>string</smp:title>
  <ns2:author>string</ns2:author>
</smp:Book>
```

</td>
<td>

```yaml
Book:
  type: object
  properties:
    id:
      type: integer
    title:
      type: string
       xml:
        prefix: "smp"
        namespace: "http://example.com/schema"
    author:
      type: string
      xml:
        prefix: "ns2"
        namespace: "http://example.com/ns2"
  xml:
    prefix: "smp"
    namespace: "http://example.com/schema"
```

</td>
</tr>

<!-- -------------------------------------------------------------------------------------------------------------- -->

</table>

### 6. Property setting the text of the node

<table>
<tr>
  <td>Scenario</td>
  <td>TypeSpec</td>
  <td>Xml</td>
  <td>OpenAPI3</td>
</tr>
<!-- ---------------------------------------------------  SCENARIO 6.1  ----------------------------------------------------------- -->
<tr>
<td>

**Scenario 6.1:**

</td>
<td>

```tsp
model BlobName {
  @Xml.attribute language: string;
  @Xml.unwrapped content: string;
}
```

</td>
<td>

```xml
<BlobName language="abc">
  ...content...
</smp:Book>
```

</td>
<td>

```yaml
Book:
  type: object
  properties:
    language:
      type: string
    content:
      type: string
      xml:
        x-ms-text: true # on autorest emitter
```

</td>
</tr>

<!-- -------------------------------------------------------------------------------------------------------------- -->

</table>
