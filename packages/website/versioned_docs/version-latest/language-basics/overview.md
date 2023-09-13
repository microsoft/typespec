---
id: overview
title: Overview
---

# Language Overview

This is an overview of the language concept in TypeSpec. It doesn't go in detail but can be used as a cheat sheet.

## Declarations

- Declaration names must be unique across types within the same scope. For example this is not allowed
  <!-- prettier-ignore -->
    ```typespec
  model Dog {}
  namespace Dog {}
  ```

## Imports

_Details: [Imports](./imports.md)_

| Feature              | Example                   |
| -------------------- | ------------------------- |
| Import typespec file | `import "./models.tsp"`   |
| Import JS file       | `import "./models.js"`    |
| Import Library       | `import "@typespec/rest"` |

## Namespaces

_Details: [Namespaces](./namespaces.md)_

| Feature           | Example                      |
| ----------------- | ---------------------------- |
| Declare namespace | `namespace PetStore {}`      |
| File namespace    | `namespace PetStore;`        |
| Nested namespace  | `namespace PetStore.Models;` |
| Using namespace   | `using PetStore.Models;`     |

## Decorators

_Details: [Decorators](./decorators.md)_

| Feature                      | Example                                                                             |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| Use decorator                | `@mark`                                                                             |
| Use decorator with arguments | `@tag("abc")`                                                                       |
| Declare a decorator in JS    | `export function $tag(context: DecoratorContext, target: Type, name: string) {...}` |
| Save state in decorator      | `context.program.stateMap(key).set(target, <value>)`                                |
| Augment decorator            | `@@tag(MyType, "abc");`                                                             |

## Scalars

_Details: [Scalars](./models.md)_

| Feature            | Example                                     |
| ------------------ | ------------------------------------------- |
| Scalar declaration | `scalar ternary`                            |
| Extend scalar      | `scalar Password extends string`            |
| Template scalar    | `@doc(T) scalar Password<T extends string>` |

## Models

_Details: [Models](./models.md)_

| Feature                        | Example                               |
| ------------------------------ | ------------------------------------- |
| Model declaration              | `model Pet {}`                        |
| Model inheritance              | `model Dog extends Pet {}`            |
| scalar is                      | `model uuid extends string;`          |
| Model spread                   | `model Dog {...Animal}`               |
| Property                       | `model Dog { name: string }`          |
| Optional property              | `model Dog { owner?: string }`        |
| Optional property with default | `model Dog { name?: string = "Rex" }` |
| Model template                 | `model Pet<T> { t: T }`               |

## Operations

_Details: [Operations](./operations.md)_

| Feature                       | Example                                          |
| ----------------------------- | ------------------------------------------------ |
| Operation declaration         | `op ping(): void`                                |
| Operation with parameters     | `op upload(filename: string, data: bytes): void` |
| Operation with return type    | `op health(): HealthStatus`                      |
| Operation with multiple types | `op health(): HealthStatus \| ErrorResponse`     |
| Operation template            | `op getter<T>(id: string): T`                    |
| Operation is                  | `op getPet is getter<Pet>;`                      |

## Interfaces

_Details: [Interfaces](./interfaces.md)_

| Feature               | Example                                |
| --------------------- | -------------------------------------- |
| Interface declaration | `interface PetStore { list(): Pet[] }` |
| Interface composition | `interface PetStore extends Store { }` |
| Interface template    | `interface Restful<T> { list(): T[] }` |

## Templates

_Details: [Templates](./templates.md)_

| Feature                           | Example                                             |
| --------------------------------- | --------------------------------------------------- |
| Simple template                   | `model Response<T> {value: T}`                      |
| Template with multiple parameters | `model Response<K, V> {key: K, value: T}`           |
| Template default                  | `model Response<T = string> {value: T}`             |
| Template constraints              | `model Response<T extends {id: string}> {value: T}` |
| Template constraints and defaults | `model Response<T extends string = ""> {value: T}`  |

## Enums

_Details: [Enums](./enums.md)_

| Feature            | Example                                        |
| ------------------ | ---------------------------------------------- |
| Enum declaration   | `enum Direction {Up, Down}`                    |
| Enum string values | `enum Direction {Up: "up", Down: "down"}`      |
| Enum int values    | `enum Size {Small: 1000, Large: 2000}`         |
| Enum float values  | `enum Part {Quarter: 0.25, Half: 0.5}`         |
| Enum composing     | `enum Direction2D {...Direction, Left, Right}` |

## Unions

_Details: [Unions](./unions.md)_

| Feature                 | Example                          |
| ----------------------- | -------------------------------- |
| Union declaration       | `"cat" \| "dog"`                 |
| Named union declaration | `union Pet {cat: Cat, dog: Dog}` |

## Intersections

_Details: [Intersections](./intersections.md)_

| Feature                  | Example        |
| ------------------------ | -------------- |
| Intersection declaration | `Pet & Animal` |

## Type literals

_Details: [Type literals](./type-literals.md)_

| Feature           | Example                                                  |
| ----------------- | -------------------------------------------------------- |
| String            | `"Hello world!"`                                         |
| Multi line String | `"""\nHello world!\n"""` (\n) represent actual new lines |
| Int               | `10`                                                     |
| Float             | `10.0`                                                   |
| Boolean           | `false`                                                  |

## Aliases

_Details: [Aliases](./alias.md)_

| Feature           | Example                           |
| ----------------- | --------------------------------- |
| Alias declaration | `alias Options = "one" \| "two";` |
