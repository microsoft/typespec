---
title: triple-quote-indent
---

Triple quoted strings must all be at least indented to the same level as closing `"""`.

#### ❌ Incorrect

```tsp
const a = """
one
  two
  """;
```

#### ✅ Correct

```tsp
const a = """
  one
    two
  """;
```

This would result in the following string `"one\n  two\n"`.
