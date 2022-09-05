---
id: models
title: Models
---

# Models

Cadl models are used to describe data shapes or schemas.

## Model kinds

Models can be used to represent 3 types:

- [Primitives](#primitives)
- [Record](#record)
- [Array](#array)

### Primitives

These are types without any fields(For example `string`, `int32`, `boolean`, etc.)

### Record

Record models are structure with named fields called properties.

- name can be an `identifier` or `string literal`.
- type can be any type reference

```cadl
model Dog {
  name: string;
  age: number;
}
```

#### Optional properties

Properties can be marked as optional using the `?` punctuation.

```cadl
model Dog {
  address?: string;
}
```

#### Default values

[Optional properties](#optional-properties) can be provided with a default value using `=` operator.

```cadl
model Dog {
  address?: string = "wild";
}
```

### Array

Array are models created using the `[]` syntax which is just a syntactic sugar for using the `Array<T>` model type.

## Model composition

### Spread

The spread operator takes the members of a source model and copies them into a target model. Spread doesn't create any nominal relationship between source and target, and so it's useful when you want to reuse common properties without reasoning about or generating complex inheritance relationships.

```cadl
model Animal {
  species: string;
}

model Pet {
  name: string;
}

model Dog {
  ...Animal;
  ...Pet;
}

// Dog is equivalent to the following declaration:
model Dog {
  species: string;
  name: string;
}
```

### Extends

Sometimes you want to create an explicit relationship between two models, for example when you want to emit class definitions in languages which support inheritance. The `extends` keyword can be used to establish such a relationship. It is also used extensively with `interface` to compose from existing interface building blocks.

```cadl
model Animal {
  species: string;
}

model Dog extends Animal {}
```

## Is

Sometimes you want to copy all aspects of a type without creating a nominal inheritance relationship. The `is` keyword can be used for this purpose. It is like spread, but also copies [decorators]({{"/docs/language-basics/decorators" | url}}) in addition to properties. One common use case is to give a better name to a [template](#Templates) instantiation:

```cadl
@decorator
model Thing<T> {
  property: T;
}

model StringThing is Thing<string>;

// StringThing declaration is equivalent to the following declaration:
@decorator
model StringThing {
  property: string;
}
```

## Model templates

It is often useful to let the users of a model fill in certain details. Model templates enable this pattern. Similar to generics found in other languages, model templates declare template parameters that users provide when referencing the model.

```cadl
model Page<T> {
  size: number;
  item: T[];
}

model DogPage {
  ...Page<Dog>;
}
```

### Default values

A template parameter can be given a default value with `= <value>`.

```cadl
model Page<T = string> {
  size: number;
  item: T[];
}
```

### Template constraints

Template parameter can provide a constraint using the `extends` keyword. See [type-relations]({{"/docs/language-basics/type-relations" | url}}) documentation for details on how validation works.

```cadl
// Expect T to be a model with property name: string
model Foo<T extends {name: string}> {}
// Expect T to be a string
model Bar<T extends string = "Abc"> {}
```
