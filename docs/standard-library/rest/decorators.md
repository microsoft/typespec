---
title: Decorators
---

# Http And Rest Decorators

- [Http decorators](#http-decorators) (`Cadl.Http` namespace)

  - [Verb decorators](#http-verb-decorators)
    - [@get](#get)
    - [@put](#put)
    - [@post](#post)
    - [@patch](#patch)
    - [@delete](#delete)
    - [@head](#head)
  - [Routing](#routing)
    - [@route](#route)
  - [Data types](#data-types)
    - [@header](#header)
    - [@query](#query)
    - [@path](#path)
    - [@body](#body)
    - [@statusCode](#statuscode)
  - [Service decorators](#service-decorators)
    - [@server](#server)
    - [@useAuth](#useauth)
  - [Metadata decorators](#metadata-decorators)
    - [@includeInapplicableMetadataInPayload](#includeinapplicablemetadatainpayload)

- [Rest decorators](#rest-decorators) (`Cadl.Rest` namespace)
  - [Routing](#rest-routing)
    - [@autoRoute](#autoroute)
    - [@segment](#segment)
    - [@segmentOf](#segmentof)
    - [@segmentSeparator](#segmentseparator)
    - [@actionSeparator](#actionseparator)
  - [Resource](#resource-decorators)
    - [@resource](#resource)
    - [@readsResource](#readsresource)
    - [@createsResource](#createsresource)
    - [@createsOrReplacesResource](#createsorreplacesresource)
    - [@createsOrUpdatesResource](#createsorupdatesresource)
    - [@updatesResource](#updatesresource)
    - [@deletesResource](#deletesresource)
    - [@listsResource](#listsresource)
    - [@parentResource](#parentresource)

## Http decorators

Http decorators are available in the `Cadl.Http` namespace.

### Http verb decorators

#### `@get`

Specify the http verb for the target operation to be `GET`.

```cadl
@get op read(): Pet;
```

#### `@put`

Specify the http verb for the target operation to be `PUT`.

```cadl
@put op write(pet: Pet): void;
```

#### `@post`

Specify the http verb for the target operation to be `POST`.

```cadl
@post op add(pet: Pet): void;
```

#### `@patch`

Specify the http verb for the target operation to be `PATCH`.

```cadl
@patch op patch(pet: Pet): void;
```

#### `@delete`

Specify the http verb for the target operation to be `DELETE`.

```cadl
@delete op delete(pet: Pet): void;
```

#### `@head`

Specify the http verb for the target operation to be `HEAD`.

```cadl
@head op getInfo(): HeadInfo;
```

### Routing

#### `@route`

Specify the route of an operation

```cadl
@route("/pets") op list(): Pet[];
```

Path parameter can be defined using `{}` with the name matching the path property. Using the [`@path`](#path) decorator on the property is optional.

```cadl
@route("/pets/{petId}") op getPet(petId: string): Pet;
```

### Data types

#### `@header`

Specify a model property is to be sent or is received as an header

```ts
dec header(target: ModelProperty, headerName?: string);
```

Parameters:

- `headerName` _Optional_ Specify the name of the header in the http request/response.

**Example**

```cadl
op configure(@header fileType: string): void;
```

#### `@query`

Specify a model property is to be sent as a query parameter

```ts
dec query(target: ModelProperty, queryName?: string);
```

Parameters:

- `queryName` _Optional_ Specify the name of the query in the http request.

**Example**

```cadl
op list(@query filter: string): Pet[];
```

#### `@path`

Specify explicitly that a model property is to be interpolated as a path parameter.
By default if an operation paramater has the same name as the path parameter defined in [`@route`](#route) it will be inferred as a path parameter.

```cadl
@route("/store/{storeId}/pets") op list(@path storeId: string): Pet[];
```

#### `@body`

Explicitly specify that this property is to be set as the body

```cadl
op add(@body pet: Pet): void;
```

#### `@statusCode`

Specify the status code for this response

```cadl
op read(): {
  @statusCode _: 200;
  ...Pet;
} | {
  @statusCode _: 404;
};
```

### Service decorators

#### `@server`

Specify the endpoint for the service.

Here's an example that uses these to define a Pet Store service:

```cadl
@service
@server("https://example.com", "Single server endpoint")
namespace PetStore;
```

The `@server` decorator can take a third parameter with parameters as necessary:

```cadl
@server("https://{region}.foo.com", "Regional endpoint", {
  @doc("Region name")
  region?: string = "westus",
})
```

#### `@useAuth`

Specify the authentication for the service with the `@useAuth` decorator on the service namespace.

The decorator accepts a single security scheme, a tuple of security schemes (both are used),
a union of security schemes (either can be used), or a union of tuples of security schemes.

A simple example:

```cadl
@service
@useAuth(BasicAuth)
namespace PetStore;
```

See the [documentation in the Http library][authentication] for full details.

[authentication]: https://github.com/microsoft/cadl/blob/main/docs/standard-library/rest/authentication.md

### Metadata decorators

#### `@includeInapplicableMetadataInPayload`

Specify if inapplicable [metadata](./operations.md#metadata) should be included in the payload for the given entity.

This is true by default unless changed by this decorator.

Can be applied to namespaces, models, and model properties. If applied to a model or namespace, applies recursively to child models,
namespaces, and model properties unless overridden by applying this decorator to a child.

## Rest decorators

Rest decorators are available in the `Cadl.Http` namespace.

## Rest routing

#### `@autoRoute`

Namespace, interface or operation should resolve their route automatically. To be used with resource types where the route segments area defined on the models.

```cadl
@autoRoute
interface Pets {
  get(@segment("pets") @path id: string): void; //-> route: /pets/{id}
}
```

#### `@segment`

Specify the segment for the resource. To be used with [@autoRoute](#autoroute)
Syntax:

```cadl
@segment(<StringLiteral>)
```

`@segment` defines the preceding path segment for a @path parameter in auto-generated routes. The first argument should be a string that will be inserted into the operation route before the path parameter's name field.

```cadl
@autoRoute
interface Pets {
  get(@segment("pets") @path id: string): void; //-> route: /pets/{id}
}
```

#### `@segmentOf`

Syntax:

```cadl
@segment(<StringLiteral>)
```

`@segmentOf` returns the URL segment of a given model if it has `@segment` and `@key` decorator.

#### `@segmentSeparator`

Syntax:

```cadl
@segmentSeparator(<StringLiteral>)
```

`@segmentSeparator` defines the separator string that is inserted between the target's `@segment` and the preceding route path in auto-generated routes.
The first argument should be a string that will be inserted into the operation route before the target's `@segment` value. Can be a string of any length. Defaults to `/`.

#### `@actionSeparator`

Syntax:

```cadl
@actionSeparator(<StringLiteral>)
```

`@actionSeparator` defines the separator string that is inserted before the action name in auto-generated routes for actions.

### Resource decorators

#### `@resource`

Syntax:

```cadl
@resource(<StringLiteral>)
```

This decorator is to used to mark a model as a resource type with a name for the type's collection.

#### `@readsResource`

Syntax:

```cadl
@readsResource(<Model>)
```

This decorator is to used to signal the operation that is the Read operation for a particular resource.

#### `@createsResource`

Syntax:

```cadl
@createsResource(<Model>)
```

This decorator is to used to signal the operation that is the Create operation for a particular resource.

#### `@createsOrReplacesResource`

Syntax:

```cadl
@createsOrReplacesResource(<Model>)
```

This decorator is to used to signal the operation that is the CreatesOrReplace operation for a particular resource.

#### `@createsOrUpdatesResource`

Syntax:

```cadl
@createsOrUpdatesResource(<Model>)
```

This decorator is to used to signal the operation that is the CreatesOrUpdate operation for a particular resource.

#### `@updatesResource`

Syntax:

```cadl
@updatesResource(<Model>)
```

This decorator is to used to signal the operation that is the Update operation for a particular resource.

#### `@deletesResource`

Syntax:

```cadl
@deletesResource(<Model>)
```

This decorator is to used to signal the operation that is the Delete operation for a particular resource.

#### `@listsResource`

Syntax:

```cadl
@listsResource(<Model>)
```

This decorator is to used to signal the operation that is the List operation for a particular resource.

#### `@parentResource`

Syntax:

```cadl
@parentResource(parentModelType<Model>)
```

`@parentResource` marks a model property with a reference to its parent resource type. The first argument should be a reference to a model type which will be treated as the parent type of the target model type. This will cause the `@key` properties of all parent types of the target type to show up in operations of the `Resource*<T>` interfaces defined in this library. |
