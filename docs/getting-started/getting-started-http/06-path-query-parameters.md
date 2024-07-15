---
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
    @body error: NotFoundError;
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

You can combine path and query parameters in a single operation. For example, let's define a `search` operation that retrieves pets by their type and supports pagination:

```typespec
@route("/pets/{type}")
namespace Pets {
  model Pet {
    @minLength(1)
    name: string;

    @minValue(0)
    @maxValue(100)
    age: int32;

    kind: "dog" | "cat" | "fish" | "bird" | "reptile";
  }

  op search(@path type: string, @query skip?: int32, @query top?: int32): {
    @statusCode statusCode: 200;
    @body pets: Pet[];
  };
}
```

In this example, `type` is a path parameter, and `skip` and `top` are query parameters. The resulting URL for this operation might look like `/pets/dog?skip=10&top=20`, where `dog` is the value of `type`, and `skip` and `top` are used for pagination.

By using the `@path` and `@query` decorators, you can clearly define how parameters should be passed in the URL, making your API more intuitive and easier to use.
