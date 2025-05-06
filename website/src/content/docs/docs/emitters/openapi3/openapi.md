---
title: OpenAPI v3 emitter
---

The OpenAPI emitter translates TypeSpec language elements into their equivalent OpenAPI expressions. This guide explains how TypeSpec constructs are mapped to OpenAPI components.

**Note**: The below documentation generally refers to the behavior of the OpenAPI v3 emitter when using OpenAPI version 3.0. Emitter output for version 3.1 may be slightly different according to additional features supported in 3.1 but not in 3.0.

## Server Details

When your TypeSpec file includes an [(HTTP) `@server` decorator](../../libraries/http/reference/decorators.md#@TypeSpec.Http.server), the OpenAPI emitter will generate a `servers` object in the resulting OpenAPI document. This object contains the server URL, description, and any variables defined in the decorator.

You can apply multiple `@server` decorators to create multiple entries in the `servers` array:

```typespec
@server("https://api.example.com/v1", "Primary production endpoint")
@server("https://api-dev.example.com/v1", "Development endpoint")
namespace MyService;
```

## Operations

Each TypeSpec operation is converted into an OpenAPI operation.

### HTTP Method

You can explicitly specify the HTTP method using one of the [(HTTP) decorators][http-verb-decorators]:

- `@get`
- `@post`
- `@put`
- `@patch`
- `@delete`

If you don't specify a method, the emitter will infer it from the operation name and signature.

```typespec
// Explicitly declared as GET /{id}
@get
op getUser(@path id: string): User;

// Explicitly declared as POST /
@post
op createUser(user: User): User;

// Automatically detected as GET /{id}
op getUser(@path id: string): User;

// Automatically detected as POST /
op createUser(user: User): User;
```

### Operation Path

The path for an operation comes from the [(HTTP) `@route` decorator][http-route-decorator]. You can apply `@route` to:

- Individual operations
- Interfaces (groups of operations)
- Namespaces

When you apply routes to multiple levels, they're combined to form the complete path:

```typespec
@route("/api")
namespace MyService {
  @route("/users")
  interface Users {
    // Results in GET /api/users/{id}
    @route("/{id}")
    @get
    getUser(@path id: string): User;
  }
}
```

[http-verb-decorators]: ../../libraries/http/reference/decorators.md
[http-route-decorator]: ../../libraries/http/reference/decorators.md#@TypeSpec.Http.route

The [OpenAPI Operation object][openapi-operation-object] fields are populated as described in the following sections.

[openapi-operation-object]: https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.3.md#operationObject

### Description

The operation's description comes from the documentation of the TypeSpec operation.

Documentation is provided either by a documentation comment or by the [(built-in) `@doc` decorator][doc-decorator] (the two are equivalent):

```typespec
/**
 * Retrieves a user by their unique identifier.
 */
op getUser(@path id: string): User;

@doc("Retrieves a user by their unique identifier.")
op getUser(@path id: string): User;
```

If no documentation is provided, the description field is omitted.

[doc-decorator]: ../../standard-library/built-in-decorators.md#@doc

### Summary

The operation's summary comes from the [(built-in) `@summary` decorator][summary-decorator]:

```typespec
/**
 * Retrieves a user by their unique identifier.
 */
@summary("Get a User by ID.")
op getUser(@path id: string): User;
```

If no `@summary` is provided, the summary field is omitted.

[summary-decorator]: ../../standard-library/built-in-decorators.md#@summary

### Operation ID

The operation ID can be explicitly set using the [(OpenAPI) `@operationId` decorator][openapi-operation-decorator]:

```typespec
@operationId("getUserById")
op getUser(id: string): User;
```

If not explicitly defined, the operation ID defaults to:

- The operation name (when the operation is not in an interface)
- The interface name followed by the operation name (when in an interface)

[openapi-operation-decorator]: ../../libraries/openapi/reference/decorators.md#@TypeSpec.OpenAPI.operationId

### Parameters and Request Body

TypeSpec operation parameters map to OpenAPI parameters and request body.

#### Parameter Location

You specify where a parameter appears using these [(HTTP) decorators][http-parameter-decorators]:

- `@query` - Query parameter in the URL
- `@header` - HTTP header parameter
- `@path` - Path parameter in the URL

Parameters without these decorators are assumed to be in the request body.

```typespec
op createUser(
  // The parameter name is transformed to look like an HTTP header, so the parameter `contentType` maps
  // to the `content-type` header
  @header contentType: string,

  @query include: string,
  @path id: string,

  // The request body will be a JSON object `{ "user": <User> }`
  user: User, // This goes in the request body
): User;
```

#### Request Body

You can explicitly mark a parameter as the request body using the [(HTTP) `@body` decorator][http-body-decorator]:

```typespec
// The request body will be a JSON object that _only_ contains the User at the top level.
op createUser(@body user: User): User;
```

If `@body` is not used, all parameters not marked with `@header`, `@query`, or `@path` form the request body, which is marked as required. To make the request body optional, declare it with an optional property and the `@body` decorator:

```typespec
op updateUser(@path id: string, @body user?: User): User;
```

[http-parameter-decorators]: ../../libraries/http/reference/decorators.md
[http-body-decorator]: ../../libraries/http/reference/decorators.md#@TypeSpec.Http.body

Parameter descriptions, like operation descriptions, come from the parameters' documentation and are included in the OpenAPI definition:

```typespec
/**
 * Retrieves the User by their unique identifier.
 *
 * @param id The user's unique identifier.
 */
op getUser(@path id: string): User;
```

The content type for request bodies follows the [default content-type resolution logic](../../libraries/http/content-types.md#default-behavior) unless the `content-type` header is explicitly specified.

For more advanced parameter configuration, see the complete documentation of [HTTP operation metadata](../../libraries/http/operations.md#metadata).

### Responses

The operation's return type(s) translate into OpenAPI responses.

#### Status Codes

You can specify a status code using the [(HTTP) `@statusCode` decorator][http-statuscode-decorator] on a property in the return type:

```typespec
model UserResponse {
  @statusCode
  code: 200;

  body: User;
}

op getUser(@path id: string): UserResponse;
```

You can define multiple response types to handle different status codes:

```typespec
model UserResponse {
  @statusCode
  code: 200;

  user: User;
}

model UserNotFoundResponse {
  @statusCode
  code: 404;

  message: string;
}

op getUser(@path id: string): UserResponse | UserNotFoundResponse;
```

#### Error Responses

Use the [(built-in) `@error` decorator][error-decorator] to indicate an error response, which becomes the "default" response in OpenAPI. To indicate that an operation returns a successful response or an error, simply use the error response type in a union with a non-error type:

```typespec
@error
model ErrorResponse {
  @statusCode
  code: 404 | 500;

  message: string;
}

op getUser(@path id: string): User | ErrorResponse;
```

#### Response Body

The response body can be explicitly marked with the `@body` decorator. Otherwise, any properties not marked with `@statusCode` or `@header` form the response body.

```typespec
model UserResponse {
  @statusCode code: 200;

  // If the status code is 200, the body will be just a JSON User at the top level.
  @body user: User;
}

model NotFound {
  @statusCode code: 404;

  // If the status code is 404, the body will be a JSON object `{ "message": <string> }`
  message: string;
}

op getUser(@path id: string): UserResponse | NotFound;
```

[http-statuscode-decorator]: ../../libraries/http/reference/decorators.md#@TypeSpec.Http.statusCode
[error-decorator]: ../../standard-library/built-in-decorators.md#@error

The content type for responses follows the [default content-type resolution logic](../../libraries/http/content-types.md#default-behavior) unless the `content-type` header is explicitly specified.

For more advanced response configuration, see see the complete documentation of [HTTP operation metadata](../../libraries/http/operations.md#metadata).

### Tags

Use the [(built-in) `@tag` decorator][tag-decorator] to apply tag groups to operations that will be represented in the generated OpenAPI and OpenAPI-based documentation tools such as Swagger UI:

```typespec
@tag("Users")
op getUser(id: string): User;

// Or at interface/namespace level
@tag("Users")
interface UserOperations {
  getUser(id: string): User;
  createUser(@body user: User): User;
}
```

Tags from operations, interfaces, and enclosing namespaces are combined.

[tag-decorator]: ../../standard-library/built-in-decorators.md#@tag

### Deprecated

Mark an operation as deprecated using the (built-in) `#deprecated` directive.

```typespec
#deprecated "Use getUser instead"
op fetchUser(id: string): User;
```

This sets the `deprecated` field to `true` in the OpenAPI operation.

### External Documentation

Add external documentation links using the [(OpenAPI) `@externalDocs` decorator](../../libraries/openapi/reference/decorators.md#@TypeSpec.OpenAPI.externalDocs):

```typespec
@externalDocs("https://example.com/docs/users", "Additional user documentation")
op getUser(id: string): User;
```

The external documentation links are specific to the OpenAPI emitter and will not be used by any other emitters unless they are designed to interoperate with OpenAPI.

### Specification Extensions

Add custom OpenAPI extensions for your use cases using the [(OpenAPI) `@extension` decorator][openapi-extension-decorator].

```typespec
@extension("x-ms-pageable", #{ nextLinkName: "nextLink" })
op listUsers(): UserList;
```

The first argument to `@extension` becomes a key in the operation object, and the second argument is any JSON/YAML-like value. This decorator may be used to add arbitrary customization/extension to many OpenAPI constructs including schemas for TypeSpec types, operations, etc.

[openapi-extension-decorator]: ../../libraries/openapi/reference/decorators.md#@TypeSpec.OpenAPI.extension

## Models and Enums

TypeSpec models and enums convert to OpenAPI schemas.

### Schema Location

Models are handled differently based on how they're defined:

- **Named models**: defined in `components/schemas` section.
- **Inline models**: defined inline where used.
- **Template instances**: treated as inline unless they have a [(built-in) `@friendlyName` decorator][friendlyname], which causes them to be treated as named models.

[friendlyname]: ../../standard-library/built-in-decorators.md#@friendlyName

### Type Mapping

This table shows how TypeSpec types map to OpenAPI/JSON Schema types:

| TypeSpec type    | OpenAPI `type`/`format`           | Notes                                                                     |
| ---------------- | --------------------------------- | ------------------------------------------------------------------------- |
| `int32`          | `type: integer, format: int32`    |                                                                           |
| `int64`          | `type: integer, format: int64`    |                                                                           |
| `float32`        | `type: number, format: float`     |                                                                           |
| `float64`        | `type: number, format: double`    |                                                                           |
| `string`         | `type: string`                    |                                                                           |
| `bytes`          | `type: string, format: byte`      | for content-type == 'application/json' or 'text/plain'                    |
| `bytes`          | `type: string, format: binary`    | for "binary" content types, e.g. 'application/octet-stream', 'image/jpeg' |
| `boolean`        | `type: boolean`                   |                                                                           |
| `plainDate`      | `type: string, format: date`      |                                                                           |
| `utcDateTime`    | `type: string, format: date-time` | RFC 3339 date in coordinated universal time (UTC)                         |
| `offsetDateTime` | `type: string, format: date-time` | RFC 3339 date with timezone offset                                        |

### Data Validation Decorators

The tables below show how various built-in decorators add validation constraints to model properties:

**For numeric types:**

| Decorator          | Library  | OpenAPI/JSON Schema keyword | Example                      |
| ------------------ | -------- | --------------------------- | ---------------------------- |
| `@minValue(value)` | built-in | `minimum: value`            | `@minValue(0) age: int32;`   |
| `@maxValue(value)` | built-in | `maximum: value`            | `@maxValue(120) age: int32;` |

**For string types:**

| Decorator           | Library  | OpenAPI/JSON Schema keyword | Example                                 |
| ------------------- | -------- | --------------------------- | --------------------------------------- |
| `@format(name)`     | built-in | `format: name`              | `@format("email") email: string;`       |
| `@minLength(value)` | built-in | `minLength: value`          | `@minLength(8) password: string;`       |
| `@maxLength(value)` | built-in | `maxLength: value`          | `@maxLength(50) name: string;`          |
| `@pattern(regex)`   | built-in | `pattern: regex`            | `@pattern("^[A-Z]{2}$") state: string;` |
| `@secret`           | built-in | `format: password`          | `@secret password: string;`             |

**For array types:**

| Decorator          | Library  | OpenAPI/JSON Schema keyword | Example                         |
| ------------------ | -------- | --------------------------- | ------------------------------- |
| `@minItems(value)` | built-in | `minItems: value`           | `@minItems(1) tags: string[];`  |
| `@maxItems(value)` | built-in | `maxItems: value`           | `@maxItems(10) tags: string[];` |

### Using External References

The [`@useRef` decorator](./reference/decorators.md#@TypeSpec.OpenAPI.useRef) configures a TypeSpec model with a reference to an external schema that will be used in place of references to that model's schema:

```typespec
// Whenever the OpenAPI emitter would try to reference the Sku model's schema, it will reference the below
// external schema instead.
@useRef("common.json#/components/schemas/Sku")
model Sku {
  name: string;
  tier: string;
}
```

### Enums

TypeSpec enums and unions convert to OpenAPI enum schemas. You can define enums in two ways:

**TypeSpec enum declaration:**

```typespec
enum Color {
  Red: "red",
  Blue: "blue",
  Green: "green",
}
```

**Union of literal values:**

```typespec
model Settings {
  // `status` can be any of the following strings.
  status: "Running" | "Stopped" | "Failed";
}
```

Both approaches result in an OpenAPI schema with a type of `string` and an `enum` array containing the specified values.

## Model Composition

TypeSpec offers several ways to compose models.

### Spread Operator

The spread operator copies properties from one model to another without creating a semantic relationship:

```typespec
model Address {
  street: string;
  city: string;
  state: string;
}

model UserProfile {
  name: string;

  // Copy all the properties of Address into this model as if they were declared here.
  ...Address;

  email: string;
}
```

In OpenAPI, the result is a flat schema named `UserProfile` with the properties of `Address` declared inline.

### Extends Keyword

The `extends` keyword creates an inheritance relationship:

```typespec
model Pet {
  name: string;
  age: int32;
}

model Dog extends Pet {
  breed: string;
}
```

In OpenAPI, this creates a schema `Dog` that references the schema `Pet` using `allOf`.

#### Discriminated Union with Extends

You can create discriminated type hierarchies using the `@discriminator` decorator:

```typespec
@discriminator("kind")
model Pet {
  name: string;
  kind: string;
}

model Dog extends Pet {
  kind: "dog"; // Must be a literal string value
  breed: string;
}

model Cat extends Pet {
  kind: "cat"; // Must be a literal string value
  whiskerCount: int32;
}
```

This creates a discriminator object in the OpenAPI schema with a mapping from discriminator values to schemas.

### Is Keyword

The `is` keyword creates a new model with the same shape as another model:

```typespec
model Address {
  street: string;
  city: string;
}

model ShippingDetails is Address {
  zipCode: string; // Additional property
}
```

In OpenAPI, `ShippingDetails` is an independent schema with all properties from `Address` plus `zipCode`.

### Unions

Unions represent values that could be one of several types:

**Union type alias:**

```typespec
alias PetType = Dog | Cat | Hamster;
```

**Named union declaration:**

```typespec
union PetType {
  dog: Dog,
  cat: Cat,
  hamster: Hamster,
}
```

By default, unions emit as `anyOf` in OpenAPI. You can use the [`@oneOf` decorator](./reference/decorators.md#@TypeSpec.OpenAPI.oneOf) on a named union declaration to emit it as `oneOf` instead:

```typespec
@oneOf
union PetType {
  dog: Dog,
  cat: Cat,
  hamster: Hamster,
}
```

## Encoding and Formats

The `@encode` decorator lets you control how TypeSpec types are serialized. The general pattern is:

```typespec
@encode("<encoding name>", encodingTargetType) property: trueType;
```

Where:

- `"<encoding name>"`: The format or method of encoding (e.g., `"base64"`, `"rfc3339"`, `"unixTimestamp"`)
- `encodingTargetType`: The type to encode to and decode from (e.g., `int32`, `string`)
- `trueType`: The "true" semantic data type of the property (e.g., `duration`, `utcDateTime`)

The emitter follows these rules to determine the OpenAPI format:

1. For date/time types:

   - `@encode("rfc3339", string) _: utcDateTime` → `type: string, format: date-time`
   - `@encode("rfc7231", string) _: utcDateTime` → `type: string, format: http-date`
   - `@encode("unixTimestamp", int32) _: utcDateTime` → `type: integer, format: unixtime`

2. For other types, the format comes from either the encoding name or the `encodingTargetType`'s format.

This table summarizes common encodings:

| TypeSpec with encoding                           | OpenAPI 3 result                  |
| ------------------------------------------------ | --------------------------------- |
| `@encode("seconds", int32) _: duration`          | `type: integer, format: int32`    |
| `@encode("ISO8601") _: duration`                 | `type: number, format: duration`  |
| `@encode("unixTimestamp", int64) _: utcDateTime` | `type: integer, format: unixtime` |
| `@encode("rfc3339") _: utcDateTime`              | `type: string, format: date-time` |

## Security Definitions

Use the [(HTTP) `@useAuth` decorator][http-useauth-decorator] to define authentication and security schemes for your API.

For example, to define an authentication/authorization scheme based on Microsoft Entra ID:

```typespec
@useAuth(EntraIDToken)
namespace Contoso.WidgetManager;

/** Microsoft Entra ID OAuth2 Flow */
model EntraIDToken
  is OAuth2Auth<[
    {
      type: OAuth2FlowType.authorizationCode;
      authorizationUrl: "https://api.example.com/oauth2/authorize";
      tokenUrl: "https://api.example.com/oauth2/token";
      scopes: ["https://management.azure.com/read", "https://management.azure.com/write"];
    }
  ]>;
```

Authentication/authorization is a complex and highly configurable feature. See the [`@useAuth` decorator documentation for more information][http-useauth-decorator].

[http-useauth-decorator]: ../../libraries/http/reference/decorators.md#@TypeSpec.Http.useAuth
