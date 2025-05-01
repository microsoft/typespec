# Request and Response Bodies

In HTTP APIs, request and response bodies contain the data being sent to or from the server. TypeSpec provides several ways to define and work with these bodies, making it easy to create clear, consistent API contracts.

## Understanding Request and Response Bodies

In RESTful APIs, bodies typically contain:

- Request data for creating or updating resources
- Response data returned from the server
- Structured error information

TypeSpec allows you to define these bodies with precision, including their structure, validation rules, and serialization formats.

## Using the `@body` Decorator

The `@body` decorator is used to mark model properties that should be included in the HTTP request or response body:

```typespec
@route("/users")
interface Users {
  @post
  createUser(@body user: User): {
    @statusCode(201)
    @body
    createdUser: User;
  };
}
```

In this example:

- The `user` parameter of `createUser` is marked with `@body`, indicating it should be read from the request body
- The `createdUser` property in the return type is marked with `@body`, indicating it should be serialized to the response body

## Implicit Bodies

TypeSpec often handles bodies implicitly, simplifying common patterns:

```typespec
@route("/users")
interface Users {
  @post
  createUser(user: User): User;
}
```

In this example:

- The `user` parameter is implicitly treated as the request body (for non-GET operations with a single unmarked parameter)
- The return type `User` is implicitly treated as the response body

This implicit behavior makes your TypeSpec code more concise for typical RESTful operations.

## Complex Request Bodies

For more complex request bodies, you can use models or anonymous objects:

```typespec
model CreateUserRequest {
  name: string;
  email: string;
  password: string;
  preferences?: {
    theme: "light" | "dark";
    emailNotifications: boolean;
  };
}

@route("/users")
interface Users {
  @post
  createUser(@body request: CreateUserRequest): User;
}
```

## Multiple Body Properties

You can structure request or response bodies with multiple properties:

```typespec
@route("/documents")
interface Documents {
  @post
  createDocument(
    @body content: string,
    @body metadata: {
      title: string;
      tags: string[];
      isPublic: boolean;
    },
  ): Document;
}
```

In this case, TypeSpec will combine the `content` and `metadata` properties into a single JSON object for the request body.

## Using `@bodyRoot`

Sometimes, you want to customize how the body is structured. The `@bodyRoot` decorator specifies that a parameter should be the root of the request body:

```typespec
@route("/images")
interface Images {
  @post
  uploadImage(@bodyRoot image: bytes, @header contentType: "image/jpeg" | "image/png"): {
    id: string;
    url: string;
  };
}
```

In this example, the `image` parameter will be the entire request body (not wrapped in a JSON object).

## Ignoring Properties in Bodies with `@bodyIgnore`

The `@bodyIgnore` decorator prevents properties from being included in request or response bodies:

```typespec
@route("/orders")
interface Orders {
  @post
  createOrder(
    @body order: Order,
    @bodyIgnore metadata: {
      @header("X-Tracking-ID") trackingId: string;
    },
  ): Order;
}
```

Here, the `metadata` parameter is excluded from the request body but still processed for its HTTP metadata (headers).

## Handling Different Response Types

TypeSpec makes it easy to define operations that can return different response types:

```typespec
@route("/users/{id}")
@get
op getUser(@path id: string): {
  @statusCode(200)
  @body
  user: User;
} | {
  @statusCode(404)
  @body
  error: {
    code: "UserNotFound";
    message: string;
  };
};
```

This pattern is useful for operations that can return different response structures based on status codes.

## Predefined Response Types

The HTTP library includes predefined response types for common patterns:

```typespec
@route("/users/{id}")
@get
op getUser(@path id: string): OkResponse & {
  @body user: User;
};

@route("/users")
@post
op createUser(@body user: CreateUserRequest): CreatedResponse & {
  @body user: User;
  @header location: string;
};

@route("/users/{id}")
@delete
op deleteUser(@path id: string): NoContentResponse;
```

These predefined types set the appropriate status codes and provide consistent response structures across your API.

## Working with Empty Bodies

For operations that don't return a body, you can use `void` or the appropriate response type:

```typespec
// Using void
@route("/users/{id}")
@delete
op deleteUser(@path id: string): void;

// Using a predefined response type
@route("/users/{id}")
@delete
op deleteUser(@path id: string): NoContentResponse;
```

Both approaches indicate that the operation doesn't return a response body.

## Handling File Bodies

TypeSpec provides special handling for file uploads and downloads using the `File` type:

```typespec
import "@typespec/http";
using TypeSpec.Http;

@route("/files")
interface Files {
  // Upload a file (binary body)
  @post
  uploadFile(@bodyRoot file: File): {
    id: string;
    size: int64;
  };

  // Download a file (binary response)
  @get
  @route("/{id}")
  downloadFile(@path id: string): File;
}
```

The `File` type handles binary content appropriately, including setting content types and handling file metadata.

## Body Serialization

By default, TypeSpec assumes JSON serialization for request and response bodies. You can specify different formats using content type headers:

```typespec
@route("/data")
interface Data {
  @post
  uploadJson(@body data: object, @header contentType: "application/json"): void;

  @post
  @route("/xml")
  uploadXml(@body data: string, @header contentType: "application/xml"): void;

  @post
  @route("/text")
  uploadText(@body data: string, @header contentType: "text/plain"): void;
}
```

## Request and Response Examples

Let's examine a complete example with various request and response patterns:

```typespec
@service
namespace ProductCatalog;

model Product {
  id: string;
  name: string;
  description: string;
  price: decimal;
  categories: string[];
  created: utcDateTime;
  updated: utcDateTime;
}

model CreateProductRequest {
  name: string;
  description: string;
  price: decimal;
  categories: string[];
}

model ProductList {
  items: Product[];
  nextLink?: string;
}

model Error {
  code: string;
  message: string;
  details?: Record<unknown>;
}

@route("/products")
interface Products {
  // Get products with query parameters
  @get
  listProducts(
    @query limit?: int32 = 20,
    @query offset?: int32 = 0,
    @query category?: string,
  ): ProductList;

  // Create product with body
  @post
  createProduct(@body product: CreateProductRequest): CreatedResponse & {
    @body product: Product;
    @header location: string;
  };

  // Get product by ID with different possible responses
  @get
  @route("/{id}")
  getProduct(@path id: string): {
    @statusCode(200)
    @body
    product: Product;
  } | {
    @statusCode(404)
    @body
    error: Error;
  };

  // Update product with complete replacement
  @put
  @route("/{id}")
  updateProduct(@path id: string, @body product: CreateProductRequest): Product;

  // Update product with partial update
  @patch
  @route("/{id}")
  partialUpdateProduct(@path id: string, @body updates: Partial<CreateProductRequest>): Product;

  // Delete product (no response body)
  @delete
  @route("/{id}")
  deleteProduct(@path id: string): NoContentResponse;
}
```

This example demonstrates various request and response body patterns used in a typical RESTful API.

## Best Practices for Request and Response Bodies

When designing request and response bodies in TypeSpec, consider these best practices:

1. **Use clear, consistent models** for request and response bodies to make your API more predictable.

2. **Separate models for creation, updates, and responses** to avoid oversharing fields or validation issues:

   ```typespec
   model User {
     id: string;
     name: string;
     email: string;
     role: string;
     created: utcDateTime;
   }
   model CreateUser {
     name: string;
     email: string;
   }
   model UpdateUser {
     name?: string;
     email?: string;
   }
   ```

3. **Use appropriate status codes** with matching response structures.

4. **Provide detailed error responses** with error codes, messages, and details:

   ```typespec
   model ErrorResponse {
     code: string;
     message: string;
     details?: Record<unknown>;
   }
   ```

5. **Consider pagination** for endpoints that return collections:

   ```typespec
   model PagedResponse<T> {
     items: T[];
     totalCount: int32;
     nextLink?: string;
   }
   ```

6. **Be explicit with content types** for non-JSON formats.

7. **Use consistent field naming conventions** across all models.

8. **Document your models** using the `@doc` decorator for clear developer documentation:
   ```typespec
   @doc("Represents a user in the system")
   model User {
     @doc("Unique identifier for the user")
     id: string;

     @doc("User's full name")
     name: string;
   }
   ```

By following these practices, you'll create a more consistent, understandable, and maintainable API.
