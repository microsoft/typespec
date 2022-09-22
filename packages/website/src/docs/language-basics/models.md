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

Sometimes you want to create an explicit relationship between two models, for example when you want to emit class definitions in languages which support inheritance. The `extends` keyword can be used to establish such a relationship.

```cadl
model Animal {
  species: string;
}

model Dog extends Animal {}
```

### Is

Sometimes you want to create a new type that is an exact copy of an existing type but with some additional properties or metadata without creating a nominal inheritance relationship. The `is` keyword can be used for this purpose. It copies all the properties(like spread), but copies [decorators]({{"/docs/language-basics/decorators" | url}}) as well. One common use case is to give a better name to a [template](#Templates) instantiation:

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

[See templates]({%doc "templates"%}) for details on templates

```cadl
model Page<T> {
  size: number;
  item: T[];
}

model DogPage {
  ...Page<Dog>;
}
```
