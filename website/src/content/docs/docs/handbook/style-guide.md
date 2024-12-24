---
title: Style guide
---

This guide offers a recommended set of naming conventions to follow when drafting a TypeSpec specification.

:::info
The guidelines in this article are used in TypeSpec Core libraries. You can use them, or adapt them to your needs. The primary objectives are consistency and readability within your project, team, organization, or company source code.
:::

## Naming convention

| Type               | Naming                                       | Example                                          |
| ------------------ | -------------------------------------------- | ------------------------------------------------ |
| scalar             | camelCase                                    | `scalar uuid extends string;`                    |
| model              | PascalCase                                   | `model Pet {}`                                   |
| model property     | camelCase                                    | `model Pet {furColor: string}`                   |
| enum               | PascalCase                                   | `enum Direction {}`                              |
| enum member        | camelCase                                    | `enum Direction {up, down}`                      |
| namespace          | PascalCase                                   | `namespace Org.PetStore`                         |
| interface          | PascalCase                                   | `interface Stores {}`                            |
| operation          | camelCase                                    | `op listPets(): Pet[];`                          |
| operation params   | camelCase                                    | `op getPet(petId: string): Pet;`                 |
| unions             | PascalCase                                   | `union Pet {cat: Cat, dog: Dog}`                 |
| unions variants    | camelCase                                    | `union Pet {cat: Cat, dog: Dog}`                 |
| alias              | camelCase or PascalCase depending on context | `alias myString = string` or `alias MyPet = Pet` |
| decorators         | camelCase                                    | `@format`, `@resourceCollection`                 |
| functions          | camelCase                                    | `addedAfter`                                     |
| file name          | kebab-case                                   | `my-lib.tsp`                                     |
| template parameter | PascalCase                                   | `<ExampleParameter>`                             |

:::note
In some languages, particularly object-oriented programming languages, it's conventional to prefix certain names with a letter to indicate what kind of thing they are. For example, prefixing interface names with `I` (as in `IPet`) or prefixing template parameter names with `T` (as in `TResponse`). **This is not conventional in TypeSpec**.
:::

## Layout convention

TypeSpec has a built-in formatter. See [formatter section](./formatter.md) for more information on how to use it.

- Use 2 space indenting

<!-- prettier-ignore -->
```typespec
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
```typespec
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
```typespec
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
```typespec
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

- Place no space between an operation/decorator/function name and the parameter list

<!-- prettier-ignore -->
```typespec
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
```typespec
// bad
op list( filter: string ): Pet[];

// good
op list(filter: string): Pet[];

```

- Add spaces inside curly braces.

<!-- prettier-ignore -->
```typespec
// bad
alias foo = {type: "cat"};

// good
alias foo = { type: "cat" };
```

- Do not add space inside square brackets

<!-- prettier-ignore -->
```typespec
// bad
alias foo = [ 1, 2, 3 ];

// good
alias foo = [1, 2, 3];
```

- Start all comments with a space

<!-- prettier-ignore -->
```typespec
//bad

// good
```

- Avoid trailing spaces at the end of lines.

### Model layout

- Properties should hug each other unless they have decorators or comments

<!-- prettier-ignore -->
```tsp
// bad
model Foo {
  one: string;

  two: string;

  three: string;
}

// good
model Foo {
  one: string;
  two: string;
  three: string;
}
```

- Wrap properties in new lines if they have leading comments or decorators

<!-- prettier-ignore -->
```tsp
// bad
model Foo {
  one: string;
  @doc("Foo")
  two: string;
  // line comment
  three: string;
  /**
   *  Block comment
   */
  four: string;
  five: string;
}

// good
model Foo {
  one: string;

  @doc("Foo")
  two: string;

  // line comment
  three: string;

  /**
   *  Block comment
   */
  four: string;
  
  five: string;
}
```
