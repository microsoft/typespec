---
changeKind: breaking
packages:
  - "@typespec/compiler"
---

Removed deprecated legacy visibility APIs and converted all warnings for using string-based visibility modifiers to errors.

The removed APIs include:

- `getVisibility`: use `getVisibilityForClass` instead.
- `getParameterVisibility`: use `getParameterVisibilityFilter` instead.
- `getReturnTypeVisibility`: use `getReturnTypeVisibilityFilter` instead.

Furthermore, the legacy signature of `isVisible` that accepts an array of strings has been removed. Please use the new signature that accepts `EnumMember` instead.

The changed decorators include:

- `@visibility`
- `@parameterVisibility`
- `@returnTypeVisibility`
- `@withVisibility`
- `@withDefaultKeyVisibility`

The `TypeSpec.DefaultKeyVisibility` template also no longer accepts a string as a visibility modifier argument.

Attempting to pass a string to any of the above decorators or templates will now result in a type-checking error. Please use the `Lifecycle` visibility modifiers instead.

If you develop a third-party library and you use any custom visibility modifiers, you will need to instead define a visibility class enum. See: [Visibility | TypeSpec](https://typespec.io/docs/language-basics/visibility/).

**Migration steps**:

String-based visibilities can be replaced as follows:

- `"create"`, `"read"`, `"update"`, `"delete"`, and `"query"` can be replaced with `Lifecycle.Create`, `Lifecycle.Read`, `Lifecycle.Update`, `Lifecycle.Delete`, and `Lifecycle.Query` respectively.
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

Additionally, `@parameterVisibility` with no arguments has been made an error. Previously, some specifications used it to disable effective PATCH optionality, but that behavior was an unintended side effect. For example:

```tsp
@parameterVisibility
@patch
op example(@bodyRoot resource: Resource): Resource;
```

If you wish to disable effective PATCH optionality in `@typespec/http`, preventing it from treating all properties of the request body as effectively optional, you can now do so explicitly:

```tsp
@patch(#{ implicitOptionality: false })
op example(@bodyRoot resource: Resource): Resource;
```
