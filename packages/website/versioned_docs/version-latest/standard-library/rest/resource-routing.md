---
title: Resource and routes
---

# Resources & routes

Resources are operations that are grouped in a namespace. You declare such a namespace by adding the `@route` decorator to provide the path to that resource:

```typespec
using TypeSpec.Http;

@route("/pets")
namespace Pets {

}
```

To define an operation on this resource, you need to provide the HTTP verb for the route using the `@get`, `@head` `@post`, `@put`, `@patch`, or `@delete` decorators. If an HTTP method decorator is not specified then the default is post if there is a body and get otherwise. Lets add an operation to our `Pets` resource:

```typespec
@route("/pets")
namespace Pets {
  op list(): Pet[];

  // or you could also use
  @get op listPets(): Pet[];
}
```

If `@route` is applied to an interface, that route is not "portable". It will be applied to that interface but will not carry over if another interface extends it.

```typespec
// Operations prepended with /pets
@route("/pets")
interface PetOps {
  list(): Pet[]
}

// Operations will *not* be prepended with /pets
interface MyPetOps extends PetOps {
  ...
}
```

### Automatic route generation

Instead of manually specifying routes using the `@route` decorator, you automatically generate routes from operation parameters by applying the `@autoRoute` decorator to an operation or interface containing operations.

For this to work, an operation's path parameters (those marked with `@path`) must also be marked with
the `@segment` decorator to define the preceding path segment.

This is especially useful when reusing common parameter sets defined as model types.

For example:

```typespec
model CommonParameters {
  @path
  @segment("tenants")
  tenantId: string;

  @path
  @segment("users")
  userName: string;
}

@autoRoute
interface UserOperations {
  @get
  getUser(...CommonParameters): User | Error;

  @put
  updateUser(...CommonParameters, user: User): User | Error;
}
```

This will result in the following route for both operations

```text
/tenants/{tenantId}/users/{userName}
```

If `@autoRoute` is applied to an interface, it is not "portable". It will be applied to that interface but will not carry over if another interface extends it.

```typespec
// Operations prepended with /pets
@autoRoute
interface PetOps {
  action(@path @segment("pets") id: string): void;
}

// Operations will *not* be prepended with /pets
interface MyPetOps extends PetOps {
  ...
}
```

### Customizing Automatic Route Generation

Instead of manually specifying routes using the `@route` decorator, you automatically generate
routes from operation parameters by applying the `@autoRoute` decorator to an operation, namespace,
or interface containing operations.
