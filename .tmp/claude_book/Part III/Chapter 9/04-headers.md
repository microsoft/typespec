# Headers

HTTP headers allow clients and servers to pass additional information with requests and responses. In TypeSpec, headers are defined using the `@header` decorator, providing a clear way to specify required and optional headers for your API operations.

## Understanding HTTP Headers

HTTP headers are name-value pairs that appear in both request and response messages. They serve various purposes:

- Authentication (`Authorization`)
- Content negotiation (`Accept`, `Content-Type`)
- Caching directives (`Cache-Control`, `ETag`)
- Protocol control (`Keep-Alive`, `Connection`)
- Custom application-specific metadata

TypeSpec gives you fine-grained control over how your API uses headers.

## Using the `@header` Decorator

The `@header` decorator marks a parameter or property as an HTTP header:

```typespec
@route("/documents")
interface Documents {
  @get
  listDocuments(@header accept: "application/json", @header authorization: string): Document[];
}
```

In this example:

- `accept` is a required request header with a fixed value of "application/json"
- `authorization` is a required request header containing a string value (typically a Bearer token)

## Request Headers

Request headers are defined as parameters in operations:

```typespec
@route("/users")
interface Users {
  @get
  getUsers(
    @header authorization: string,
    @header("X-API-Version") apiVersion: string,
    @header ifNoneMatch?: string,
  ): User[];
}
```

Note that you can:

- Make headers optional using the `?` suffix
- Customize the header name using a string parameter to `@header`

## Response Headers

Response headers are defined in the operation's return type:

```typespec
@route("/documents/{id}")
@get
op getDocument(@path id: string): {
  @body document: Document;
  @header etag: string;
  @header("Last-Modified") lastModified: utcDateTime;
};
```

This example defines a return type with:

- A response body (`document`)
- Two response headers (`etag` and `Last-Modified`)

## Header Naming Conventions

By default, TypeSpec converts header names from camelCase to kebab-case:

```typespec
@header contentType: "application/json";  // becomes "content-type"
@header ifNoneMatch: string;              // becomes "if-none-match"
```

You can override this behavior by explicitly specifying the header name:

```typespec
@header("Content-Type") contentType: "application/json";
@header("If-None-Match") ifNoneMatch: string;
```

## Standard HTTP Headers

While you can define any headers you need, it's good practice to use standard HTTP headers when available. Some common headers include:

### Request Headers

- `Accept`: Content types the client can process
- `Authorization`: Authentication credentials
- `Content-Type`: Format of the request body
- `If-Match`, `If-None-Match`: Conditional requests
- `If-Modified-Since`: Conditional requests based on time

### Response Headers

- `Content-Type`: Format of the response body
- `Content-Length`: Size of the response body in bytes
- `ETag`: Entity tag for caching
- `Last-Modified`: When the resource was last modified
- `Location`: URL for redirects or newly created resources

## Header Options

For more control over header behavior, you can use the object notation with the `@header` decorator:

```typespec
@route("/items")
@get
op listItems(
  @header({
    name: "Accept",
    explode: true,
  })
  accept: string[],
): Item[];
```

The `explode` option controls how array values are serialized in the header. With `explode: true`, array elements are comma-separated.

## Header Data Types

Headers can have various data types in TypeSpec:

```typespec
@route("/examples")
interface Examples {
  @get
  getExamples(
    // String header
    @header accept: string,

    // Constrained string header (union of string literals)
    @header contentType: "application/json" | "application/xml",

    // Numeric header
    @header("X-Rate-Limit") rateLimit: int32,

    // Boolean header
    @header("X-Feature-Enabled") featureEnabled: boolean,

    // Date header
    @header("If-Modified-Since") ifModifiedSince: utcDateTime,

    // Array header (comma-separated by default)
    @header("X-Requested-Fields") fields: string[],
  ): void;
}
```

## Authentication Headers

Authentication often uses HTTP headers. TypeSpec provides authentication models to handle common auth patterns:

```typespec
import "@typespec/http";
using TypeSpec.Http;

@service
@useAuth(BearerAuth)
namespace SecureAPI;

@route("/protected")
interface ProtectedResources {
  @get
  getData(): Resource[];
}
```

This example uses the `BearerAuth` type from the HTTP library, which will require the `Authorization` header with a Bearer token.

## Common Authentication Headers

The HTTP library provides models for common authentication schemes:

```typespec
// Basic authentication (username/password)
@useAuth(BasicAuth)

// Bearer token (OAuth2, JWT, etc.)
@useAuth(BearerAuth)

// API key (in header, query, or cookie)
@useAuth(ApiKeyAuth<ApiKeyLocation.header, "X-API-Key">)
```

## Custom Headers

You can define custom headers for application-specific needs:

```typespec
@route("/analytics")
interface Analytics {
  @get
  getMetrics(
    @header("X-Organization-ID") orgId: string,
    @header("X-Dashboard-ID") dashboardId?: string,
  ): Metrics;
}
```

Custom headers typically use the `X-` prefix by convention, though this is no longer a formal requirement in HTTP specifications.

## Header Models

For common header combinations, you can create models with header properties:

```typespec
model ConditionalRequestHeaders {
  @header ifMatch?: string;
  @header ifNoneMatch?: string;
  @header ifModifiedSince?: utcDateTime;
  @header ifUnmodifiedSince?: utcDateTime;
}

@route("/documents/{id}")
@get
op getDocument(@path id: string, ...ConditionalRequestHeaders): Document;
```

This technique using the spread operator (`...`) lets you reuse header groups across operations.

## Content Negotiation Headers

Content negotiation headers specify the formats clients can accept and what servers provide:

```typespec
@route("/data")
interface Data {
  @get
  getData(@header accept: "application/json" | "application/xml" = "application/json"): {
    @body data: DataObject;
    @header contentType: "application/json" | "application/xml";
  };
}
```

In this example:

- The client specifies acceptable formats with the `accept` header
- The server indicates the actual format with the `contentType` header

## Caching Headers

TypeSpec can model headers used for caching:

```typespec
@route("/resources/{id}")
@get
op getResource(@path id: string): {
  @body resource: Resource;
  @header etag: string;
  @header lastModified: utcDateTime;
  @header cacheControl: "public, max-age=3600";
};
```

These headers help clients and proxies cache resources efficiently.

## Conditional Request Example

Here's a complete example of a conditional request pattern using headers:

```typespec
@service
namespace DocumentService;

model Document {
  id: string;
  title: string;
  content: string;
  version: int32;
  lastModified: utcDateTime;
}

@route("/documents")
interface Documents {
  // Get a document with ETag support
  @get
  @route("/{id}")
  getDocument(@path id: string, @header ifNoneMatch?: string): {
    @statusCode(200)
    @body
    document: Document;

    @header etag: string;
    @header lastModified: utcDateTime;
  } | {
    @statusCode(304) // Not Modified
    @header
    etag: string;
  };

  // Update a document with concurrency control
  @put
  @route("/{id}")
  updateDocument(@path id: string, @header ifMatch: string, @body document: Document): {
    @statusCode(200)
    @body
    document: Document;

    @header etag: string;
  } | {
    @statusCode(412) // Precondition Failed
    @body
    error: {
      code: "ConcurrencyConflict";
      message: string;
    };
  };
}
```

This example shows how headers enable conditional requests and concurrency control.

## Best Practices for HTTP Headers

When working with headers in TypeSpec, follow these best practices:

1. **Use standard HTTP headers** when available instead of inventing custom ones.

2. **Make headers required only when necessary** to keep your API flexible:

   ```typespec
   // Required only when truly needed
   @header authorization: string;

   // Optional in most other cases
   @header ifNoneMatch?: string;
   ```

3. **Provide sensible defaults** for headers when possible:

   ```typespec
   @header accept: "application/json" = "application/json";
   ```

4. **Document header usage** with the `@doc` decorator:

   ```typespec
   @doc("Authentication token using Bearer scheme")
   @header authorization: string;
   ```

5. **Group related headers** into reusable models for consistency.

6. **Use the correct data types** for headers (e.g., `utcDateTime` for date headers).

7. **Apply constraints** to header values when the format is restricted:

   ```typespec
   @header contentType: "application/json" | "application/xml";
   ```

8. **Use casing conventions consistently** (TypeSpec automatically converts camelCase to kebab-case).

By carefully modeling headers in TypeSpec, you create a clear contract for how clients and servers should exchange metadata in your API.
