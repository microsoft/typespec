---
id: operations
title: Operations
---

# Operations

Operations describe service endpoints and consist of an operation name, parameters, and return type. Operations are declared using the `op` keyword:

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

## Operation signatures
