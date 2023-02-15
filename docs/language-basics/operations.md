---
id: operations
title: Operations
---

# Operations

Operations describe service endpoints and consist of an operation name, parameters, and return type.

Operations are declared using the `op` keyword:

```typespec
op ping(): void;
```

## Parameters

The operation's parameters describe a model, so anything you can do in a model you can do in a parameter list as well, including using the spread operator:

```typespec
op feedDog(...CommonParams, name: string): void;
```

## Return type

Often an endpoint returns one of any number of models. For example, there might be a return type for when an item is found, and a return type for when an item isn't found. Unions are used to describe this pattern:

```typespec
model DogNotFound {
  error: "Not Found";
}

op getDog(name: string): Dog | DogNotFound;
```

## Reuse operations

Operation signatures can be reused using the `is` keyword. Given an operation

```typespec
op Delete(id: string): void;
```

its signature can be reused like this:

```typespec
op deletePet is Delete;
```

This means that `deletePet` will have the same parameters, return type and decorators as the `Delete` operation.

This pattern is most commonly used in combination with [operation templates](#operations-templates)

## Operations templates

[See templates](./templates.md) for details on templates.

```typespec
op ReadResource<T>(id: string): T;
```

The operation template can then be referenced via `is`:

```typespec
op readPet is ReadResource<Pet>;
```
