---
title: Identifiers
---

Identifiers are used to name models, enums, properties, and other entities in TypeSpec. An identifier is a sequence of one or more characters that must start with a letter, emoji, underscore, or dollar sign, and be followed by letters, numbers, emoji, underscores, or dollar signs. TypeSpec implements [UAX31-R1b stable identifiers](http://www.unicode.org/reports/tr31/#R1b) with the [emoji profile](http://www.unicode.org/reports/tr31/#Emoji_Profile).

Examples:

- ✅ `cat`
- ✅ `Dog`
- ✅ `_Item2`
- ✅ `$money$`
- ✅ `🎉`
- ✅ `🚀`
- ❌ `1cat`
- ❌ `*dog`

## Reserved identifiers

All keywords are reserved identifiers in TypeSpec. However they can still be used when escaping with wrapping with `\`` characters.

```tsp
model `enum` {}
```
