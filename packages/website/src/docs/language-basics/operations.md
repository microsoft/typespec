---
id: operations
title: Operations
---

# Operations

Operations describe service endpoints and consist of an operation name, parameters, and return type.

Operations are declared using the `op` keyword:

```cadl
op ping(): void;
```

## Parameters

The operation's parameters describe a model, so anything you can do in a model you can do in a parameter list as well, including using the spread operator:

```cadl
op feedDog(...CommonParams, name: string): void;
```

## Return type

Often an endpoint returns one of any number of models. For example, there might be a return type for when an item is found, and a return type for when an item isn't found. Unions are used to describe this pattern:

```cadl
model DogNotFound {
  error: "Not Found";
}

op getDog(name: string): Dog | DogNotFound;
```

## Reuse operations

Operation signatures can be reused using the `is` keyword. Given an operation

```cadl
op Delete(id: string): void;
```

its signature can be reused like this:

```cadl
op deletePet is Delete;
```

This means that `deletePet` will have the same parameters, return type and decorators as the `Delete` operation.

This pattern is most commonly used in combination with [operation templates](#operations-templates)

## Operations templates

[See templates]({%doc "templates"%}) for details on templates.

```cadl
op ReadResource<T>(id: string): T;
```

The operation template can then be referenced via `is`:

```cadl
op readPet is ReadResource<Pet>;
```
