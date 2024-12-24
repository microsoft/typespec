---
id: operations
title: Operations
---

Operations are essentially service endpoints, characterized by an operation name, parameters, and a return type.

You can declare operations using the `op` keyword. Its name must be an [`identifier`](./identifiers.md).

```typespec
op ping(): void;
```

## Parameters

The parameters of an operation represent a model. Therefore, you can perform any action with parameters that you can with a model, including the use of the spread operator:

```typespec
op feedDog(...CommonParams, name: string): void;
```

## Return type

Frequently, an endpoint may return one of several possible models. For instance, there could be a return type for when an item is located, and another for when it isn't. Unions are employed to express this scenario:

```typespec
model DogNotFound {
  error: "Not Found";
}

op getDog(name: string): Dog | DogNotFound;
```

## Reusing operations

You can reuse operation signatures with the `is` keyword. For example, given an operation

```typespec
op Delete(id: string): void;
```

You can reuse its signature like so:

```typespec
op deletePet is Delete;
```

This implies that `deletePet` will inherit the same parameters, return type, and decorators as the `Delete` operation.

This practice is typically used in conjunction with [operation templates](#operation-templates)

## Operation templates

For more information on templates, [see templates](./templates.md).

```typespec
op ReadResource<T>(id: string): T;
```

You can reference the operation template using `is`:

```typespec
op readPet is ReadResource<Pet>;
```

## Referencing model properties

You can reference model properties using the `.` operator for identifiers.

```tsp
alias PetName = Pet.name;
```

## Meta type references

Certain operation meta types can be referenced using `::`

| Name       | Example               | Description                                |
| ---------- | --------------------- | ------------------------------------------ |
| parameters | `readPet::parameters` | References the parameters model expression |
| returnType | `readPet::returnType` | References the operation return type       |
