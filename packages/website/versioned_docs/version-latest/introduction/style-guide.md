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
| namespace        | PascalCase                                   | `namespace Org.PetStore`                         |
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

- Use 2 space indenting

<!-- prettier-ignore -->
```cadl
// bad
model Pet {
    name: string;
}

// good
model Pet {
  name: string;
}
```

- Place a space before an opening curly brace

<!-- prettier-ignore -->
```cadl
// bad
model Pet{
  name: string;
}

// good
model Pet {
  name: string;
}
```

- Block opening curly brace `{` should be on the same line

<!-- prettier-ignore -->
```cadl
// bad
model Pet 
{
  name: string;
}

// good
model Pet {
  name: string;
}
```

- Add a newline after blocks

<!-- prettier-ignore -->
```cadl
// bad
model Pet {
  name: string;
}
model Cat extends Pet {}

// good
model Pet {
  name: string;
}

model Cat extends Pet {}
```

- Place no space between an operation/decorator/function name and the parmaeter list

<!-- prettier-ignore -->
```cadl
// bad
op list (filter: string): Pet[];

// bad
@doc ("This is a pet")

// good
op list(filter: string): Pet[];

// good
@doc("This is a pet")
```

- Do not add spaces inside parentheses

<!-- prettier-ignore -->
```cadl
// bad
op list( filter: string ): Pet[];

// good
op list(filter: string): Pet[];

```

- Add spaces inside curly braces.

<!-- prettier-ignore -->
```cadl
// bad
alias foo = {type: "cat"};

// good
alias foo = { type: "cat" };
```

- Do not add space inside square brackets

<!-- prettier-ignore -->
```cadl
// bad
alias foo = [ 1, 2, 3 ];

// good
alias foo = [1, 2, 3];
```

- Start all comments with a space

<!-- prettier-ignore -->
```cadl
//bad

// good
```

- Avoid trailing spaces at the end of lines.
