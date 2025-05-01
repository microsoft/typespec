# Metadata Handling

In HTTP APIs, metadata refers to data that describes or augments the primary resources but isn't part of the resource's core representation. TypeSpec provides powerful mechanisms for handling metadata in your API definitions, ensuring that different types of metadata are appropriately represented in requests, responses, and documentation.

## Understanding Metadata in APIs

API metadata typically includes:

1. **Resource Metadata**: Additional information about resources (e.g., creation dates, modification info)
2. **Operation Metadata**: Information about API operations (e.g., deprecation status, rate limits)
3. **Request/Response Metadata**: Data carried in headers or other non-body parts of HTTP transactions

TypeSpec offers various techniques to model these different types of metadata clearly and consistently.

## Automatic Visibility with Lifecycle

One of TypeSpec's most powerful features for metadata handling is the `visibility` decorator with `Lifecycle` modifiers. This allows you to control which properties of a model are included in different operation contexts.

### Using Visibility Modifiers

The `visibility` decorator with `Lifecycle` can be applied to model properties to control when they appear:

```typespec
model User {
  id: string;
  name: string;
  email: string;

  @visibility(Lifecycle.Read)
  lastLoginTime: utcDateTime;

  @visibility(Lifecycle.Create | Lifecycle.Update, false)
  createdAt: utcDateTime;

  @visibility(Lifecycle.Create | Lifecycle.Update, false)
  updatedAt: utcDateTime;
}
```

In this example:

- `lastLoginTime` is only included in read operations (GET)
- `createdAt` and `updatedAt` are excluded from create and update operations (POST, PUT, PATCH)

### Default Lifecycle Mappings

The HTTP library maps operation verbs to lifecycle stages by default:

| HTTP Verb | Lifecycle Stage                    |
| --------- | ---------------------------------- |
| GET       | Lifecycle.Read                     |
| POST      | Lifecycle.Create                   |
| PUT       | Lifecycle.Create, Lifecycle.Update |
| PATCH     | Lifecycle.Update                   |
| DELETE    | Lifecycle.Delete                   |

This automatic mapping means that when you define a property with specific visibility, it will be included or excluded appropriately based on the HTTP method.

### Customizing Visibility

You can customize the default visibility mapping for operations using the `@parameterVisibility` and `@returnTypeVisibility` decorators:

```typespec
@returnTypeVisibility(Lifecycle.Read | Lifecycle.Create)
@get
op getWithExtraData(): User;

@parameterVisibility(Lifecycle.Create | Lifecycle.Update)
@post
op createWithCustomVisibility(@body user: User): User;
```

These decorators override the default lifecycle mapping for specific operations.

## Separating Core Data from Metadata

Another approach to metadata handling is to explicitly separate core data from metadata in your models:

```typespec
model ResourceMetadata {
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
  createdBy: string;
  version: int32;
}

model Product {
  id: string;
  name: string;
  description: string;
  price: decimal;

  // Metadata properties
  metadata: ResourceMetadata;
}
```

This pattern clearly distinguishes between the core business data and administrative metadata.

## Nested Metadata

For complex resources, you might need to nest metadata at multiple levels:

```typespec
model OrderItem {
  productId: string;
  quantity: int32;
  unitPrice: decimal;

  @doc("Metadata specific to this order item")
  metadata: {
    addedAt: utcDateTime;
    priceAtOrderTime: decimal;
    discount?: decimal;
  };
}

model Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: decimal;

  @doc("Metadata for the entire order")
  metadata: {
    createdAt: utcDateTime;
    updatedAt: utcDateTime;
    status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
    paymentInfo: {
      paymentMethod: string;
      transactionId?: string;
      paidAt?: utcDateTime;
    };
  };
}
```

This approach allows you to attach relevant metadata at each level of your resource hierarchy.

## Using Headers for Metadata

HTTP headers are a natural place for certain types of metadata. TypeSpec's `@header` decorator makes it easy to define header-based metadata:

```typespec
@route("/resources")
interface Resources {
  @get
  listResources(
    @header("X-API-Version") apiVersion: string,
    @header("If-Modified-Since")? ifModifiedSince: utcDateTime
  ): {
    @header("X-Rate-Limit-Remaining") rateLimit: int32,
    @header("X-Total-Count") totalCount: int32,
    @body resources: Resource[]
  };
}
```

This example includes:

- Request metadata in headers (API version, conditional fetch)
- Response metadata in headers (rate limit info, total count)

## Query Parameters as Metadata

Query parameters often represent metadata for read operations:

```typespec
@route("/products")
interface Products {
  @get
  listProducts(
    @query limit?: int32 = 50,
    @query offset?: int32 = 0,
    @query sort?: "name" | "price" | "newest" = "newest",
    @query order?: "asc" | "desc" = "asc",
    @query includeDeleted?: boolean = false,
  ): {
    @body products: Product[];
    @header("X-Total-Count") totalCount: int32;
  };
}
```

These query parameters represent metadata about how to fetch and format the results rather than being part of the resource data itself.

## Response Metadata with Wrapped Collections

A common pattern for including metadata in collection responses is to wrap the items in a container object:

```typespec
model PagedResult<T> {
  items: T[];

  // Metadata about the result set
  totalCount: int32;

  pageSize: int32;
  pageNumber: int32;
  totalPages: int32;
  nextLink?: string;
  prevLink?: string;
}

@route("/products")
interface Products {
  @get
  listProducts(@query pageSize?: int32 = 20, @query pageNumber?: int32 = 1): PagedResult<Product>;
}
```

This pattern keeps the collection metadata together with the items while clearly separating them.

## Resource State Metadata

Resources often have state information that affects their behavior:

```typespec
model User {
  id: string;
  email: string;
  name: string;

  // State metadata
  status: "active" | "suspended" | "invited";

  emailVerified: boolean;
  lastActiveAt?: utcDateTime;
  deactivatedAt?: utcDateTime;
}
```

These state fields affect how the resource behaves in the system but aren't part of the core business data.

## Versioning Metadata

Version information is important metadata for evolving APIs:

```typespec
@route("/api/v{version}")
interface Api {
  @get
  getResourceSchema(@path version: string, @query resourceType: string): {
    @header("API-Version") apiVersion: string;
    @header("Schema-Version") schemaVersion: string;
    @body schema: object;
  };
}
```

This pattern makes version information explicit in both the route and response headers.

## Audit Metadata

For compliance and tracking, audit metadata is often necessary:

```typespec
model AuditMetadata {
  createdAt: utcDateTime;
  createdBy: string;
  updatedAt: utcDateTime;
  updatedBy: string;
  version: int32;
  changeHistory?: ChangeRecord[];
}

model ChangeRecord {
  timestamp: utcDateTime;
  userId: string;
  action: string;
  changes: {
    fieldName: string;
    oldValue?: unknown;
    newValue: unknown;
  }[];
}

model SensitiveDocument {
  id: string;
  title: string;
  content: string;

  @visibility(Lifecycle.All)
  audit: AuditMetadata;
}
```

The `@visibility(Lifecycle.All)` decorator ensures that audit metadata is included in all operations, regardless of the HTTP method.

## Using Decorators for Metadata

TypeSpec decorators can themselves be considered metadata about types and operations:

```typespec
@doc("User resource representing a system user")
@access(Access.public)
model User {
  @doc("Unique identifier for the user")
  @minLength(1)
  id: string;

  @doc("User's email address, must be unique")
  @format("email")
  email: string;

  @doc("User's display name")
  @minLength(1)
  @maxLength(100)
  name: string;
}
```

These decorators provide metadata about the model and its properties that can be used for documentation, validation, and code generation.

## System Metadata vs. User Metadata

It's often useful to distinguish between system metadata and user-defined metadata:

```typespec
model Document {
  id: string;
  title: string;
  content: string;

  // System metadata (managed by the system)
  createdAt: utcDateTime;

  updatedAt: utcDateTime;
  version: int32;

  // User metadata (customizable by users)
  tags?: string[];

  categories?: string[];
  customProperties?: Record<unknown>;
}
```

This separation clarifies which metadata fields are controlled by the system versus those that users can modify.

## Operation-Specific Metadata Models

Sometimes, different operations need different metadata. You can model this using operation-specific models:

```typespec
model User {
  id: string;
  name: string;
  email: string;
}

model UserCreate {
  name: string;
  email: string;
  password: string;
}

model UserUpdate {
  name?: string;
  email?: string;
}

model UserResponse extends User {
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
  lastLogin?: utcDateTime;
  status: "active" | "inactive" | "suspended";
}

@route("/users")
interface Users {
  @get
  listUsers(): UserResponse[];

  @post
  createUser(@body user: UserCreate): UserResponse;

  @patch
  @route("/{id}")
  updateUser(@path id: string, @body user: UserUpdate): UserResponse;
}
```

This approach provides precise control over which fields are included in each operation context.

## Best Practices for Metadata Handling

When working with metadata in TypeSpec, consider these best practices:

1. **Use `@visibility` with `Lifecycle` modifiers** for automatic filtering of properties based on HTTP methods:

   ```typespec
   @visibility(Lifecycle.Read)
   createdAt: utcDateTime;
   ```

2. **Separate core data from metadata** when the distinction is clear:

   ```typespec
   model Resource {
     // Core data
     // ...

     // Metadata
     metadata: ResourceMetadata;
   }
   ```

3. **Use headers for transport-level metadata** like rate limits, cache controls, and timestamps:

   ```typespec
   @header("X-Rate-Limit-Remaining") rateLimit: int32;
   ```

4. **Wrap collections with metadata** to provide context about the result set:

   ```typespec
   model PagedResult<T> {
     items: T[];
     totalCount: int32;
     // Additional metadata...
   }
   ```

5. **Consider using different models for different operations** when metadata requirements vary significantly.

6. **Be consistent in metadata naming and structure** across your API for better developer experience.

7. **Document metadata fields** with the `@doc` decorator to explain their purpose and behavior.

8. **Use appropriate TypeSpec types** for metadata fields (e.g., `utcDateTime` for timestamps).

By following these practices, you'll create APIs with clear, consistent metadata handling that enhances usability and maintainability.
