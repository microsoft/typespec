---
id: models
title: Models
---

Models in TypeSpec are utilized to define the structure or schema of data.

## Types of models

Models can be categorized into two main types:

- [Record](#record)
- [Array](#array)

### Record

A Record model is a structure that consists of named fields, referred to as properties.

- The name can be an [`identifier`](./identifiers.md) or `string literal`.
- The type can be any type reference.
- Properties are arranged in a specific order. Refer to [property ordering](#property-ordering) for more details.

```typespec
model Dog {
  name: string;
  age: number;
}
```

#### Optional properties

Properties can be designated as optional by using the `?` symbol.

```typespec
model Dog {
  address?: string;
}
```

#### Default values

[Optional properties](#optional-properties) can be assigned a default value using the `=` operator.

```typespec
model Dog {
  address?: string = "wild";
}
```

#### Property ordering

Properties are arranged in the order they are defined in the source. Properties acquired via `model is` are placed before properties defined in the model body. Properties obtained via `...` are inserted at the point where the spread appears in the source.

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

// The resulting property order for Cat is:
// name, age, meow, address, furColor
```

### Additional properties

The `Record<T>` model can be used to define a model with an arbitrary number of properties of type T. It can be combined with a named model to provide some known properties.

There are three ways to achieve this, each with slightly different semantics:

- Using the `...` operator
- Using the `is` operator
- Using the `extends` operator

#### Using the `...` operator

Spreading a Record into your model implies that your model includes all the properties you have explicitly defined, plus any additional properties defined by the Record. This means that a property in the model could be of a different and incompatible type with the Record value type.

```tsp
// In this example, the Person model has a property `age` that is an int32, but also has other properties that are all strings.
model Person {
  age: int32;
  ...Record<string>;
}
```

#### Using the `is` operator

When using `is Record<T>`, it indicates that all properties of this model are of type T. This means that each property explicitly defined in the model must also be of type T.

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

#### Using the `extends` operator

The `extends` operator has similar semantics to `is`, but it defines the relationship between the two models. In many languages, this would probably result in the same emitted code as `is` and it is recommended to use `is Record<T>` instead.

```tsp
model Person extends Record<string> {
  name: string;
}
```

### Special property types

#### `never`

A model property can be declared as having the type `never`. This can be interpreted as the model not having that property.

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
The responsibility of removing `never` properties lies with the emitter. The TypeSpec compiler will not automatically omit them.
:::

### Array

Arrays are models created using the `[]` syntax, which is a shorthand for using the `Array<T>` model type.

## Model composition

### Spread

The spread operator (`...`) copies the members of a source model into a target model. This operation doesn't create any nominal relationship between the source and target, making it useful when you want to reuse common properties without generating complex inheritance relationships.

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

// The Dog model is equivalent to the following declaration:
model Dog {
  species: string;
  name: string;
}
```

### Extends

There are times when you want to create an explicit relationship between two models, such as when you're generating class definitions in languages that support inheritance. The `extends` keyword can be used to establish this relationship.

```typespec
model Animal {
  species: string;
}

model Dog extends Animal {}
```

### Is

There are instances when you want to create a new type that is an exact copy of an existing type but with additional properties or metadata, without creating a nominal inheritance relationship. The `is` keyword can be used for this purpose. It copies all the properties (like spread), but also copies [decorators](./decorators.md) as well. A common use case is to provide a better name to a [template](#model-templates) instantiation:

```typespec
@decorator
model Thing<T> {
  property: T;
}

model StringThing is Thing<string>;

// The StringThing declaration is equivalent to the following declaration:
@decorator
model StringThing {
  property: string;
}
```

## Model templates

Refer to [templates](./templates.md) for more details on templates.

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

Some model property meta types can be referenced using `::`.

| Name | Example          | Description                              |
| ---- | ---------------- | ---------------------------------------- |
| type | `Pet.name::type` | Reference the type of the model property |
