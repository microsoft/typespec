---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Linter diagnostics on a library declaration can now be reported at its usage in the project: the template argument the property's type came from, or the spread, `is` or intersection operand that composed it in. Composition diagnostics are not reported when the same rule already flags a source property in the library, so reusing a library declaration doesn't require suppressing its existing violations.

```tsp
// Library
model SharedQuery {
  top?: int32;
}

// Project: a rule prohibiting `top` on this operation reports on SharedQuery.
op list(...SharedQuery): string[];
```

Library-side `#suppress` directives are also respected.
