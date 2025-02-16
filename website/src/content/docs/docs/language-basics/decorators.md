---
id: decorators
title: Decorators
---

Decorators in TypeSpec allow developers to attach metadata to types within a TypeSpec program. They can also be used to compute types based on their inputs. Decorators form the core of TypeSpec's extensibility, providing the flexibility to describe a wide variety of APIs and associated metadata such as documentation, constraints, samples, and more.

The vast majority of TypeSpec declarations may be decorated, including [namespaces](./namespaces.md), [interfaces](./interfaces.md), [operations](./operations.md) and their parameters, [scalars](./scalars.md), and [models](./models.md) and their members. In general, any declaration that creates a Type can be decorated. Notably, [aliases](./aliases.md) cannot be decorated, as they do not create new Types, nor can any type expressions such as unions that use the `|` syntax or anonymous models, as they are not declarations.

Decorators are defined using JavaScript functions that are exported from a standard ECMAScript module. When a JavaScript file is imported, TypeSpec will look for any exported functions prefixed with `$`, and make them available as decorators within the TypeSpec syntax. When a decorated declaration is evaluated by TypeSpec, the decorator function is invoked, passing along a reference to the current compilation, an object representing the type it is attached to, and any arguments the user provided to the decorator.

## Applying decorators

Decorators are referenced using the `@` prefix and must be placed before the entity they are decorating. Arguments can be provided by using parentheses, similar to function calls in many programming languages, e.g., `@myDec1("hi", { a: string })`.

Here's an example of declaring and then using a decorator:

```typespec
@tag("Sample")
model Dog {
  @validate(false)
  name: string;
}
```

If no arguments are provided, the parentheses can be omitted.

```typespec
@mark
model Dog {}
```

## Augmenting decorators

Decorators can also be applied from a different location by referring to the type being decorated. For this, you can declare an augment decorator using the `@@` prefix. The first argument of an augment decorator is the type reference that should be decorated. As the augment decorator is a statement, it must end with a semicolon (`;`).

```typespec
model Dog {}

@@tag(Dog, "Sample");
```

This is equivalent to:

```typespec
@tag("Sample")
model Dog {}
```

Example: decorating a model property to indicate that it is read-only

```typespec
model Dog {
  name: string;
}

@@visibility(Dog.name, "read");
```

## Creating decorators

For more information on creating decorators, see [Creating Decorators](../extending-typespec/create-decorators.md).
