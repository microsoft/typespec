---
id: overview
title: Overview
---

# An introduction to language concepts in TypeSpec

This document provides a concise overview of the language concepts in TypeSpec. It serves as a quick reference guide rather than an in-depth tutorial.

## Declarations

- Names of declarations must be unique across different types within the same scope. For instance, the following is not permissible:
  <!-- prettier-ignore -->
    ```typespec
  model Dog {}
  namespace Dog {}
  ```

## Importing files and libraries

_For more details, see: [Imports](./imports.md)_

| Feature              | Example                   |
| -------------------- | ------------------------- |
| Importing a TypeSpec file | `import "./models.tsp"`   |
| Importing a JavaScript file       | `import "./models.js"`    |
| Importing a Library       | `import "/rest"` |

## Utilizing namespaces

_For more information, refer to: [Namespaces](./namespaces.md)_

| Feature           | Example                      |
| ----------------- | ---------------------------- |
| Declaring a namespace | `namespace PetStore {}`      |
| Defining a file namespace    | `namespace PetStore;`        |
| Creating a nested namespace  | `namespace PetStore.Models;` |
| Using a namespace   | `using PetStore.Models;`     |

## Working with decorators

_For more information, refer to: [Decorators](./decorators.md)_

| Feature                      | Example                                                                             |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| Applying a decorator                | `@mark`                                                                             |
| Applying a decorator with arguments | `@tag("abc")`                                                                       |
| Declaring a decorator in JavaScript    | `export function $tag(context: DecoratorContext, target: Type, name: string) {...}` |
| Saving state in a decorator      | `context.program.stateMap(key).set(target, <value>)`                                |
| Augmenting a decorator            | `@@tag(MyType, "abc");`                                                             |

## Defining scalars

_For more information, refer to: [Scalars](./scalars.md)_

| Feature            | Example                                     |
| ------------------ | ------------------------------------------- |
| Declaring a scalar | `scalar ternary`                            |
| Extending a scalar      | `scalar Password extends string`            |
| Creating a template scalar    | `@doc(T) scalar Password<T extends string>` |

## Creating models

_For more information, refer to: [Models](./models.md)_

| Feature                        | Example                               |
| ------------------------------ | ------------------------------------- |
| Declaring a model              | `model Pet {}`                        |
| Implementing model inheritance              | `model Dog extends Pet {}`            |
| Using 'is' with scalar                      | `model uuid extends string;`          |
| Spreading a model                   | `model Dog {...Animal}`               |
| Defining a property                       | `model Dog { name: string }`          |
| Defining an optional property              | `model Dog { owner?: string }`        |
| Defining an optional property with a default value | `model Dog { name?: string = "Rex" }` |
| Creating a model template                 | `model Pet<T> { t: T }`               |

## Defining operations

_For more information, refer to: [Operations](./operations.md)_

| Feature                       | Example                                          |
| ----------------------------- | ------------------------------------------------ |
| Declaring an operation         | `op ping(): void`                                |
| Defining an operation with parameters     | `op upload(filename: string, data: bytes): void` |
| Defining an operation with a return type    | `op health(): HealthStatus`                      |
| Defining an operation with multiple types | `op health(): HealthStatus \| ErrorResponse`     |
| Creating an operation template            | `op getter<T>(id: string): T`                    |
| Using 'is' with operation                  | `op getPet is getter<Pet>;`                      |

## Implementing interfaces

_For more information, refer to: [Interfaces](./interfaces.md)_

| Feature               | Example                                |
| --------------------- | -------------------------------------- |
| Declaring an interface | `interface PetStore { list(): Pet[] }` |
| Composing an interface | `interface PetStore extends Store { }` |
| Creating an interface template    | `interface Restful<T> { list(): T[] }` |

## Working with templates

_For more information, refer to: [Templates](./templates.md)_

| Feature                           | Example                                             |
| --------------------------------- | --------------------------------------------------- |
| Creating a simple template                   | `model Response<T> {value: T}`                      |
| Creating a template with multiple parameters | `model Response<K, V> {key: K, value: T}`           |
| Setting a default in a
