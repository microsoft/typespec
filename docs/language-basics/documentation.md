---
id: documentation
title: Documentation
---

Documentation is a vital aspect of any API. TypeSpec offers several ways to document your API, including doc comments and decorators.

## Approaches to documenting APIs

TypeSpec provides two primary methods for documenting your API:

- `@doc` decorator
- `/** */` Doc comments

The latter is less intrusive to the specification and is often preferred.

## The `@doc` decorator

The `@doc` decorator can be used to attach documentation to most TypeSpec declarations. It typically accepts a string argument that serves as the documentation for the declaration.

```typespec
@doc("This is a sample model")
model Dog {
  @doc("This is a sample property")
  name: string;
}
```

The `@doc` decorator can also accept a source object, which can be used to provide templated documentation for a generic type, for example.

```typespec
@doc("Templated {name}", Type)
model Template<Type extends {}>  {
}

// The documentation will read "Templated A"
model A is Template<A>
```

## Doc comments

You can annotate objects in your TypeSpec specification with doc comments. These comments are treated as if they were attached using the `@doc` decorator and can be used to generate external documentation.

Doc comments start with `/**` and continue until the closing `*/` is encountered. [Tags](#doc-comment-tags) can be used to provide additional documentation context.

```typespec
/**
 * Get a widget.
 * @param widgetId The ID of the widget to retrieve.
 */
op read(@path widgetId: string): Widget | Error;
```

This is functionally equivalent to:

```typespec
@doc("Get a widget.")
op read(
  @doc("The ID of the widget to retrieve.")
  @path
  widgetId: string,
): Widget | Error;
```

The advantage of using doc comment syntax is that it keeps all of the documentation for a declaration in one place, making it easier to read and maintain. Additionally, it allows the generation of documentation using tools like TypeDoc without having to write a custom emitter to examine the `@doc` metadata.

### Doc comment tags

As shown in the previous example, doc comments can use certain tags to document additional elements or provide different documentation context.

| Tag                     | Description                       | Example                                             |
| ----------------------- | --------------------------------- | --------------------------------------------------- |
| `@param`                | Documents a parameter.            | `@param widgetId The ID of the widget to retrieve.` |
| `@returns`              | Documents the operation response. | `@returns The widget.`                              |
| `@template`             | Document a template parameter     | `@template T the resource type`                     |
| `@example` (unofficial) | Show examples                     | `@example \`model Foo {}\` `                        |

## Comments

TypeSpec supports both single-line and multi-line comments. Single-line comments start with `//` and continue until the end of the line. Multi-line comments start with `/*` and continue until the closing `*/` is encountered.

```typespec
// This is a single-line comment
model Dog {
  /* This is a multi-line comment
  that spans multiple lines */
  name: string;
}
```

Comments are ignored by the compiler and do not appear in the generated output. They are intended for internal documentation of your spec and are not suitable for generating external documentation.
