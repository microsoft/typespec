---
id: aliases
title: Aliases
---

# Alias

Aliases can be defined for types. This can be helpeful to reuse a complex expression.

Alias is only a syntax helper, it has no represenation in the type graph. This means that aliases cannot be decorated. If wanting to provide a new name look for [`model is`]({{"/docs/language-basics/models" | url}})

Alias can be defined using the `alias` keyword

```cadl
alias Options = "one" | "two";
```
