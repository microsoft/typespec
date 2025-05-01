# Content Types

Content types (also known as media types or MIME types) specify the format of data being sent or received in HTTP requests and responses. In TypeSpec, you can define content types for your API operations to create clear contracts about the data formats your API supports.

## Understanding Content Types

A content type is a string that follows the format defined in [RFC 6838](https://tools.ietf.org/html/rfc6838), typically consisting of a type and a subtype (e.g., `application/json`, `image/png`). In HTTP APIs, content types are specified in the following headers:

- **`Content-Type`**: Indicates the format of the request or response body
- **`Accept`**: Specifies which content types the client can process in the response

TypeSpec provides several ways to work with content types in your API definitions.

## Default Content Types

By default, TypeSpec's HTTP library assumes JSON as the content type for request and response bodies. This means that if you don't specify content types explicitly, the following assumptions are made:

- Request bodies are expected to be `application/json`
- Response bodies are serialized as `application/json`

This default behavior simplifies the most common case for REST APIs.

## Specifying Content Types Explicitly

You can explicitly define content types using the `@header` decorator:

```typespec
@route("/users")
interface Users {
  @post
  createUser(@header contentType: "application/json", @body user: User): {
    @header contentType: "application/json";
    @body user: User;
  };
}
```

In this example, both the request and response content types are explicitly set to `application/json`.

## Supporting Multiple Content Types

Your API might need to support multiple content types for the same operation. You can define this using union types:

```typespec
@route("/products")
interface Products {
  @post
  createProduct(
    @header contentType: "application/json" | "application/xml",
    @body product: Product,
  ): {
    @header contentType: "application/json" | "application/xml";
    @body product: Product;
  };
}
```

This example indicates that the operation accepts and can return either JSON or XML data.

## Working with JSON

JSON is the most common format for web APIs and is well-supported in TypeSpec. When using JSON, your TypeSpec models will be serialized according to standard JSON conventions:

```typespec
model User {
  id: string;
  name: string;
  email: string;
  age?: int32;
  tags: string[];
  metadata: Record<string>;
}
```

This model would be serialized as JSON like this:

```json
{
  "id": "user123",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "age": 32,
  "tags": ["customer", "premium"],
  "metadata": {
    "lastLogin": "2025-03-15T14:30:00Z",
    "preferences": {
      "theme": "dark"
    }
  }
}
```

TypeSpec's built-in types map to JSON types as follows:

| TypeSpec Type                  | JSON Type               |
| ------------------------------ | ----------------------- |
| `string`, `url`, `email`, etc. | String                  |
| `int32`, `float64`, etc.       | Number                  |
| `boolean`                      | Boolean                 |
| `null`                         | null                    |
| Array types (`string[]`)       | Array                   |
| Models                         | Object                  |
| `Record<T>`                    | Object                  |
| Union types                    | Any of the member types |
| String literals                | String                  |
| Numeric literals               | Number                  |
| `unknown`                      | Any JSON value          |

## Working with Form Data

Form data is commonly used for sending structured data in web applications. TypeSpec supports both URL-encoded forms and multipart forms.

### URL-Encoded Forms

URL-encoded form data (`application/x-www-form-urlencoded`) is sent as name-value pairs in the request body:

```typespec
@route("/login")
interface Auth {
  @post
  login(
    @header contentType: "application/x-www-form-urlencoded",
    @body credentials: {
      username: string;
      password: string;
      rememberMe?: boolean;
    },
  ): {
    @header contentType: "application/json";
    @body session: {
      token: string;
      expiresAt: utcDateTime;
    };
  };
}
```

In this example, the login operation accepts form-encoded credentials but returns JSON data.

### Multipart Form Data

Multipart form data (`multipart/form-data`) is particularly useful for file uploads. TypeSpec provides the `@multipartBody` decorator for working with multipart requests:

```typespec
import "@typespec/http";
using TypeSpec.Http;

@route("/upload")
interface FileUpload {
  @post
  uploadFile(
    @header contentType: "multipart/form-data",
    @multipartBody body: {
      file: HttpPart<File>;
      description?: HttpPart<string>;
      tags?: HttpPart<string[]>;
    },
  ): {
    @body result: {
      id: string;
      url: string;
      size: int64;
    };
  };
}
```

In this example:

- The `@multipartBody` decorator indicates that the body contains multipart form data
- Each field is wrapped with `HttpPart<T>` to indicate it's a part of the multipart body
- The `File` type represents file content (from the HTTP library)

## Other Content Types

TypeSpec's HTTP library supports various other content types beyond JSON and form data.

### Text Content

Plain text content (`text/plain`) can be represented using the `string` type:

```typespec
@route("/logs")
interface Logs {
  @post
  addLogEntry(@header contentType: "text/plain", @body logEntry: string): void;

  @get
  getLatestLogs(): {
    @header contentType: "text/plain";
    @body logs: string;
  };
}
```

### Binary Content

Binary data can be represented using the `bytes` type:

```typespec
@route("/binary")
interface BinaryData {
  @post
  uploadData(@header contentType: "application/octet-stream", @body data: bytes): {
    @body result: {
      id: string;
      size: int64;
    };
  };

  @get
  @route("/{id}")
  getData(@path id: string): {
    @header contentType: "application/octet-stream";
    @body data: bytes;
  };
}
```

### XML Content

For XML content (`application/xml`), TypeSpec doesn't provide specialized mappings, but you can indicate that your models should be serialized as XML:

```typespec
@route("/xml-data")
interface XmlData {
  @post
  createData(@header contentType: "application/xml", @body data: XmlDocument): {
    @header contentType: "application/xml";
    @body result: XmlResponse;
  };
}

model XmlDocument {
  rootElement: string;
  // XML document structure
}

model XmlResponse {
  status: string;
  // Response structure
}
```

## Content Negotiation

Content negotiation allows clients to request specific formats from the server. In TypeSpec, you can model this using the `Accept` header:

```typespec
@route("/resources/{id}")
@get
op getResource(
  @path id: string,
  @header accept: "application/json" | "application/xml" = "application/json",
): {
  @header contentType: "application/json" | "application/xml";
  @body resource: Resource;
};
```

In this example:

- The client can request either JSON or XML using the `Accept` header
- The default is JSON if not specified
- The response will include a `Content-Type` header indicating the format used

## Media Type Hint with `@mediaType`

TypeSpec provides the `@mediaType` decorator to specify the media type of a particular type:

```typespec
@mediaType("application/json")
model JsonPayload {
  // JSON-specific structure
}

@mediaType("application/xml")
model XmlPayload {
  // XML-specific structure
}

@route("/data")
interface DataService {
  @post
  submitData(@body data: JsonPayload | XmlPayload): void;
}
```

The `@mediaType` decorator provides a hint to emitters about the expected serialization format.

## Vendor-Specific Content Types

For custom or vendor-specific formats, you can use appropriate content type strings:

```typespec
@route("/custom-format")
interface CustomFormat {
  @post
  process(@header contentType: "application/vnd.company.custom+json", @body data: CustomData): {
    @header contentType: "application/vnd.company.custom+json";
    @body result: CustomResult;
  };
}
```

## Streaming Content Types

For streaming responses, you can use specific content types with appropriate models:

```typespec
@route("/events")
interface Events {
  @get
  streamEvents(): {
    @header contentType: "text/event-stream";
    @body events: EventStream;
  };
}

model EventStream {
  // Represents a stream of events
}
```

## Best Practices for Content Types

When working with content types in TypeSpec, consider these best practices:

1. **Be explicit about supported content types** when they differ from the default JSON:

   ```typespec
   @header contentType: "application/xml"
   ```

2. **Use standard content types** when possible instead of inventing custom ones.

3. **Document supported content types** in your API documentation:

   ```typespec
   @doc("Accepts and returns user data in JSON format")
   op createUser(@body user: User): User;
   ```

4. **Provide consistent error handling** for unsupported content types:

   ```typespec
   @error
   model UnsupportedMediaTypeError {
     code: "UnsupportedMediaType";
     message: string;
     supportedTypes: string[];
   }
   ```

5. **Consider default values** for content negotiation:

   ```typespec
   @header accept: "application/json" | "application/xml" = "application/json"
   ```

6. **Be mindful of the implications** of supporting multiple content types on your implementation complexity.

By using TypeSpec's content type features effectively, you can create clear contracts for the data formats your API accepts and returns, making it easier for clients to interact with your service correctly.
