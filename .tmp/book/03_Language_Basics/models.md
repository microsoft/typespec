# Models

Models in TypeSpec are utilized to define the structure or schema of data. They serve as the foundation for representing entities within your API, allowing you to specify the properties and behaviors associated with those entities.

## Types of Models

Models can be categorized into two main types:

- **Record Models**: Structures that consist of named fields, referred to as properties.
- **Array Models**: Represent collections of items.

## Declaring a Record Model

You can declare a record model using the `model` keyword followed by the name of the model. For example:

```typespec
model Dog {
  name: string;
  age: uint8;
}
```

In this example, the `Dog` model has two properties: `name` and `age`, each with their respective types.

### Optional Properties

Properties can be designated as optional by using the `?` symbol. For example:

```typespec
model Dog {
  address?: string;
}
```

In this case, the `address` property is optional, meaning it may or may not be present in instances of the `Dog` model.

### Default Values

You can assign default values to properties using the `=` operator. For example:

```typespec
model Dog {
  address?: string = "wild";
  age: uint8 = 0;
}
```

In this example, the `address` property defaults to "wild" if not specified, and the `age` property defaults to 0.

### Property Ordering

Properties are arranged in the order they are defined in the source. Properties acquired via `model is` are placed before properties defined in the model body. For example:

```typespec
model Pet {
  name: string;
  age: uint8;
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

## Additional Properties

The `Record<T>` model can be used to define a model with an arbitrary number of properties of type T. You can achieve this using the spread operator, `is`, or `extends`.

### Using the Spread Operator

Spreading a Record into your model implies that your model includes all the properties you have explicitly defined, plus any additional properties defined by the Record. For example:

```typespec
model Person {
  age: int32;
  ...Record<string>;
}
```

### Using the `is` Operator

When using `is Record<T>`, it indicates that all properties of this model are of type T. For example:

```typespec
model Person is Record<string> {
  name: string;
}
```

### Using the `extends` Operator

The `extends` operator defines a relationship between two models. For example:

```typespec
model Dog extends Animal {}
```

## Summary

Models are fundamental building blocks in TypeSpec that allow you to define the structure of your data. By understanding how to declare models, use optional properties, assign default values, and manage property ordering, you can create clear and maintainable TypeSpec definitions.

As you work with TypeSpec, remember to leverage models to represent entities and enhance the structure of your API.
