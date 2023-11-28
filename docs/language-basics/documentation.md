---
id: documentation
title: Documentation
---

# Documentation

Documentation is crucial to any API. TypeSpec provides a number of ways to document your API using doc comments and decorators.

# Documenting APIs

There are 2 ways to document your API using TypeSpec:

- `@doc` decorator
- `/** */` Doc comments

The later has the advantage of being less intrusive to the spec.

## `@doc` Decorator

## `@doc` Decorator

The `@doc` decorator can be used to attach documentation to most TypeSpec declarations. It most-commonly accepts a string argument that will be used as the documentation for the declaration.

```typespec
@doc("This is a sample model")
model Dog {
  @doc("This is a sample property")
  name: string;
}
```

The `@doc` decorator can also accept a source object which can be used, for example, to provide templated documentation for a generic type.

```typespec
@doc("Templated {name}", T)
model Template<T extends {}>  {
}

// doc will read "Templated A"
model A is Template<A>
```

## Doc Comments

You can annotate objects in your TypeSpec spec with doc comments. These comments will be considered the same as if they were attached using the `@doc` decorator and can be used to generate external documentation.

Doc comments starts with `/**` and continue until the closing `*/` is encountered. [Tags](#doc-comment-tags) can be used to provide additional documentation context.

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

The benefit to using doc comment syntax is that it keeps all of the documentation for a declaration in one place, making it easier to read and maintain. Additionally, it allows the generation of documentation using tools like TypeDoc without having to write a custom emitter to examine the `@doc` metadata.

### Doc comment tags

As shown in the previous example doc comments can use certain tags to document additional elements or provide different documentation context.

| Tag                     | Description                       | Example                                             |
| ----------------------- | --------------------------------- | --------------------------------------------------- |
| `@param`                | Documents a parameter.            | `@param widgetId The ID of the widget to retrieve.` |
| `@returns`              | Documents the operation response. | `@returns The widget.`                              |
| `@template`             | Document a template parameter     | `@template T the resource type`                     |
| `@example` (unofficial) | Show examples                     | `@example \`model Foo {}\` `                        |

# Comments

TypeSpec supports both single-line and multi-line comments. Single-line comments start with `//` and continue until the end of the line. Multi-line comments start with `/*` and continue until the closing `*/` is encountered.

```typespec
// This is a single-line comment
model Dog {
  /* This is a multi-line comment
  that spans multiple lines */
  name: string;
}
```

Comments are ignored by the compiler and are not included in the generated output. They are intended to be used to document your spec internally and are not suitable for generating external documentation.
