# CRUD Operations

## Introduction to CRUD in REST APIs

CRUD (Create, Read, Update, Delete) operations form the backbone of most REST APIs. These operations allow clients to manipulate resources through standard HTTP methods.

TypeSpec's REST library provides specialized decorators and interfaces to implement CRUD operations consistently across your API. In this section, we'll explore how to define and use these operations.

## CRUD Operation Decorators

The REST library includes specific decorators that mark operations as performing CRUD actions on resources:

| Decorator          | Purpose                                                              |
| ------------------ | -------------------------------------------------------------------- |
| `@createsResource` | Marks an operation that creates a new instance of a resource         |
| `@readsResource`   | Marks an operation that retrieves a resource instance                |
| `@updatesResource` | Marks an operation that updates a resource instance                  |
| `@deletesResource` | Marks an operation that removes a resource instance                  |
| `@listsResource`   | Marks an operation that retrieves a collection of resource instances |

These decorators help enforce consistency and enable automated route generation.

## Basic CRUD Operations

Let's look at how to implement basic CRUD operations for a `Product` resource:

```typespec
@resource("products")
model Product {
  @key
  id: string;

  name: string;
  description: string;
  price: decimal;
}

@route("/products")
interface Products {
  @listsResource(Product)
  @get
  list(): Product[];

  @readsResource(Product)
  @get
  read(@path id: string): Product;

  @createsResource(Product)
  @post
  create(@body product: Product): Product;

  @updatesResource(Product)
  @put
  update(@path id: string, @body product: Product): Product;

  @deletesResource(Product)
  @delete
  delete(@path id: string): void;
}
```

## Predefined Operation Interfaces

TypeSpec's REST library includes predefined interfaces for CRUD operations, allowing you to implement resource operations with minimal code:

```typespec
@resource("products")
model Product {
  @key
  id: string;

  name: string;
  description: string;
  price: decimal;
}

@route("/products")
interface Products extends ResourceOperations<Product, Error> {}
```

The `ResourceOperations` interface includes all standard CRUD operations. This approach ensures consistency across your API and reduces duplication.

## Detailed Operation Interfaces

You can use more specific interfaces for finer control:

- `ResourceCollectionOperations` - For collection operations (create, list)
- `ResourceInstanceOperations` - For instance operations (read, update, delete)

```typespec
@resource("products")
model Product {
  @key
  id: string;

  name: string;
  description: string;
  price: decimal;
}

@route("/products")
interface ProductCollection extends ResourceCollectionOperations<Product, Error> {}

@route("/products/{id}")
interface ProductInstance extends ResourceInstanceOperations<Product, Error> {}
```

## CRUD for Nested Resources

For child resources in a hierarchy, use the `ExtensionResourceOperations` interface:

```typespec
@resource("users")
model User {
  @key
  id: string;

  name: string;
}

@parentResource(User)
@resource("orders")
model Order {
  @key
  id: string;

  total: decimal;
  items: OrderItem[];
}

interface UserOrders extends ExtensionResourceOperations<Order, User, Error> {}
```

This automatically creates the proper nested routes and operations:

- GET /users/{userId}/orders
- GET /users/{userId}/orders/{orderId}
- POST /users/{userId}/orders
- PUT /users/{userId}/orders/{orderId}
- DELETE /users/{userId}/orders/{orderId}

## Create Operations

Create operations add new resources to a collection. The REST library provides specialized models for create operations:

```typespec
@resource("users")
model User {
  @key
  @visibility("read") // Only visible in responses
  id: string;

  name: string;
  email: string;
  @visibility("create") // Only visible in create requests
  password: string;
}

@route("/users")
interface Users {
  @post
  create(@body user: ResourceCreateModel<User>): ResourceCreatedResponse<User>;
}
```

The `ResourceCreateModel` automatically applies the proper visibility filters for create operations.

## Read Operations

Read operations retrieve either a single resource or a collection of resources:

```typespec
@route("/products")
interface Products {
  // Read a single product
  @get
  read(@path id: string): Product | Error;

  // List all products
  @get
  list(): CollectionWithNextLink<Product> | Error;
}
```

The `CollectionWithNextLink` model adds pagination support to collection responses.

## Update Operations

There are multiple approaches to updating resources:

### PUT - Full Update

PUT operations typically replace a resource entirely:

```typespec
@route("/users")
interface Users {
  @put
  update(@path id: string, @body user: User): User | Error;
}
```

### PATCH - Partial Update

PATCH operations modify only the provided properties:

```typespec
model UserPatch {
  name?: string;
  email?: string;
}

@route("/users")
interface Users {
  @patch
  partialUpdate(@path id: string, @body user: UserPatch): User | Error;
}
```

## Delete Operations

Delete operations remove resources. They can return different status codes:

```typespec
@route("/products")
interface Products {
  // Return 204 No Content
  @delete
  delete(@path id: string): ResourceDeletedResponse | Error;

  // Alternatively, return the deleted resource
  @delete
  deleteAndReturn(@path id: string): Product | Error;
}
```

## Standard Response Models

The REST library provides standard response models:

| Model                        | Description                                    |
| ---------------------------- | ---------------------------------------------- |
| `ResourceCreatedResponse<T>` | 201 Created response with the created resource |
| `ResourceDeletedResponse`    | 204 No Content response for deletion           |
| `CollectionWithNextLink<T>`  | Collection response with pagination support    |

Using these models ensures consistency across your API:

```typespec
@route("/products")
interface Products {
  @post
  create(@body product: Product): ResourceCreatedResponse<Product> | Error;

  @get
  list(
    @query page: int32 = 1,
    @query pageSize: int32 = 10,
  ): CollectionWithNextLink<Product> | Error;

  @delete
  delete(@path id: string): ResourceDeletedResponse | Error;
}
```

## Handling Errors

CRUD operations should have consistent error handling. Define a standard error model:

```typespec
model Error {
  code: string;
  message: string;
  details?: string;
}
```

Then use union types to combine success and error responses:

```typespec
@route("/products")
interface Products {
  @get
  read(@path id: string): Product | Error;
}
```

## Best Practices for CRUD Operations

1. **Use Standard HTTP Methods**: Map operations to their corresponding HTTP methods (GET, POST, PUT, DELETE).

2. **Return Appropriate Status Codes**: Use 200 for successful operations, 201 for creation, 204 for deletion with no content.

3. **Apply Proper Visibility**: Use the `@visibility` decorator to control which properties are visible in requests vs. responses.

4. **Handle Not Found Gracefully**: Return 404 Not Found when a resource doesn't exist.

5. **Use Consistent Response Formats**: Keep response structures consistent for similar operations.

6. **Document Operations**: Use the `@doc` decorator to describe what each operation does.

```typespec
@route("/products")
interface Products {
  @doc("Creates a new product in the catalog")
  @post
  create(@body product: Product): ResourceCreatedResponse<Product> | Error;

  @doc("Retrieves a product by its unique identifier")
  @get
  read(@path id: string): Product | Error;
}
```

7. **Validate Inputs**: Use TypeSpec validators like `@minLength`, `@maxValue`, etc., to validate inputs.

```typespec
@resource("products")
model Product {
  @key
  id: string;

  @minLength(1)
  @maxLength(100)
  name: string;

  @minValue(0)
  price: decimal;
}
```

In the next section, we'll explore collection endpoints and more advanced patterns for working with resource collections.
