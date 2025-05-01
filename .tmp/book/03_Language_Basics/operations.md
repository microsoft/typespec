# Operations

Operations in TypeSpec are essential for defining service endpoints. Each operation is characterized by its name, parameters, and return type. They allow you to specify the behavior of your API and how clients can interact with it.

## Declaring Operations

You can declare an operation using the `op` keyword followed by the operation name and its parameters. For example:

```typespec
op ping(): void;
```

In this example, the `ping` operation does not take any parameters and returns nothing (void).

## Parameters

The parameters of an operation represent a model. You can perform any action with parameters that you can with a model, including the use of the spread operator. For example:

```typespec
op feedDog(...CommonParams, name: string): void;
```

In this case, the `feedDog` operation takes a spread of common parameters and a `name` parameter of type `string`.

## Return Type

Operations frequently return one of several possible models. For instance, you might have a return type for when an item is found and another for when it isn't. Unions are employed to express this scenario:

```typespec
model DogNotFound {
  error: "Not Found";
}

op getDog(name: string): Dog | DogNotFound;
```

In this example, the `getDog` operation takes a `name` parameter of type `string` and returns either a `Dog` model or a `DogNotFound` model.

## Reusing Operations

You can reuse operation signatures using the `is` keyword. For example, given an operation:

```typespec
op Delete(id: string): void;
```

You can reuse its signature like this:

```typespec
op deletePet is Delete;
```

This means that `deletePet` will inherit the same parameters, return type, and decorators as the `Delete` operation.

## Operation Templates

Templates can also be used with operations. For example:

```typespec
op ReadResource<T>(id: string): T;
```

You can reference the operation template using `is`:

```typespec
op readPet is ReadResource<Pet>;
```

## Meta Type References

Certain operation meta types can be referenced using `::`. For example:

| Name       | Example               | Description                                |
| ---------- | --------------------- | ------------------------------------------ |
| parameters | `readPet::parameters` | References the parameters model expression |
| returnType | `readPet::returnType` | References the operation return type       |

## Summary

Operations are a fundamental aspect of TypeSpec that define how clients interact with your API. By understanding how to declare operations, define parameters and return types, and reuse operation signatures, you can create clear and maintainable TypeSpec definitions.

As you work with TypeSpec, remember to leverage operations to specify the behavior of your API and facilitate client interactions.
