---
title: Guide
---

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

The versioning library makes it easy to version APIs. Let's start with a simple example. Let's say we have a service that has a single API that returns a list of widgets. We can declare that API like this:

```typespec
using TypeSpec.Versioning;
using TypeSpec.Rest;
using TypeSpec.Http;

@service({
  title: "Contoso Widget Manager",
})
@versioned(Contoso.WidgetManager.Versions)
namespace Contoso.WidgetManager;

enum Versions {
  v1,
}

@error
model Error {
  code: string;
  message?: string;
}

model Widget {
  @key
  id: string;

  name: string;
}

op list(): Widget[] | Error;
```

Now let's say that in version 2 of the service, we add a get operation to retrieve a single widget. We can add that like this:

```typespec
enum Versions {
  v1,
  v2,
}

model Widget {
  @key
  id: string;

  name: string;
}

@route("/widget")
op list(): Widget[] | Error;

@added(Versions.v2)
@route("/widget/{id}")
op get(...Resource.KeysOf<Widget>): Widget | Error;
```

Now let's say that in version 3 of the service, we realize that `name` is inaccurate and that this field should be called `description`. Also, you
don't always have a description, so you decide it should be optional, not required. We can make these changes like this:

```typespec
model Widget {
  @key
  widgetId: string;

  @renamedFrom(Versions.v3, "name")
  @madeOptional(Versions.v3)
  description?: string;
}
```

You can see that we made the change to the actual model property so that it now reflects the correct name and optional nature of the property. Both the
`@renamedFrom` and `@madeOptional` decorators identify the version in which the change was made, and the `@renamedFrom` decorator also identifies the
previous name of the property. This allows us to generate code that is aware of the change and can handle it appropriately.

The OpenAPI defintion of `Widget` for version 3 reflects the change:

```yaml
Widget:
  type: object
  properties:
    id:
      type: string
    description:
      type: string
  required:
    - id
```

But the OpenAPI definition for versions 1 and 2 still reflect the original name and required nature of the property:

```yaml
Widget:
  type: object
  properties:
    id:
      type: string
    name:
      type: string
  required:
    - id
    - name
```

This is the common pattern with the versioning decorators. The TypeSpec should reflect the _current state_ of the API. The decorators identify the
version at which this definition became true and, depending on the decorator, the other parameters reflect the preview values in order to preserve
that information.
