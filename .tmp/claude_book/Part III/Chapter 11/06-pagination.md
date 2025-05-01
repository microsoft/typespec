# Pagination

## Introduction to Pagination

Pagination is a critical feature for APIs that return collections of resources. It improves performance and usability by splitting large result sets into manageable chunks. TypeSpec's REST library provides built-in support for implementing consistent pagination patterns.

## Why Pagination Matters

Pagination is important for several reasons:

1. **Performance**: Returning all resources at once can strain both server and client
2. **Usability**: Smaller result sets are easier for users to process
3. **Bandwidth**: Reduces data transfer between server and client
4. **Server Load**: Prevents heavy database queries from timing out

## Pagination Patterns

TypeSpec supports several common pagination patterns:

### Offset Pagination

The most traditional approach using page number and page size:

```typespec
@route("/products")
interface Products {
  @get
  list(@query page: int32 = 1, @query pageSize: int32 = 10): ProductCollection;
}

model ProductCollection {
  items: Product[];
  totalCount: int32;
  page: int32;
  pageSize: int32;
}
```

### Cursor Pagination

Uses opaque tokens to mark positions in the result set:

```typespec
@route("/products")
interface Products {
  @get
  list(@query after?: string, @query limit: int32 = 10): ProductCursorCollection;
}

model ProductCursorCollection {
  items: Product[];
  nextCursor?: string;
  hasMore: boolean;
}
```

### Next Link Pagination

Returns a URL to the next page:

```typespec
@route("/products")
interface Products {
  @get
  list(@query limit: int32 = 10): CollectionWithNextLink<Product>;
}
```

The `CollectionWithNextLink` model includes a URL to fetch the next page:

```typespec
model CollectionWithNextLink<T> {
  value: T[];
  nextLink?: url;
}
```

## Implementing Pagination with TypeSpec

### Offset Pagination Implementation

The most traditional approach is offset-based pagination:

```typespec
@resource("products")
model Product {
  @key
  id: string;

  name: string;
  price: decimal;
}

model ProductPage {
  items: Product[];
  totalCount: int32;
  page: int32;
  pageSize: int32;
  totalPages: int32;
}

@route("/products")
interface Products {
  @listsResource(Product)
  @get
  list(@query page: int32 = 1, @query pageSize: int32 = 10): ProductPage;
}
```

This pattern includes:

- `page`: The current page number (usually 1-based)
- `pageSize`: The number of items per page
- `totalCount`: Total number of available items
- `totalPages`: Total number of pages

### Cursor Pagination Implementation

Cursor-based pagination uses tokens instead of page numbers:

```typespec
@resource("products")
model Product {
  @key
  id: string;

  name: string;
  price: decimal;
}

model ProductCursorPage {
  items: Product[];
  nextCursor?: string;
  prevCursor?: string;
  hasMore: boolean;
}

@route("/products")
interface Products {
  @listsResource(Product)
  @get
  list(
    @query cursor?: string,
    @query direction?: "forward" | "backward" = "forward",
    @query limit: int32 = 10,
  ): ProductCursorPage;
}
```

This pattern includes:

- `cursor`: An opaque token pointing to a position in the result set
- `direction`: Whether to page forward or backward
- `limit`: Maximum number of items to return
- `nextCursor`: Token for the next page
- `prevCursor`: Token for the previous page

### Next Link Implementation

The REST library includes a built-in model for next link pagination:

```typespec
@resource("products")
model Product {
  @key
  id: string;

  name: string;
  price: decimal;
}

@route("/products")
interface Products {
  @listsResource(Product)
  @get
  list(@query skip?: int32, @query top: int32 = 10): CollectionWithNextLink<Product>;
}
```

This pattern includes:

- `skip`: Number of items to skip
- `top`: Maximum number of items to return
- `nextLink`: URL to fetch the next page

## Pagination for Nested Resources

Pagination works similarly for nested resource collections:

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
}

@route("/users/{userId}/orders")
interface UserOrders {
  @listsResource(Order)
  @get
  list(
    @path userId: string,
    @query page: int32 = 1,
    @query pageSize: int32 = 10,
  ): CollectionWithNextLink<Order>;
}
```

## Pagination Headers

Some APIs use HTTP headers for pagination information:

```typespec
@route("/products")
interface Products {
  @listsResource(Product)
  @get
  @header("X-Total-Count", int32)
  @header("X-Page", int32)
  @header("X-Page-Size", int32)
  @header("X-Total-Pages", int32)
  list(@query page: int32 = 1, @query pageSize: int32 = 10): Product[];
}
```

## Pagination with Filtering and Sorting

Pagination often works alongside filtering and sorting:

```typespec
@route("/products")
interface Products {
  @listsResource(Product)
  @get
  list(
    // Filtering
    @query category?: string,

    @query minPrice?: decimal,
    @query maxPrice?: decimal,

    // Sorting
    @query sortBy?: "name" | "price" | "createdAt",

    @query sortOrder?: "asc" | "desc",

    // Pagination
    @query page: int32 = 1,

    @query pageSize: int32 = 10,
  ): ProductPage;
}
```

## Handling Edge Cases

Consider these edge cases when implementing pagination:

### Invalid Page Numbers

Define how to handle requests for non-existent pages:

```typespec
@doc("Returns the first page if page < 1, and the last page if page > totalPages")
@get
list(@query page: int32 = 1, @query pageSize: int32 = 10): ProductPage;
```

### Empty Results

Return an empty array, not an error, when a page has no results:

```typespec
// Result for empty collection
{
  "items": [],
  "totalCount": 0,
  "page": 1,
  "pageSize": 10,
  "totalPages": 0
}
```

### Page Size Limits

Set minimum and maximum values for page size:

```typespec
@get
list(
  @query page: int32 = 1,
  @query pageSize: int32 = 10,
  @minValue(1)
  @maxValue(100)
): ProductPage;
```

## Best Practices for Pagination

1. **Always Include Pagination**: Design all collection endpoints with pagination from the start.

2. **Provide Default Values**: Set sensible defaults for pagination parameters.

3. **Include Metadata**: Return total counts and pagination info to help clients.

4. **Support Navigation Controls**: Provide ways to navigate to the next, previous, first, and last pages.

5. **Document Pagination Parameters**: Use the `@doc` decorator to explain pagination parameters:

```typespec
@route("/products")
interface Products {
  @get
  list(
    @doc("Page number (1-based)")
    @query page: int32 = 1,

    @doc("Number of items per page (1-100)")
    @query pageSize: int32 = 10,
    @minValue(1)
    @maxValue(100)
  ): ProductPage;
}
```

6. **Be Consistent**: Use the same pagination pattern across your API.

7. **Consider Caching**: Include proper cache headers for paginated responses.

8. **Test Edge Cases**: Verify behavior with empty results, first page, last page, etc.

In the next section, we'll explore filtering and sorting patterns for collection endpoints.
