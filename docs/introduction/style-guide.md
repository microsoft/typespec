---
title: Style guide
---

# Cadl Language Style Guide

This is a guide providing a recommended set of naming convention to use when writing a Cadl spec.

:::info
The guidelines in this article are used in Cadl Core libraries. You can use them, or adapt them to your needs. The primary objectives are consistency and readability within your project, team, organization, or company source code.
:::

## Naming convention

| Type             | Naming                                       | Example                                          |
| ---------------- | -------------------------------------------- | ------------------------------------------------ |
| scalar           | camelCase                                    | `scalar uuid extends string;`                    |
| model            | PascalCase                                   | `model Pet {}`                                   |
| model property   | camelCase                                    | `model Pet {furColor: string}`                   |
| enum             | PascalCase                                   | `model Pet {furColor: string}`                   |
| enum member      | camelCase                                    | `enum Direction {up, down}`                      |
| namespace        | PascalCase                                   | `namespace Cadl.Rest`                            |
| interface        | PascalCase                                   | `interface Stores {}`                            |
| operation        | camelCase                                    | `op listPets(): Pet[];`                          |
| operation params | camelCase                                    | `op getPet(petId: string): Pet;`                 |
| unions           | PascalCase                                   | `union Pet {cat: Cat, dog: Dog}`                 |
| unions variants  | camelCase                                    | `union Pet {cat: Cat, dog: Dog}`                 |
| alias            | camelCase or PascalCase depending on context | `alias myString = string` or `alias MyPet = Pet` |
| decorators       | camelCase                                    | `@format`, `@resourceCollection`                 |
| functions        | camelCase                                    | `addedAfter`                                     |
| file name        | kebab-case                                   | `my-lib.cadl`                                    |

## Layout convention

Cadl has a built-in formatter. See [formatter section](./formatter.md) for more information on how to use it.
