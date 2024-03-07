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
- properties are ordered. See [ordering of properties](#ordering-of-properties)

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

#### Ordering of properties

Properties are ordered in the order that they appear in source. Properties obtained via `model is` appear before properties defined in the model body. Properties obtained via `...` are inserted where the spread appears in source.

Example:

```tsp
model Pet {
  name: string;
  age: int32;
}

model HasHome {
  address: string;
}

model Cat is Pet {
  meow: boolean;
  ...HasHome;
  furColor: string;
}

// Resulting property order for cat:
// name, age, meow, address, furColor
```

### Additional properties

The `Record<T>` model can be used to define a model with an arbitrary number of properties of type T. It can be combined with a named model to provide some known properties.

There is 3 ways this can be done which all have slightly different semantics:

- Using the `...` operator
- Using `is` operator
- Using `extends` operator

#### Using `...` operator

Spreading a Record into your model means that your model has all the properties you have explicitly defined plus any additional properties defined by the Record.
This means that the property in the model could be of a different and incompatible type with the Record value type.

```tsp
// Here we are saying the Person model has a property `age` that is an int32 but has some other properties that are all string.
model Person {
  age: int32;
  ...Record<string>;
}
```

#### Using `is` operator

When using `is Record<T>` it is now saying that all properties of this model are of type T. This means that each property explicitly defined in the model must be also be of type T.

The example above would be invalid

```tsp
model Person is Record<string> {
  age: int32;
  //   ^ int32 is not assignable to string
}
```

But the following would be valid

```tsp
model Person is Record<string> {
  name: string;
}
```

#### Using `extends` operator

`extends` is going to have similar semantics to `is` but is going to define the relationship between the 2 models.

In many languages this would probably result in the same emitted code as `is` and is recommended to just use `is Record<T>` instead.

```tsp
model Person extends Record<string> {
  name: string;
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

Sometimes you want to create a new type that is an exact copy of an existing type but with some additional properties or metadata without creating a nominal inheritance relationship. The `is` keyword can be used for this purpose. It copies all the properties (like spread), but copies [decorators](./decorators.md) as well. One common use case is to give a better name to a [template](#Templates) instantiation:

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
model Page<Item> {
  size: number;
  item: Item[];
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
