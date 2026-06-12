---
title: "Decorators"
description: "Decorators supported by @azure-tools/typespec-rust"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

The Rust emitter does not define its own TypeSpec decorators. Instead it recognizes a set of decorators from [`@azure-tools/typespec-client-generator-core`](https://www.npmjs.com/package/@azure-tools/typespec-client-generator-core) (TCGC) and from the TypeSpec standard library that influence how the generated Rust code looks. The supported decorators are documented below.

## `@clientOption` {#clientOption}

**Source:** `Azure.ClientGenerator.Core` (from `@azure-tools/typespec-client-generator-core`)

The `@@clientOption` decorator passes emitter-specific named options to a client, an operation, or a model property. The Rust emitter recognizes the following named options.

### On clients: `omitEndpointMethod`

**Type:** `boolean`

When `true`, the `endpoint()` accessor method is not generated on the client struct. Use this when you need to write the method by hand in a customization layer.

```typespec
@@clientOption(MyClient, "omitEndpointMethod", true);
```

### On paging operations: `forcePageIterator`

**Type:** `boolean`

When `true`, a paging operation returns a `PageIterator<T>` instead of the default `Pager<T>`. A `PageIterator<T>` asynchronously yields individual items across all pages, while a `Pager<T>` yields one page at a time.

```typespec
@@clientOption(MyClient.listItems, "forcePageIterator", true);
```

### On model properties: `deserialize_with`

**Type:** `string`

Specifies the path to a custom Rust deserialization function for the annotated model property. The value must be a valid Rust path (e.g. `"my_crate::serde_helpers::deserialize_foo"`). The generated code emits `#[serde(deserialize_with = "…")]` on the field.

```typespec
@@clientOption(MyModel.myProperty, "deserialize_with", "my_crate::serde_helpers::deserialize_foo");
```

### On model properties: `serialize_with`

**Type:** `string`

Specifies the path to a custom Rust serialization function for the annotated model property. The value must be a valid Rust path (e.g. `"my_crate::serde_helpers::serialize_foo"`). The generated code emits `#[serde(serialize_with = "…")]` on the field.

```typespec
@@clientOption(MyModel.myProperty, "serialize_with", "my_crate::serde_helpers::serialize_foo");
```

## `@deserializeEmptyStringAsNull` {#deserializeEmptyStringAsNull}

**Source:** `Azure.ClientGenerator.Core` (from `@azure-tools/typespec-client-generator-core`)

When applied to a model property, empty string values (`""`) received from the service are deserialized as `None` instead of `Some("")`. Useful for services that use an empty string to represent the absence of a value.

```typespec
@@deserializeEmptyStringAsNull(MyModel.optionalName);
```

## `@clientName` {#clientName}

**Source:** `Azure.ClientGenerator.Core` (from `@azure-tools/typespec-client-generator-core`)

Overrides the auto-generated Rust name for a client or an operation. The provided name is used verbatim, bypassing the emitter's automatic naming rules (such as prefixing paging methods with `list_` or LRO methods with `begin_`).

```typespec
@@clientName(MyClient.get_items, "fetch_items", "rust");
```

## XML decorators {#xml-decorators}

The Rust emitter honours the following TypeSpec XML decorators when generating (de)serialization code for XML services:

| Decorator | Source | Effect on generated Rust |
| --------- | ------ | ------------------------ |
| `@encodedName("application/xml", …)` | `TypeSpec` | Sets the XML element name used in `#[serde(rename = "…")]` for the field. |
| `TypeSpec.Xml.@name` | `@typespec/xml` | Sets the XML element or attribute name for the field. |
| `TypeSpec.Xml.@attribute` | `@typespec/xml` | Marks the field as an XML attribute (`#[serde(rename = "@…")]`). |
| `TypeSpec.Xml.@unwrapped` | `@typespec/xml` | For array fields, child elements are emitted as direct children (unwrapped list). For string fields, the value is emitted as text content. |
