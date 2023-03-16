---
title: Overview
---

# Versioning

TypeSpec has an official library called `@typespec/versioning`. It's a set of TypeSpec declarations and decorators that describe how APIs can be versioned.

## Installation

In your typespec project

```bash
npm install @typespec/versioning
```

To avoid having to use the fully qualified name for all versioning types, you can include the following:

```typespec
using TypeSpec.Versioning;
```

## Details

- [References](./reference/index.md)

## Creating Versioned APIs

The primary purpose of the TypeSpec.Versioning library is to provide a way to version APIs. Let's start with an unversioned API.

```typespec
@service({
  title: "Contoso Widget Manager",
})
namespace Contoso.WidgetManager;
```

To make this API versioned, we need to add the `@versioned` decorator to the namespace and declare an enum that identifies the supported versions.

```typespec
@service({
  title: "Contoso Widget Manager",
})
@versioned(Contoso.WidgetManager.Versions)
namespace Contoso.WidgetManager;

enum Versions {
  v1,
}
```

## Declaring Versioned Dependencies

Both versioned and unversioned services can declare their dependency on versioned TypeSpec libraries. To declare a dependency on a versioned library, use the `@useDependency` decorator. For unversioned services, this will be declared on the namespace. For versioned services, this will be declared on the versioned enum.

For example, if our unversioned WidgetManager service has a dependency on the Azure.Core library, we would declare it like this:

```typespec
@service({
  title: "Contoso Widget Manager Unversioned",
})
@useDependency(Azure.Core.v1_0_Preview_1)
namespace Contoso.WidgetManager.Unversioned;
```

If our versioned WidgetManager service has a dependency on the Azure.Core library, we would declare it like this:

```typespec 
@service({
  title: "Contoso Widget Manager",
})
@versioned(Contoso.WidgetManager.Versions)
namespace Contoso.WidgetManager;

enum Versions {
  @useDependency(Azure.Core.v1_0_Preview_1)
  v1,
}
```

Let's assume we add a new version to our service, and it takes advantage of features in a newer version of the Azure.Core library. We can declare that dependency like this:

```typespec
@service({
  title: "Contoso Widget Manager",
})
@versioned(Contoso.WidgetManager.Versions)
namespace Contoso.WidgetManager;

enum Versions {
  @useDependency(Azure.Core.v1_0_Preview_1)
  v1,
  @useDependency(Azure.Core.v1_0_Preview_2)
  v2,
}
```

## Versioning APIs

TBD
