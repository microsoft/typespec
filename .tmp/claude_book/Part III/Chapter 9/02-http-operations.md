# HTTP Operations

HTTP operations are the building blocks of RESTful APIs, representing the interactions between clients and servers. In TypeSpec, HTTP operations are defined using decorators that map operations to specific HTTP methods and routes.

## HTTP Verbs

HTTP uses different verbs (or methods) to indicate the action to be performed on a resource. The TypeSpec HTTP library provides decorators for all standard HTTP verbs:

| HTTP Verb | TypeSpec Decorator | Typical Usage                                  |
| --------- | ------------------ | ---------------------------------------------- |
| GET       | `@get`             | Retrieve data                                  |
| POST      | `@post`            | Create a new resource                          |
| PUT       | `@put`             | Update a resource (complete replacement)       |
| PATCH     | `@patch`           | Update a resource (partial modification)       |
| DELETE    | `@delete`          | Remove a resource                              |
| HEAD      | `@head`            | Same as GET but returns only headers (no body) |
| OPTIONS   | `@options`         | Get information about communication options    |

These decorators are applied to operation declarations to specify the HTTP method:

```typespec
@service
namespace BookStore;

@route("/books")
interface Books {
  @get
  listBooks(): Book[];

  @post
  createBook(@body book: Book): Book;

  @get
  @route("/{id}")
  getBook(@path id: string): Book;

  @put
  @route("/{id}")
  updateBook(@path id: string, @body book: Book): Book;

  @patch
  @route("/{id}")
  partialUpdateBook(@path id: string, @body updates: BookUpdate): Book;

  @delete
  @route("/{id}")
  deleteBook(@path id: string): void;
}
```

## Routes

Routes define the URL paths at which your API operations are available. In TypeSpec, routes are specified using the `@route` decorator:

```typespec
@route("/users")
interface Users {
  // This operation is available at GET /users
  @get
  listUsers(): User[];
}
```

### Route Hierarchies

Routes can be nested, creating a hierarchy. When you apply a `@route` decorator to a namespace or interface, all operations inside it inherit that route as a prefix:

```typespec
@service
@route("/api")
namespace MyService {
  @route("/users")
  interface Users {
    // This operation is available at GET /api/users
    @get
    listUsers(): User[];

    // This operation is available at GET /api/users/{id}
    @get
    @route("/{id}")
    getUser(@path id: string): User;
  }
}
```

### Route Parameters

Routes can include parameters that capture values from specific parts of the URL path. These parameters are enclosed in curly braces `{}` in the route definition:

```typespec
@route("/users/{id}")
op getUser(@path id: string): User;
```

In this example, the `id` parameter will be extracted from the URL path. The `@path` decorator indicates that this parameter comes from the path.

### Optional and Rest Parameters

TypeSpec supports more complex route templates using URI Template syntax (RFC 6570):

```typespec
// Optional path parameters
@route("/files{/filename}")
op getFile(@path filename?: string): File;

// Reserved characters in path (using + modifier)
@route("/documents{+path}")
op getDocument(@path path: string): Document;

// Optional query parameters in route definition
@route("/search{?query,limit}")
op search(query?: string, limit?: int32): SearchResults;
```

## Path Parameters

Path parameters are variables extracted from the URL path. They are marked with the `@path` decorator in TypeSpec:

```typespec
@route("/users/{userId}/posts/{postId}")
op getPost(@path userId: string, @path postId: string): Post;
```

By default, the parameter name in the route template (`{userId}`) must match the parameter name in the operation (`userId`). If you need a different name, you can specify it in the `@path` decorator:

```typespec
@route("/users/{user_id}/posts/{post_id}")
op getPost(@path("user_id") userId: string, @path("post_id") postId: string): Post;
```

You can also use the object notation for more control:

```typespec
@route("/users/{userId}/posts/{postId}")
op getPost(
  @path({
    name: "userId",
    explode: false,
  })
  userId: string,
  @path postId: string,
): Post;
```

## Query Parameters

Query parameters are used to filter, sort, or customize the response of an operation. They are marked with the `@query` decorator in TypeSpec:

```typespec
@route("/books")
op listBooks(
  @query limit?: int32,
  @query offset?: int32,
  @query genre?: string,
  @query sortBy?: "title" | "author" | "publishDate",
): Book[];
```

By default, the parameter name in the query string will match the parameter name in the operation. You can customize this using the `@query` decorator:

```typespec
@route("/books")
op listBooks(@query("max_results") limit?: int32, @query("start_index") offset?: int32): Book[];
```

For more control, you can use the object notation:

```typespec
@route("/books")
op listBooks(
  @query({
    name: "max_results",
    explode: false,
  })
  limit?: int32,
): Book[];
```

### Query Parameter Arrays and Objects

When using arrays or objects as query parameters, you can control how they are serialized using the `explode` option:

```typespec
// Array parameter
@route("/products")
op listProducts(
  @query({
    name: "colors",
    explode: true,
  })
  colors?: string[],
): Product[];
// With explode: true, results in URL like: /products?colors=red&colors=blue&colors=green
// With explode: false, results in URL like: /products?colors=red,blue,green

// Object parameter
@route("/search")
op search(
  @query({
    name: "filter",
    explode: true,
  })
  filter?: {
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
  },
): SearchResults;
// With explode: true, results in URL like: /search?minPrice=10&maxPrice=100&inStock=true
// With explode: false, results in URL like: /search?filter=minPrice,10,maxPrice,100,inStock,true
```

## Operation Return Types

In TypeSpec, an operation's return type defines the HTTP response body. For example:

```typespec
@get
@route("/users/{id}")
op getUser(@path id: string): User;
```

Here, the `User` model will be serialized as the response body when the operation succeeds.

### Status Codes

By default, operations that return a value have a 200 OK status code. You can specify different status codes using the `@statusCode` decorator or predefined response models:

```typespec
// Using @statusCode
@get
@route("/users/{id}")
@statusCode(201)
op createUser(@body user: User): User;

// Using predefined response models
@get
@route("/users/{id}")
op getUser(@path id: string): OkResponse & {
  @body user: User;
};

@post
@route("/users")
op createUser(@body user: User): CreatedResponse & {
  @body user: User;
};

@delete
@route("/users/{id}")
op deleteUser(@path id: string): NoContentResponse;
```

The HTTP library provides several predefined response models for common status codes:

- `OkResponse` (200)
- `CreatedResponse` (201)
- `AcceptedResponse` (202)
- `NoContentResponse` (204)
- `BadRequestResponse` (400)
- `UnauthorizedResponse` (401)
- `ForbiddenResponse` (403)
- `NotFoundResponse` (404)
- `ConflictResponse` (409)

### Multiple Response Types

For operations that can return different responses based on the scenario, you can use union types:

```typespec
@get
@route("/users/{id}")
op getUser(@path id: string): {
  @statusCode(200)
  @body
  user: User;
} | {
  @statusCode(404)
  @body
  error: Error;
};
```

## Best Practices for HTTP Operations

When defining HTTP operations in TypeSpec, consider these best practices:

1. **Use appropriate HTTP verbs**:

   - `GET` for retrieving data
   - `POST` for creating resources
   - `PUT` for complete updates
   - `PATCH` for partial updates
   - `DELETE` for removing resources

2. **Structure URLs around resources**, not actions:

   - Good: `GET /users/{id}`
   - Avoid: `GET /getUser?id=123`

3. **Use nouns for resource names**, preferably in plural form:

   - Good: `/users`, `/products`, `/categories`
   - Avoid: `/user`, `/getProducts`, `/manageCategories`

4. **Keep route hierarchies logical** and reflective of resource relationships:

   - `/users/{userId}/posts` for a user's posts
   - `/posts/{postId}/comments` for a post's comments

5. **Be consistent with parameter naming** across your API:

   - If you use `userId` in one place, don't use `user_id` elsewhere

6. **Make use of TypeSpec's namespace and interface features** to organize related operations:
   ```typespec
   @service
   namespace BookStore {
     @route("/books")
     interface Books {
       // Book operations...
     }

     @route("/authors")
     interface Authors {
       // Author operations...
     }
   }
   ```

By following these practices, you'll create well-structured, intuitive, and consistent HTTP APIs with TypeSpec.
