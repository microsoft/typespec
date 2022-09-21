---
id: namespaces
title: Namespaces
---

# Namespaces

Namespaces let you group related types together into namespaces. This helps organize your types, making them easier to find and prevents name conflicts. Namespaces are merged across files, so you can reference any type anywhere in your Cadl program via its namespace.

## Basics

Create a namespace with the `namespace` keyword.

```cadl
namespace SampleNamespace {
  model SampleModel {}
}
```

_The name of a namespace must be a valid Cadl identifier._

The `SampleNamespace` can then be used from other places:

```cadl
model Foo {
  sample: SampleNamespace.SampleModel;
}
```

## Nested namespace

Namespaces can contain sub namespaces providing additional granularity

```cadl
namespace Foo {
  namespace Bar {
    namespace Baz {
      model SampleModel {}
    }
  }
}
```

or this can be simplified using `.` notation

```cadl
namespace Foo.Bar.Baz {
  model SampleModel {}
}
```

The sub-namespace can then be used from other places using the fully qualified name.

```cadl
model A {
  sample: Foo.Bar.Baz.SampleModel;
}
```

## File namespace

A namespace for all declarations contained in a file can be provided at the top (After the `import` statements) using a blockless namespace statement

```cadl
namespace SampleNamespace;

model SampleModel {}
```

A file can only have a single blockless namespace.

## Using a namespace

The content of a namespace can be exposed to the current scope using the `using` keyword.

```cadl
using SampleNamespace;

model Foo {
  sample: SampleModel;
}
```

The bindings introduced by a `using` statement are local to the namespace they are declared in. They do not become part of the namespace themselves.

```cadl
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
