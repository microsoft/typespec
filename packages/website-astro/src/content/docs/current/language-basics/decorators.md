---
id: decorators
title: Decorators
---

# Decorators

Decorators enable a developer to attach metadata to types in a TypeSpec program. They can also be used to calculate types based on their inputs. Decorators are the backbone of TypeSpec's extensibility and give it the flexibility to describe many different kinds of APIs and associated metadata like documentation, constraints, samples, and the like.

Many TypeSpec constructs can be decorated, including [namespaces](./namespaces.md), [operations](./operations.md) and their parameters, and [models](./models.md) and their members.

Decorators are defined using JavaScript functions that are exported from a standard ECMAScript module. When you import a JavaScript file, TypeSpec will look for any exported functions prefixed with `$`, and make them available as decorators inside the TypeSpec syntax. When a decorated declaration is evaluated by TypeSpec, it will invoke the decorator function, passing along a reference to the current compilation, an object representing the type it is attached to, and any arguments the user provided to the decorator.

## Using decorators

Decorators are referenced using the `@` prefix and must be specified before the entity they are decorating. Arguments can be provided by using parentheses in a manner similar to many programming languages, e.g. `@myDec1, "hi", { a: string })`.

The following shows an example of declaring and then using a decorator:

```typespec
@tag("Sample")
model Dog {
  @validate(false)
  name: string;
}
```

The parentheses can be omitted when no arguments are provided.

```typespec
@mark
model Dog {}
```

## Augment decorators

Decorators can also be used from a different location by referring to the type being decorated. For this you can declare an augment decorator using the `@@` prefix. The first argument of an augment decorator is the type reference that should be decorated. As the augment decorator is a statement, it must end with a semicolon (`;`).

```typespec
model Dog {}

@@tag(Dog, "Sample");
```

Which is equivalent to

```typespec
@tag("Sample")
model Dog {}
```

Example: Decorate a model property

```typespec
model Dog {
  name: string;
}

@@readOnly(Dog.name);
```

## Writing decorator

[See creating decorator documentation](../extending-typespec/create-decorators.md)
