---
title: Operations
llmstxt:
  title: "@typespec/http - endpoints"
  description: Defining HTTP endpoints
---

## Operation verb

**Default behavior:**

- If `@post` operation has a request body
- `@get` otherwise

**Configure:**

You can use one of the [verb decorators](./reference/decorators.md): `@get`, `@put`, etc.

## Route

An operation route can be specified using the `@route` decorator.

```typespec
@route("/pets") op list(): Pet[];
```

Route path parameters are declared using `{}`. Providing `@path` on the model property with the matching name is optional.

```typespec
@route("/pets/{petId}") op get(petId: string): Pet;
// or explicit @path
@route("/pets/{petId}") op get(@path petId: string): Pet;
```

Route can be specified on a parent namespace or interface. In that case all the operations, interfaces and namespaces underneath will be prefixed with it.

```typespec
@route("/store")
namespace PetStore {
  op hello(): void; // `/store`
  @route("ping") op ping(): void; // `/store/ping`

  @route("/pets")
  interface Pets {
    list(): Pet[]; // `/store/pets`
    @route("{petId}") read(petId: string): Pet; // `/store/pets/{petId}`
  }
}
```

## Path and query parameters

Model properties and parameters which should be passed as path and query parameters use the `@path` and `@query` parameters respectively. Let's modify our list operation to support pagination, and add a read operation to our Pets resource:

```typespec
@route("/pets")
namespace Pets {
  op list(@query skip: int32, @query top: int32): Pet[];
  op read(@path petId: int32): Pet;
}
```

Path parameters are appended to the URL unless a substitution with that parameter name exists on the resource path. For example, we might define a sub-resource using the following TypeSpec. Note how the path parameter for our sub-resource's list operation corresponds to the substitution in the URL.

```typespec
@route("/pets/{petId}/toys")
namespace PetToys {
  op list(@path petId: int32): Toy[];
}
```

## Request & response bodies

Request and response bodies can be declared explicitly using the `@body` decorator. Let's add an endpoint to create a pet. Let's also use this decorator for the responses, although this doesn't change anything about the API.

```typespec
@route("/pets")
namespace Pets {
  op list(@query skip: int32, @query top: int32): {
    @body pets: Pet[];
  };
  op read(@path petId: int32): {
    @body pet: Pet;
  };
  @post
  op create(@body pet: Pet): {};
}
```

### Implicit body resolution

Note that in the absence of explicit `@body`:

1. The set of parameters that are not marked @header, @query, or @path form the request body.
2. The set of properties of the return model that are not marked @header or @statusCode form the response body.
3. If the return type is not a model, then it defines the response body.

This is how we were able to return Pet and Pet[] bodies without using @body for list and read. We can actually write
create in the same terse style by spreading the Pet object into the parameter list like this:

See also [metadata](./operations.md#metadata) for more advanced details.

```typespec
@route("/pets")
namespace Pets {
  @post
  op create(...Pet): {};
}
```

### `@body` vs `@bodyRoot`

The `@body` decorator applies to a request parameter or model property. The type of that decorated property or parameter will be exactly the http request or response body. If the body type is a Model, annotating any property in that model with applicable metadata (`@header`, `@path`, `@query` for request and `@header`, `@statusCode` for response) will be ignored and log a warning.
The `@bodyRoot` decorator similarly applies to a property or parameter. The type of that decorated property or parameter is similarly used to define the request or response body. If the body type is not a model, the behavior is identical to `@body`. If the body type is a model, instead of exactly defining _only_ the body, the model may also contain properties annotated as applicable http metadata. Such properties will be treated as http metadata, will not be included in the request or response body, and will not result in a warning.

Nesting `@body` and `@bodyRoot`, while mostly pointless, can happen when using templates to build operations. A warning will be emitted if nesting happens inline.
The meaning when nesting them is as follow:

- As soon as `@body` is reached the content is exactly the body which means any nested `@bodyRoot` or `@body` will be ignored.
- if `@bodyRoot` is reached before any occurrence of `@body`, it will keep looking for nested properties decorated with `@body` or `@bodyRoot` and if found the deepest one will be used to determine the body.

Examples

<table>
<tr>
  <th>Code</th>
  <th>Example Payload</th>
</tr>
<tr>
  <td>

```typespec
op case1(
  @header foo: string, //
  name: string,
  age: int32,
): void;
```

  </td>
  <td>

```http
POST /
Foo: bar
{
  "name": "Rex",
  "age": 3
}
```

  </td>
```
  </td>
</tr>
<tr>
  <td>

```typespec
op case2(
  body: {
    @header foo: string;
    name: string;
    age: int32;
  },
): void;
```

  </td>
  <td>

```http
POST /
Foo: bar
{
  "body": {
    "name": "Rex",
    "age": 3
  }
}
```

  </td>
</tr>
<tr>
  <td>

```typespec
op case3(
  @body body: {
    @header foo: string; // warning: `@header` is ignored
    name: string;
    age: int32;
  },
): void;
```

  </td>
  <td>

```http
POST /
{
  "name": "Rex",
  "age": 3
}
```

  </td>
</tr>
<tr>
  <td>

```typespec
op case4(
  @bodyRoot body: {
    @header foo: string;
    name: string;
    age: int32;
  },
): void;
```

  </td>
  <td>

```http
POST /
Foo: bar
{
  "name": "Rex",
  "age": 3
}
```

  </td>
</tr>
<tr>
  <td>

```typespec
op case5(
  // This bodyRoot is a noop and will log a warning
  @bodyRoot body: {
    @bodyRoot reallyBody: {
      @header foo: string;
      name: string;
      age: int32;
    };
  },
): void;
```

  </td>
  <td>

```http
POST /
Foo: bar
{
  "name": "Rex",
  "age": 3
}
```

  </td>
</tr>
</table>

## Headers

Model properties and parameters that should be passed in a header use the `@header` decorator. The decorator takes the header name as a parameter. If a header name is not provided, it is inferred from the property or parameter name. Let's add `etag` support to our pet store's read operation.

```typespec
@route("/pets")
namespace Pets {
  op list(@query skip: int32, @query top: int32): {
    @body pets: Pet[];
  };
  op read(@path petId: int32, @header ifMatch?: string): {
    @header eTag: string;
    @body pet: Pet;
  };
  @post
  op create(@body pet: Pet): {};
}
```

## Status codes

**Default behavior:**

- `4xx,5xx` if response is marked with `@error`
- `200` otherwise

**Configure:**

Use the `@statusCode` decorator on a property to declare a status code for a response. Generally, setting this to just `int32` isn't particularly useful. Instead, use number literal types to create a discriminated union of response types. Let's add status codes to our responses, and add a 404 response to our read endpoint.

```typespec
@route("/pets")
namespace Pets {
  @error
  model Error {
    code: string;
  }

  op list(@query skip: int32, @query top: int32): {
    @body pets: Pet[]; // statusCode: 200 Implicit
  };
  op read(@path petId: int32, @header ifMatch?: string): {
    @statusCode statusCode: 200;
    @header eTag: string;
    @body pet: Pet;
  } | {
    @statusCode statusCode: 404;
  };
  op create(@body pet: Pet): {
    @statusCode statusCode: 204;
  } | Error; //statusCode: 4xx,5xx as Error use `@error` decorator
}
```

## Content type

[See the documentation of Content-Types](./content-types.md).

## Built-in response shapes

Since status codes are so common for REST APIs, TypeSpec comes with some built-in types for common status codes so you don't need to declare status codes so frequently.

There is also a `Body<T>` type, which can be used as a shorthand for { @body body: T } when an explicit body is required.

Lets update our sample one last time to use these built-in types:

```typespec
model ETag {
  @header eTag: string;
}
@route("/pets")
namespace Pets {
  op list(@query skip: int32, @query top: int32): OkResponse & Body<Pet[]>;
  op read(@path petId: int32, @header ifMatch?: string): (OkResponse &
    Body<Pet> &
    ETag) | NotFoundResponse;
  @post
  op create(...Pet): NoContentResponse;
}
```

Note that the default status code is 200 for non-empty bodies and 204 for empty bodies. Similarly, explicit `Body<T>` is not required when T is known to be a model. So the following terser form is equivalent:

```typespec
@route("/pets")
namespace Pets {
  op list(@query skip: int32, @query top: int32): Pet[];
  op read(@path petId: int32, @header ifMatch?: string): (Pet & ETag) | NotFoundResponse;
  @post
  op create(...Pet): {};
}
```

Finally, another common style is to make helper response types that are
shared across a larger service definition. In this style, you can be
entirely explicit while also keeping operation definitions concise.

For example, we could write :

```typespec
model ListResponse<T> {
  ...OkResponse;
  ...Body<T[]>;
}

model ReadSuccessResponse<T> {
  ...OkResponse;
  ...ETag;
  ...Body<T>;
}

alias ReadResponse<T> = ReadSuccessResponse<T> | NotFoundResponse;

model CreateResponse {
  ...NoContentResponse;
}

@route("/pets")
namespace Pets {
  op list(@query skip: int32, @query top: int32): ListResponse<Pet>;
  op read(@path petId: int32, @header ifMatch?: string): ReadResponse<Pet>;
  @post
  op create(...Pet): CreateResponse;
}
```

## Handling files

`@typespec/http` provides a special model [`TypeSpec.Http.File`](../http/reference/data-types.md#file-typespechttpfile) for handling file uploads and downloads in HTTP operations. When working with files, emitters need to implement special handling due to their binary nature.

For more information about HTTP file bodies and how to configure them, see [the documentation on Files][http-files].

[http-files][./files.md]

### Basic File Handling

When the model `Http.File` (or any model that extends `Http.File`) is the _exact_ body of an HTTP request, emitters **must** treat this model with special care:

- The `contentType` property should be used as the value for the `Content-Type` header in requests and vice-versa for responses.
- The `filename` property should be used in the `Content-Disposition` header in responses and vice-versa for multipart requests (`filename` cannot be sent in a non-multipart HTTP request because `Content-Disposition` is only valid for responses and multipart requests).
- The file content should be treated as the raw body of the request/response without any additional parsing.

See [`isHttpFile`](../http/reference/js-api/functions/isHttpFile.md) for a helper that emitters/libraries can use to detect instances of `Http.File`.

### Examples

#### Uploading and downloading files

```typespec
// Uploading and downloading
@route("/files")
interface Files {
  @post
  upload(@body file: Http.File): {
    @statusCode statusCode: 201;
  };

  download(@path fileId: string): Http.File;
}
```

#### Custom file types

If you want to declare specific types of files that are accepted, but still treated as binary files, declare the content types by extending the `Http.File` model and overriding the `contentType` field.

```typespec
// Custom file type for images
model ImageFile extends Http.File {
  contentType: "image/jpeg" | "image/png" | "image/gif";
}

@route("/images")
interface Images {
  @post
  upload(@body image: ImageFile): {
    @statusCode statusCode: 201;
  };

  download(@path imageId: string): ImageFile;
}
```

## Automatic visibility

The `@typespec/rest` library understands [Lifecycle Visibility](../../language-basics/visibility.md#lifecycle-visibility) and provides functionality for emitters to apply visibility transforms based on whether a model represents a request or response and on HTTP method usage as detailed in the table below.

See [handling visibility and metadata](../../extending-typespec/emitter-metadata-handling.md) for details on how to incorporate this information into an emitter implementation.

| Modifier         | Visible in           |
| ---------------- | -------------------- |
| Lifecycle.Read   | Any response         |
| Lifecycle.Query  | GET or HEAD request  |
| Lifecycle.Create | POST or PUT request  |
| Lifecycle.Update | PATCH or PUT request |
| Lifecycle.Delete | DELETE request       |

This allows a single logical TypeSpec model to be used as in the following example:

```typespec
model User {
  name: string;
  @visibility(Lifecycle.Read) id: string;
  @visibility(Lifecycle.Create) password: string;
}

@route("/users")
interface Users {
  @post create(@path id: string, ...User): User;
  @get get(@path id: string): User;
}
```

There is a single logical user entity represented by the single TypeSpec type `User`, but the HTTP payload for this entity varies based on context. When returned in a response, the `id` property is included, but when sent in a request, it is not. Similarly, the `password` property is only included in create requests, but not present in responses.

The OpenAPI v3 emitter will apply these visibilities automatically, without explicit use of `@withVisibility`, and it will generate separate schemas suffixed by visibility when necessary. `@visibility(Lifecycle.Read)` can be expressed in OpenAPI without generating additional schema by specifying `readOnly: true` and the OpenAPI v3 emitter will leverage this a an optimization, but other visibilities will generate additional schemas. For example, `@visibility(Lifecycle.Create)` applied to a model property of a type named Widget will generate a `WidgetCreate` schema.

Another emitter such as one generating client code can see and preserve a single logical type and deal with these HTTP payload differences by means other than type proliferation.

Modeling with logical entities rather than HTTP-specific shapes also keeps the TypeSpec spec decoupled from HTTP and REST and can allow the same spec to be used with multiple protocols.

## Metadata

The properties that designate content for the HTTP envelope (`@header`, `@path`, `@query`, `@statusCode`) rather than the content in an HTTP payload are often called "metadata".

Metadata is determined to be applicable or inapplicable based on the context that it is used:

| Context       | Applicability       |
| ------------- | ------------------- |
| `@query`      | request only        |
| `@path`       | request only        |
| `@statusCode` | response only       |
| `@header`     | request or response |

Additionally metadata that appears in an array element type always inapplicable.

When metadata is deemed "inapplicable", for example, if a `@path` property is seen in a response, it becomes part of the payload instead unless the [@includeInapplicableMetadataInPayload](./reference/decorators.md#@TypeSpec.Http.includeInapplicableMetadataInPayload) decorator is used and given a value of `false`.

The handling of metadata applicability furthers the goal of keeping a single logical model in TypeSpec. For example, this defines a logical `User` entity that has a name, ID and password, but further annotates that the ID is sent in the HTTP path and the HTTP body in responses. Also, using automatic visibility as before, we further indicate that the password is only present in create requests.

```typespec
model User {
  name: string;
  @path id: string;
  @visibility(Lifecycle.Create) password: string;
}
```

Then, we can write operations in terms of the logical entity:

```typespec
@route("/users")
interface Users {
  @post create(...User): User;
}
```

Abstractly, this expresses that a create operation that takes and returns a user. But concretely, at the HTTP protocol level, a create request and response look like this:

```
POST /Users/TypeSpecFan42 HTTP/1.1
Content-Type: application/json
{
  "name": "TypeSpec Fan",
  "password": "Y0uW1llN3v3rGu3ss!"
}

HTTP/1.1 200 OK
Content-Type: application/json
{
  name: "TypeSpec Fan",
  id: "TypeSpecFan42
}
```

### Visibility vs. Metadata applicability

Metadata properties are filtered based on visibility as [described above](#automatic-visibility). This is done independently before applicability is considered. If a a metadata property is not visible then it is neither part of the envelope nor the HTTP payload, irrespective of its applicability.

### Nested metadata

Metadata properties are not required to be top-level. They can also be nested deeper in a parameter or response model type. For example:

```typespec
model Thing {
  headers: {
    @header example: string;
  };
  name: string;
}
```

Note that nesting in this sense does not require the use of anonymous models. This is equivalent:

```typespec
model Thing {
  headers: Headers;
  name: string;
}
model Headers {
  @header example: string;
}
```

In the event that this nesting introduces duplication, then the least nested property with a given name is preferred and the duplicate metadata properties are ignored.

```typespec
model Thing {
  headers: {
    @header example: string; // preferred
    more: {
      @header example: string; // ignored
    };
  };
}
```

## JSON Merge-Patch

[RFC 7396](https://www.rfc-editor.org/rfc/rfc7396) describes a standard for interpreting
a Patch request body using content-type `application/merge-patch+json`to update an existing
resource. The TypeSpec Http library provides Model templates `MergePatchUpdate` and
`MergePatchCreateOrUpdate` for specifying a JSON merge-patch request body. The templates
recursively apply the merge-patch transformation rules to a TypeSpec resource Model, taking
into account the structure and characteristics of the resource Model.

For example, given a resource model like this:

```tsp
model Resource {
  id: string;
  name?: string;
  quantity?: safeint;
  color: "blue" | "green" | "red" = "blue";
  flavor?: "vanilla" | "chocolate" | "strawberry" = "vanilla";
  related?: Record<Resource>;
  tags?: string[];
}
```

A JSON Merge-Patch request updating this resource would have the following behavior:

- `id` may or may not occur in the request, if it does occur, the resource value can be updated to a new string, but cannot be erased by sending null.
- `name` may or may not occur in the request, if it does occur, the resource value can be updated to a new string or erased by sending null.
- `quantity` may or ay not occur in the request, if it does occur, the resource value can be updated to a new integer value or erased by sending null.
- `color` may or may not occur in the request, if it does occur, the resource value can be updated to one of the appropriate values. If set to `null` it is returned to its default value (`blue`)
- `flavor` may or may not occur in the request, if it does occur, the resource value can be updated to one of the appropriate values. If set to `null` it is returned to its default value (`vanilla`)
- `related` may or may not occur in the request, if it does occur, the resource value can be updated or erased (set to `{}`) by sending null.
  - Since `related` is a keyed type (Object), each key/value pair in the request will be treated as follows:
  - If the key exists in the 'related' field of the resource, the value is merged with the existing value.
  - If the key does not exist in the 'related' field of the resource, the key/value pair is added.
- `tags` may or may not occur in the request, if it does occur, the resource can be replaced by a new array, or erased by sending null.

### The MergePatch Transform

Generalizing these rules creates a type transform of the resource Model into a Model defining the corresponding Patch request body. The properties of a resource define the allowed properties and their types in a Patch request body for that resource as follows:

- The `type` of a property indicates the allowed type of the corresponding property in a Patch request.
- `Required` properties without a default value are _optional_ in a Patch request, but if present, the value cannot be null.
- `Optional` properties are _optional_ in a Patch request, and, if present, can contain any valid value or null.
- Properties with a default value are _optional_ in a Patch request, but have no default value in the request body. If present, they can contain any valid value or null. A _null_ value will not erase the property, but set it back to its default value.
- `Model` and `Record` typed properties, when present in a Patch request are merged with the existing resource value in accordance with the merge-patch algorithm: this transformation is recursively applied to these values.
- `Array` typed properties, when present in a Patch request replace the existing resource value in accordance with the merge-patch algorithm. This transformation is _not_ recursively applied to these values.
- Properties required to deserialize a request (for example, discriminators) are _required_ in a Patch request body.

### Constraints

Because JSON merge-patch only describes the request body of an http request, the merge-patch
transform in TypeSpec does not allow http envelope property metadata like `@query`, `@path`,
`@header`, `@cookie`, and `@statusCode` in http requests.

The merge-patch templates will **emit an error diagnostic** if a model containing Http metadata
properties is passed in. For example:

```tsp
model ResourceWithMetadata {
  @path id: string;
  @header eTag: string;
  description: string;
}

// THIS WILL RESULT IN AN ERROR
@patch op update(...MergePatchUpdate<ResourceWithMetadata>): ResourceWithMetadata;
```

### Patch Behavior of Nested Models

Model types may be nested beneath the top level of a resource. The characteristics of the ModelProperty that references a nested Model type determines the valid values for that nested model in the Patch request. Here is how the valid values are determined for each of the model property types that might reference a nested model (also depicted in the following tables):

- The property type is a (simple) Model or an intersection of models
  - if the property is optional, the MergePatch transform applies, and the visibility is `CreateOrUpdate`. This is because, in an update, the property _may or may not_ exist if the resource exists, so might need to be created or updated.
  - if the property is required, the MergePatch transform applies and the visibility matches the input visibility. This is because, in an update, the property _must_ exist if the resource exists, so it can only be updated. In a CreateOrUpdate, it could also be created with the resource.
- The property type is an array (sequence) of model type items
  - For required or optional arrays: The MergePatch transform _does not apply_ and the visibility is `Create`
- The property type is a Record (keyed collection) of model type values
  - For required or optional keyed collections, the MergePatch transform applies, and the visibility is create or update.
- The property type is a union of model type values
  - The MergePatch transform applies to each of the union variants, and because switching between variants is possible, CreateOrUpdate visibility is applied regardless of the optionality of the property. If the union is discriminated, the discriminator remains 'required' so the service can understand which variant the request was intended to apply to.

### Treatment of Nested Keyed Types in Patch Request with `Update` Visibility Filter

| Property Type | Optionality | Example                      | Apply MergePatch transform? | Visibility Filter |
| ------------- | ----------- | ---------------------------- | --------------------------- | ----------------- |
| Simple        | Required    | `fooProp: Foo`               | Yes                         | `Update`          |
| Simple        | Optional    | `fooProp?: Foo`              | Yes                         | `CreateOrUpdate`  |
| ReplaceOnly   | Required    | `@replaceOnly fooProp: Foo`  | No                          | `Create`          |
| ReplaceOnly   | Optional    | `@replaceOnly fooProp?: Foo` | No                          | `Create`          |
| Array         | \*          | `fooProp?: Foo[]`            | No                          | `Create`          |
| Record        | \*          | `fooProp?: Record<Foo>`      | Yes                         | `CreateOrUpdate`  |
| Union         | \*          | `fooProp?: Foo \| Bar`       | Yes                         | `CreateOrUpdate`  |

### Treatment of Nested Keyed Types in Patch Request with `CreateOrUpdate` Visibility Filter

| Property Type | Optionality | Example                      | Apply MergePatch transform? | Visibility Filter |
| ------------- | ----------- | ---------------------------- | --------------------------- | ----------------- |
| Simple        | Required    | `fooProp: Foo`               | Yes                         | `CreateOrUpdate`  |
| Simple        | Optional    | `fooProp?: Foo`              | Yes                         | `CreateOrUpdate`  |
| ReplaceOnly   | Required    | `@replaceOnly fooProp: Foo`  | No                          | `Create`          |
| ReplaceOnly   | Optional    | `@replaceOnly fooProp?: Foo` | No                          | `Create`          |
| Array         | \*          | `fooProp?: Foo[]`            | No                          | `Create`          |
| Record        | \*          | `fooProp?: Record<Foo>`      | Yes                         | `CreateOrUpdate`  |
| Union         | \*          | `fooProp?: Foo \| Bar`       | Yes                         | `CreateOrUpdate`  |

### Examples

#### Update

A JSON Merge Patch update operation for a Widget resource using `@body`.

```tsp
// A Json merge-patch operation to update a 'Widget' resource
// and return the updated Widget.
@patch op update(@body request: MergePatchUpdate<Widget>): Widget;
```

A JSON Merge Patch update operation for a Widget resource using the spread operator.

```tsp
// A Json merge-patch operation to update a 'Widget' resource
// and return the updated Widget.
@patch op update(...MergePatchUpdate<Widget>): Widget;
```

#### Create or Update

A JSON Merge Patch create or update operation for a Widget resource using `@body`.

```tsp
// A Json merge-patch operation to update a 'Widget' resource
// or create it if it does not exist and return the updated Widget.
@patch op update(@body request: MergePatchCreateOrUpdate<Widget>): Widget;
```

A JSON Merge Patch create or update operation for a Widget resource using the spread operator.

```tsp
// A Json merge-patch operation to update a 'Widget' resource
// or create it if it does not exist and return the updated Widget.
@patch op update(...MergePatchCreateOrUpdate<Widget>): Widget;
```

## Emitter resources

See [Handling metadata and visibility in emitters for REST API](../../extending-typespec/emitter-metadata-handling.md) for information on how to handle metadata applicability and automatic visibility in a custom emitter.
