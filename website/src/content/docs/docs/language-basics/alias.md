---
title: Aliases
description: "Language basics - aliases"
llmstxt: true
---

Aliases are a convenient way to define shorthand for types, especially when dealing with complex expressions. They simplify the syntax but don't have a representation in the type graph. As a result, you can't decorate aliases. If you need to give an alternate name to a model, use [`model is`](./models.md/#is).

You can define an alias using the `alias` keyword.

```typespec
alias Options = "one" | "two";
```

## Referencing model properties

You can reference model properties using the `.` operator for identifiers.

```tsp
alias PetName = Pet.name;
```
