---
id: getting-started-http-05-path-query-parameters
title: Path and Query Parameters
---

# Path and Query Parameters

In TypeSpec, you can specify parameters that should be passed in the URL path or as query parameters. This is done using the `@path` and `@query` decorators, respectively.

## Path Parameters

Path parameters are parts of the URL that are variable and are used to identify specific resources. They are marked with the `@path` decorator. These parameters are appended to the URL unless a substitution with that parameter name exists in the resource path.

For example, let's define a `read` operation that retrieves a specific pet by its ID:

```typespec
@route("/pets")
namespace Pets {
  op read(@path petId: int32): {
    @statusCode statusCode: 200;
    @body pet: Pet;
  } | {
    @statusCode statusCode: 404;
  };
}
```

In this example, `petId` is a path parameter. The resulting URL for this operation might look like `/pets/123`, where `123` is the value of `petId`.

## Query Parameters

Query parameters are used to filter or modify the results of an operation. They are marked with the `@query` decorator and are appended to the URL as key-value pairs.

For example, let's modify our `list` operation to support pagination using query parameters:

```typespec
@route("/pets")
namespace Pets {
  op list(@query skip?: int32, @query top?: int32): {
    @statusCode statusCode: 200;
    @body pets: Pet[];
  };
}
```

In this example, `skip` and `top` are query parameters. The resulting URL for this operation might look like `/pets?skip=10&top=20`, where `skip` and `top` are used to control pagination.

## Combining Path and Query Parameters

You can combine path and query parameters in a single operation. For example, let's define a sub-resource for pet toys and add a `list` operation that supports pagination:

```typespec
@route("/pets/{petId}/toys")
namespace PetToys {
  model Toy {
    name: string;
  }

  op list(@path petId: int32, @query skip?: int32, @query top?: int32): {
    @statusCode statusCode: 200;
    @body toys: Toy[];
  };
}
```

In this example, `petId` is a path parameter, and `skip` and `top` are query parameters. The resulting URL for this operation might look like `/pets/123/toys?skip=10&top=20`, where `123` is the value of `petId`, and `skip` and `top` are used for pagination.

By using the `@path` and `@query` decorators, you can clearly define how parameters should be passed in the URL, making your API more intuitive and easier to use.

---

[Previous: Resources and Routes](./getting-started-http-04-resources-routes.md) | [Next: Headers](./getting-started-http-06-headers.md)
