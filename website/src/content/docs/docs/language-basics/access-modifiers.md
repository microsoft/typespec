---
id: access-modifiers
title: Access Modifiers
description: "Language basics - controlling the visibility of declarations across libraries"
llmstxt: true
---

Access modifiers control which declarations in a TypeSpec library are accessible to consumers of that library. They allow library authors to distinguish between the public API surface and internal implementation details.

:::caution
Access modifiers are an **experimental feature** and may change or be removed in a future release. The compiler will emit a warning when access modifiers are used.
:::

## The `internal` modifier

The `internal` modifier restricts a declaration so that it can only be accessed within the library or project where it is defined. Consumers of the library cannot reference internal declarations.

```typespec
internal model MyInternalModel {
  secret: string;
}

model MyPublicModel {
  // OK: same library can reference internal models
  details: MyInternalModel;
}
```

### Supported declarations

The `internal` modifier can be applied to the following declaration types:

| Declaration | Example                            |
| ----------- | ---------------------------------- |
| `model`     | `internal model Example {}`        |
| `scalar`    | `internal scalar Example;`         |
| `interface` | `internal interface Example {}`    |
| `union`     | `internal union Example {}`        |
| `op`        | `internal op example(): void;`     |
| `enum`      | `internal enum Example {}`         |
| `alias`     | `internal alias Example = string;` |
| `const`     | `internal const example = 1;`      |

:::note
The `internal` modifier **cannot** be applied to `namespace` declarations.
:::

### Access rules

The `internal` modifier is a property of the _symbol_ (the name that refers to a type), not a property of the type itself. The compiler prevents code in other packages from _referencing_ an internal symbol by name, but it does not prevent the underlying type from being used indirectly. A public declaration within the same package can freely reference an internal declaration, and the resulting type will be accessible to consumers through the public declaration.

When a declaration is marked `internal`, the compiler enforces the following rules:

- **Same library or project**: Code within the same library (or the same project, if not in a library) can reference internal declarations normally.
- **Different library**: Code in a different library that tries to reference an internal declaration by name will receive an error.

```typespec title="my-lib/main.tsp"
namespace MyLib;

internal model SecretHelper {
  key: string;
}

model PublicApi {
  data: SecretHelper; // ✅ OK: same library
}

// ✅ OK: a public alias can reference an internal symbol within the same package.
// Consumers can use `ExposedHelper`, even though it refers to the same type as `SecretHelper`.
alias ExposedHelper = SecretHelper;
```

```typespec title="consumer/main.tsp"
import "my-lib";

model Consumer {
  helper: MyLib.SecretHelper; // ❌ Error: SecretHelper is internal
  data: MyLib.PublicApi; // ✅ OK: PublicApi is public (even though it references SecretHelper)
  exposed: MyLib.ExposedHelper; // ✅ OK: ExposedHelper is a public alias
}
```

The error message for a direct reference to an internal symbol will read:

> Symbol 'SecretHelper' is internal and can only be accessed from within its declaring package.

### Combining with `extern`

The `internal` modifier can be combined with the `extern` modifier on decorator declarations to create internal decorator signatures:

```typespec
internal extern dec myInternalDecorator(target: unknown);
```

### Suppressing the experimental warning

Since access modifiers are currently experimental, using `internal` will emit a warning. You can suppress this warning with a `#suppress` directive:

```typespec
#suppress "experimental-feature"
internal model MyInternalModel {}
```

## Why not `namespace`?

The `internal` modifier is not supported on namespaces because namespaces in TypeSpec are **open and merged** across files. A namespace declared in one file can be extended in another file — potentially across library boundaries. Applying `internal` to a namespace would create ambiguity about which parts of the namespace are internal and which are public. Instead, mark individual declarations within a namespace as `internal`.

```typespec
namespace MyLib;

internal model InternalHelper {} // ✅ Mark individual declarations
model PublicApi {}
```

## Relationship to visibility

The `internal` access modifier is distinct from TypeSpec's [visibility](./visibility.md) system:

- **Access modifiers** (`internal`) control which _declarations_ (models, operations, etc.) can be referenced across library boundaries. They are enforced at compile time.
- **Visibility** (`@visibility`, `@removeVisibility`) controls which _model properties_ appear in different API operation contexts (e.g., create vs. read). It is a metadata system used by emitters to generate different views of a model.

These are complementary features — you can use both on the same types. For example, you might have a public model whose properties have different visibility across operations, or an internal model that is only used within your library's implementation.
