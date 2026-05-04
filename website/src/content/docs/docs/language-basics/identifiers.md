---
title: Identifiers
description: "Language basics - identifiers"
llmstxt: true
---

Identifiers are names used to reference models, enums, operations, properties, and other entities in TypeSpec. Understanding identifier rules is essential for writing valid TypeSpec code.

## Identifier syntax rules

An identifier must follow these rules:

- **Start with**: A letter (a-z, A-Z), emoji, underscore (`_`), or dollar sign (`$`)
- **Followed by**: Any combination of letters, numbers (0-9), emoji, underscores, or dollar signs
- **Length**: One or more characters

TypeSpec implements [UAX31-R1b stable identifiers](http://www.unicode.org/reports/tr31/#R1b) with the [emoji profile](http://www.unicode.org/reports/tr31/#Emoji_Profile), providing full Unicode support for international characters.

### Examples

- ✅ `cat`
- ✅ `Dog`
- ✅ `_Item2`
- ✅ `$money$`
- ✅ `🎉`
- ✅ `🚀`
- ❌ `1cat`
- ❌ `*dog`

## Escaping identifiers

When you need to use reserved keywords or invalid identifiers, TypeSpec provides an escaping mechanism using backticks (`` ` ``). This allows you to use:

- Reserved keywords as identifiers
- Identifiers that don't follow normal syntax rules
- Identifiers with special characters or unusual formats

#### Examples

```tsp
model `enum` {}
model `interface` {}
op `import`(): void;
model `123InvalidName` {}
model `my-special-model` {}
model `User Profile` {}
```
