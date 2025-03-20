---
title: Tutorial
---

## Implementing versioned APIs

The primary role of the TypeSpec.Versioning library is to enable API versioning. Let's start with an API that lacks versioning.

```typespec
@service(#{ title: "Contoso Widget Manager" })
namespace Contoso.WidgetManager;
```

To introduce versioning to this API, we need to use the `@versioned` decorator on the namespace and define an enum that outlines the supported versions.

```typespec
@service(#{ title: "Contoso Widget Manager" })
@versioned(Contoso.WidgetManager.Versions)
namespace Contoso.WidgetManager;

enum Versions {
  v1,
}
```

## Declaring versioned dependencies

Both versioned and unversioned services can declare their dependencies on versioned TypeSpec libraries. This is achieved using the `@useDependency` decorator. For unversioned services, this is declared on the namespace. For versioned services, it's declared on the versioned enum.

For example, if our unversioned WidgetManager service depends on the Azure.Core library, we would declare it like this:

```typespec
@service(#{ title: "Contoso Widget Manager Unversioned" })
@useDependency(Azure.Core.v1_0_Preview_1)
namespace Contoso.WidgetManager.Unversioned;
```

If our versioned WidgetManager service depends on the Azure.Core library, we would declare it like this:

```typespec
@service(#{ title: "Contoso Widget Manager" })
@versioned(Contoso.WidgetManager.Versions)
namespace Contoso.WidgetManager;

enum Versions {
  @useDependency(Azure.Core.v1_0_Preview_1)
  v1,
}
```

Let's say we introduce a new version to our service, and it uses features from a newer version of the Azure.Core library. We can declare that dependency like this:

```typespec
@service(#{ title: "Contoso Widget Manager" })
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

The versioning library simplifies the process of versioning APIs. Let's start with a basic example. Assume we have a service with a single API that returns a list of widgets. We can define that API like this:

```typespec
using Versioning;
using Rest;
using Http;

@service(#{ title: "Contoso Widget Manager" })
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

Now, let's suppose that in version 2 of the service, we add a get operation to retrieve a single widget. We can add that like this:

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

Now, let's suppose that in version 3 of the service, we realize that `name` is not accurate and that this field should be called `description`. Also, we decide that the description should be optional, not mandatory. We can implement these changes like this:

```typespec
model Widget {
  @key
  widgetId: string;

  @renamedFrom(Versions.v3, "name")
  @madeOptional(Versions.v3)
  description?: string;
}
```

We made the change to the actual model property so that it now reflects the correct name and optional nature of the property. Both the `@renamedFrom` and `@madeOptional` decorators indicate the version in which the change was made, and the `@renamedFrom` decorator also identifies the previous name of the property. This allows us to generate code that is aware of the change and can handle it appropriately.

The OpenAPI definition of `Widget` for version 3 reflects the change:

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

However, the OpenAPI definition for versions 1 and 2 still reflect the original name and the mandatory nature of the property:

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

This is a common pattern with the versioning decorators. The TypeSpec should represent the _current state_ of the API. The decorators indicate the version at which this definition became accurate and, depending on the decorator, the other parameters reflect the previous values to retain that information.
