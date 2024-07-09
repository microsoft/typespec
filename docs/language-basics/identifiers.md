---
title: Identifiers
---

# Identifiers

Identifiers are used to name models, enums, properties, and other entities in TypeSpec. An identifier is a sequence of characters that must start with a alphabetic characters, underscore, or dollar sign, followed by any alphabetic or numeric characters, underscores, or dollar signs.

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
