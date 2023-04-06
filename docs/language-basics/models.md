---
id: models
title: Models
---

# Models

TypeSpec models are used to describe data shapes or schemas.

## Model kinds

Models can be used to represent 2 types:

- [Record](#record)
- [Array](#array)

### Record

Record models are structure with named fields called properties.

- name can be an `identifier` or `string literal`.
- type can be any type reference

```typespec
model Dog {
  name: string;
  age: number;
}
```

#### Optional properties

Properties can be marked as optional using the `?` punctuation.

```typespec
model Dog {
  address?: string;
}
```

#### Default values

[Optional properties](#optional-properties) can be provided with a default value using `=` operator.

```typespec
model Dog {
  address?: string = "wild";
}
```

### Special property types

#### `never`

A model property can be declared as having the type never. This can be interpreted as the model not having that property.

This can be useful in a model template to omit a property.

```typespec
model Address<TState> {
  state: TState;
  city: string;
  street: string;
}

model UKAddress is Address<never>;
```

:::note
It is up to the emitter to remove `never` properties. The TypeSpec compiler will not automatically omit them.
:::

### Array

Array are models created using the `[]` syntax which is just a syntactic sugar for using the `Array<T>` model type.

## Model composition

### Spread

The spread operator takes the members of a source model and copies them into a target model. Spread doesn't create any nominal relationship between source and target, and so it's useful when you want to reuse common properties without reasoning about or generating complex inheritance relationships.

```typespec
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

```typespec
model Animal {
  species: string;
}

model Dog extends Animal {}
```

### Is

Sometimes you want to create a new type that is an exact copy of an existing type but with some additional properties or metadata without creating a nominal inheritance relationship. The `is` keyword can be used for this purpose. It copies all the properties(like spread), but copies [decorators](./decorators.md) as well. One common use case is to give a better name to a [template](#Templates) instantiation:

```typespec
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

[See templates](./templates.md) for details on templates

```typespec
model Page<T> {
  size: number;
  item: T[];
}

model DogPage {
  ...Page<Dog>;
}
```

## Meta type references

Some model property meta types can be referenced using `::`

| Name | Example          | Description                              |
| ---- | ---------------- | ---------------------------------------- |
| type | `Pet.name::type` | Reference the type of the model property |
