---
changeKind: deprecation
packages:
  - "@typespec/compiler"
---

Deprecate use of string-based visibility modifiers using warnings.

String-based visibilities can be replaced as follows:

- "create", "read", "update", "delete", and "query" can be replaced with `Lifecycle.Create`, `Lifecycle.Read`, `Lifecycle.Update`, `Lifecycle.Delete`, and `Lifecycle.Query` respectively.
- `@visibility("none")` can be replaced with `@invisible(Lifecycle)`.

For example:

```tsp
@visibility("create", "read")
example: string;
```

can be replaced with:

```tsp
@visibility(Lifecycle.Create, Lifecycle.Read)
example: string;
```

```tsp
@visibility("none")
example: string;
```

can be replaced with:

```tsp
@invisible(Lifecycle)
example: string;
```

Additionally, `@parameterVisibility` with no arguments is deprecated.

```tsp
@parameterVisibility
@patch
op example(@bodyRoot resource: Resource): Resource;
```

The effect of `@parameterVisibility` is to disable effective PATCH optionality. If you wish
to disable effective PATCH optionality in `@typespec/http`, preventing it from treating all
properties of the request body as effectively optional, you can now do so explicitly:

```tsp
@patch(#{ implicitOptionality: false })
op example(@bodyRoot resource: Resource): Resource;
```
