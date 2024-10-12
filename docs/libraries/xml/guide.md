---
title: Guide
---

## Default encoding of scalars

As in Json we have some [default handling](https://typespec.io/docs/libraries/http/encoding#bytes) of the common scalars like `utcDateTime`

| Scalar Type      | Default Encoding  | Encoding name                           |
| ---------------- | ----------------- | --------------------------------------- |
| `utcDateTime`    | `xs:dateTime`     | `TypeSpec.Xml.Encoding.xmlDateTime`     |
| `offsetDateTime` | `xs:dateTime`     | `TypeSpec.Xml.Encoding.xmlDateTime`     |
| `plainDate`      | `xs:date`         | `TypeSpec.Xml.Encoding.xmlDate`         |
| `plainTime`      | `xs:time`         | `TypeSpec.Xml.Encoding.xmlTime`         |
| `duration`       | `xs:duration`     | `TypeSpec.Xml.Encoding.xmlDuration`     |
| `bytes`          | `xs:base64Binary` | `TypeSpec.Xml.Encoding.xmlBase64Binary` |

## Examples

### 1. Array of primitive types

<table>
<tr>
  <td>TypeSpec</td>
  <td>Xml</td>
  <td>OpenAPI3</td>
</tr>
<!-- ---------------------------------------------------  SCENARIO 1.1  ----------------------------------------------------------- -->
<tr>
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
  <tags>abc</tags>
  <tags>def</tags>
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
    <string>abc</string>
    <string>def</string>
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
  <ItemsName>abc</ItemsName>
  <ItemsName>def</ItemsName>
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

```tsp
@encodedName("application/xml", "ItemsName")
scalar tag extends string;

@encodedName("application/xml", "XmlPet")
model Pet {
  @encodedName("application/xml", "ItemsTags")
  tags: tag[];
}
```

</td>
<td>

```xml
<XmlPet>
  <ItemsTags>
    <ItemsName>abc</ItemsName>
    <ItemsName>def</ItemsName>
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
  <td>TypeSpec</td>
  <td>Xml</td>
  <td>OpenAPI3</td>
</tr>
<!-- ---------------------------------------------------  SCENARIO 2.1  ----------------------------------------------------------- -->
<tr>
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
  
  <td>TypeSpec</td>
  <td>Xml</td>
  <td>OpenAPI3</td>
</tr>
<!-- ---------------------------------------------------  SCENARIO 3.1  ----------------------------------------------------------- -->
<tr>
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
  
  <td>TypeSpec</td>
  <td>Xml</td>
  <td>OpenAPI3</td>
</tr>
<!-- ---------------------------------------------------  SCENARIO 4.1  ----------------------------------------------------------- -->
<tr>
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
<Book id="0">
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
  
  <td>TypeSpec</td>
  <td>Xml</td>
  <td>OpenAPI3</td>
</tr>
<!-- ---------------------------------------------------  SCENARIO 5.1  ----------------------------------------------------------- -->
<tr>
<td>

```tsp
@Xml.ns("smp", "http://example.com/schema")
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

```tsp
@Xml.ns("smp", "http://example.com/schema")
model Book {
  id: string;

  @Xml.ns("smp", "http://example.com/schema")
  title: string;

  @Xml.ns("ns2", "http://example.com/ns2")
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
  
  <td>TypeSpec</td>
  <td>Xml</td>
  <td>OpenAPI3</td>
</tr>
<!-- ---------------------------------------------------  SCENARIO 6.1  ----------------------------------------------------------- -->
<tr>
<td>

```tsp
@Xml.nsDeclarations
enum Namespaces {
  smp: "http://example.com/schema",
}

@Xml.ns(Namespaces.smp)
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

```tsp
@Xml.nsDeclarations
enum Namespaces {
  smp: "http://example.com/schema",
  ns2: "http://example.com/ns2",
}

@Xml.ns(Namespaces.smp)
model Book {
  id: string;

  @Xml.ns(Namespaces.smp)
  title: string;

  @Xml.ns(Namespaces.ns2)
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
  
  <td>TypeSpec</td>
  <td>Xml</td>
  <td>OpenAPI3</td>
</tr>
<!-- ---------------------------------------------------  SCENARIO 6.1  ----------------------------------------------------------- -->
<tr>
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
