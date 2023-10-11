---
id: namespaces
title: Namespaces
---

# Namespaces

Namespaces let you group related types together into namespaces. This helps organize your types, making them easier to find and prevents name conflicts. Namespaces are merged across files, so you can reference any type anywhere in your TypeSpec program via its namespace.

## Basics

Create a namespace with the `namespace` keyword.

```typespec
namespace SampleNamespace {
  model SampleModel {}
}
```

_The name of a namespace must be a valid TypeSpec identifier._

The `SampleNamespace` can then be used from other places:

```typespec
model Foo {
  sample: SampleNamespace.SampleModel;
}
```

## Nested namespace

Namespaces can contain sub namespaces providing additional granularity

```typespec
namespace Foo {
  namespace Bar {
    namespace Baz {
      model SampleModel {}
    }
  }
}
```

or this can be simplified using `.` notation

```typespec
namespace Foo.Bar.Baz {
  model SampleModel {}
}
```

The sub-namespace can then be used from other places using the fully qualified name.

```typespec
model A {
  sample: Foo.Bar.Baz.SampleModel;
}
```

## File namespace

A namespace for all declarations contained in a file can be provided at the top (After the `import` statements) using a blockless namespace statement

```typespec
namespace SampleNamespace;

model SampleModel {}
```

A file can only have a single blockless namespace.

## Using a namespace

The content of a namespace can be exposed to the current scope using the `using` keyword.

```typespec
using SampleNamespace;

model Foo {
  sample: SampleModel;
}
```

The bindings introduced by a `using` statement are local to the namespace they are declared in. They do not become part of the namespace themselves.

```typespec
namespace One {
  model A {}
}

namespace Two {
  using One;
  alias B = A; // ok
}

alias C = One.A; // not ok
alias C = Two.B; // ok
```
