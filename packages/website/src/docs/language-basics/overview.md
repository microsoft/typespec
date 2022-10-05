---
id: overview
title: Overview
---

# Language Overview

This is an overview of the language concept in Cadl. It doesn't go in detail but can be used as a cheat sheet.

## Declarations

- Declaration names must be unique across types within the same scope. For example this is not allowed
  <!-- prettier-ignore -->
    ```cadl
  model Dog {}
  namespace Dog {}
  ```

## Imports

_Details: [Imports]({%doc "imports"%})_

| Feature          | Example                    |
| ---------------- | -------------------------- |
| Import cadl file | `import "./models.cadl"`   |
| Import JS file   | `import "./models.js"`     |
| Import Library   | `import "@cadl-lang/rest"` |

## Namespaces

_Details: [Namespaces]({%doc "namespaces"%})_

| Feature           | Example                      |
| ----------------- | ---------------------------- |
| Declare namespace | `namespace PetStore {}`      |
| File namespace    | `namespace PetStore;`        |
| Nested namespace  | `namespace PetStore.Models;` |
| Using namespace   | `using PetStore.Models;`     |

## Decorators

_Details: [Decorators]({%doc "decorators"%})_

| Feature                      | Example                                                                             |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| Use decorator                | `@mark`                                                                             |
| Use decorator with arguments | `@tag("abc")`                                                                       |
| Declare a decorator in JS    | `export function $tag(context: DecoratorContext, target: Type, name: string) {...}` |
| Save state in decorator      | `context.program.stateMap(key).set(target, <value>)`                                |
| Augment decorator            | `@@tag(MyType, "abc")`                                                              |

## Models

_Details: [Models]({%doc "models"%})_

| Feature                        | Example                               |
| ------------------------------ | ------------------------------------- |
| Model declaration              | `model Pet {}`                        |
| Model inheritance              | `model Dog extends Pet {}`            |
| Model is                       | `model uuid is string;`               |
| Model spread                   | `model Dog {...Animal}`               |
| Property                       | `model Dog { name: string }`          |
| Optional property              | `model Dog { owner?: string }`        |
| Optional property with default | `model Dog { name?: string = "Rex" }` |
| Model template                 | `model Pet<T> { t: T }`               |

## Operations

_Details: [Operations]({%doc "operations"%})_

| Feature                       | Example                                          |
| ----------------------------- | ------------------------------------------------ |
| Operation declaration         | `op ping(): void`                                |
| Operation with parameters     | `op upload(filename: string, data: bytes): void` |
| Operation with return type    | `op health(): HealthStatus`                      |
| Operation with multiple types | `op health(): HealthStatus \| ErrorResponse`     |
| Operation template            | `op getter<T>(id: string): T`                    |
| Operation is                  | `op getPet is getter<Pet>;`                      |

## Interfaces

_Details: [Interfaces]({%doc "interfaces"%})_

| Feature               | Example                                |
| --------------------- | -------------------------------------- |
| Interface declaration | `interface PetStore { list(): Pet[] }` |
| Interface composition | `interface PetStore extends Store { }` |
| Interface template    | `interface Restful<T> { list(): T[] }` |

## Templates

_Details: [Templates]({%doc "templates"%})_

| Feature                           | Example                                             |
| --------------------------------- | --------------------------------------------------- |
| Simple template                   | `model Response<T> {value: T}`                      |
| Template with multiple parameters | `model Response<K, V> {key: K, value: T}`           |
| Template default                  | `model Response<T = string> {value: T}`             |
| Template constraints              | `model Response<T extends {id: string}> {value: T}` |
| Template constraints and defaults | `model Response<T extends string = ""> {value: T}`  |

## Enums

_Details: [Enums]({%doc "enums"%})_

| Feature            | Example                                        |
| ------------------ | ---------------------------------------------- |
| Enum declaration   | `enum Direction {Up, Down}`                    |
| Enum string values | `enum Direction {Up: "up", Down: "down"}`      |
| Enum int values    | `enum Size {Small: 1000, Large: 2000}`         |
| Enum float values  | `enum Part {Quarter: 0.25, Half: 0.5}`         |
| Enum composing     | `enum Direction2D {...Direction, Left, Right}` |

## Unions

_Details: [Unions]({%doc "unions"%})_

| Feature                 | Example                          |
| ----------------------- | -------------------------------- |
| Union declaration       | `"cat" \| "dog"`                 |
| Named union declaration | `union Pet {cat: Cat, dog: Dog}` |

## Intersections

_Details: [Intersections]({%doc "intersections"%})_

| Feature                  | Example        |
| ------------------------ | -------------- |
| Intersection declaration | `Pet & Animal` |

## Type literals

_Details: [Type literals]({%doc "type-literals"%})_

| Feature           | Example                                                  |
| ----------------- | -------------------------------------------------------- |
| String            | `"Hello world!"`                                         |
| Multi line String | `"""\nHello world!\n"""` (\n) represent actual new lines |
| Int               | `10`                                                     |
| Float             | `10.0`                                                   |
| Boolean           | `false`                                                  |

## Aliases

_Details: [Aliases]({%doc "aliases"%})_

| Feature           | Example                           |
| ----------------- | --------------------------------- |
| Alias declaration | `alias Options = "one" \| "two";` |
