---
id: namespaces
title: Namespaces
description: "Language basics - grouping declarations with namespaces"
llmstxt: true
---

Namespaces in TypeSpec allow you to group related types together. This organization makes your types easier to locate and helps avoid naming conflicts. Namespaces are merged across files, enabling you to reference any type from anywhere in your TypeSpec program using its namespace.

## Basics

You can create a namespace using the `namespace` keyword.

```typespec
namespace SampleNamespace {
  model SampleModel {}
}
```

_Note: The namespace name must be a valid TypeSpec identifier._

You can then use `SampleNamespace` from other locations:

```typespec
model Foo {
  sample: SampleNamespace.SampleModel;
}
```

## Nested namespaces

Namespaces can contain sub-namespaces, offering additional layers of organization.

```typespec
namespace Foo {
  namespace Bar {
    namespace Baz {
      model SampleModel {}
    }
  }
}
```

Alternatively, you can simplify this using `.` notation:

```typespec
namespace Foo.Bar.Baz {
  model SampleModel {}
}
```

You can then use the sub-namespace from other locations using the fully qualified name.

```typespec
model A {
  sample: Foo.Bar.Baz.SampleModel;
}
```

## File-level namespaces

You can define a namespace for all declarations within a file at the top of the file (after any `import` statements) using a blockless namespace statement:

```typespec
namespace SampleNamespace;

model SampleModel {}
```

A file can only have one blockless namespace.

## Using namespaces

You can expose the contents of a namespace to the current scope using the `using` keyword.

```typespec
using SampleNamespace;

model Foo {
  sample: SampleModel;
}
```

The bindings introduced by a `using` statement are local to the namespace in which they are declared. They do not become part of the namespace themselves.

```typespec
namespace One {
  model A {}
}

namespace Two {
  using One;
  alias B = A; // This is valid
}

alias C = Two.A; // This is not valid
alias C = Two.B; // This is valid
```

### Resolving the name of a `using` statement

Where a `using` statement is written relative to a [file-level namespace](#file-level-namespaces) changes how its name is resolved.

A `using` written **before** the blockless namespace declaration is not scoped to it, so its name is resolved from the global namespace:

```typespec
using Common.Models; // `Common` here is the global `Common` namespace
namespace MyOrg.Common.Service;
```

A `using` written **after** the blockless namespace declaration is scoped to it, so its name is resolved relative to the file namespace first:

```typespec
namespace MyOrg.Service;
using Models; // Resolves to `MyOrg.Models`
```

The same applies to a `using` written inside a namespace block, which resolves relative to that namespace.
