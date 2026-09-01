---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Add experimental `when` clauses on `auto` decorator applications, letting a single spec carry different metadata per emitter, language, or target. Enable with the `scoped-decorators` feature flag.

```tsp
@clientName("Widget") when language("csharp") | language("java")
@clientName("widget") when language("python")
@clientName("Thing")
model Widget {}
```

Emitters read the value for their own scope; `EmitContext.scope` is prefilled with the emitter's package name and `EmitContext.createScope()` narrows it:

```ts
const value = getAutoDecoratorValue(program, "MyLib.clientName", model, context.scope);
```

Decorator arguments are still validated in every scope — only the stored value is conditioned — and the unscoped `getAutoDecoratorValue(program, fqn, target)` overload is unchanged.
