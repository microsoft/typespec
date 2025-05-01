# Collection Endpoints

## Introduction to Collection Endpoints

Collection endpoints in REST APIs handle multiple instances of a resource type. These endpoints allow clients to list, filter, and manipulate collections of resources. TypeSpec's REST library provides specialized features for implementing collection endpoints in a consistent and efficient manner.

## Basic Collection Operations

The most common collection operations are:

1. **List** - Retrieve all resources in a collection
2. **Create** - Add a new resource to a collection
3. **Batch operations** - Perform operations on multiple resources simultaneously

## Listing Resources

The `@listsResource` decorator marks an operation that retrieves a collection of resources:

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
  list(): Product[];
}
```

### Using ResourceCollectionOperations

For a more standardized approach, you can use the `ResourceCollectionOperations` interface:

```typespec
@resource("products")
model Product {
  @key
  id: string;

  name: string;
  price: decimal;
}

@route("/products")
interface Products extends ResourceCollectionOperations<Product, Error> {}
```

This interface automatically includes standard collection operations.

## Collection Response Models

TypeSpec's REST library provides specialized models for collection responses:

### Basic Collections

The simplest collection response is an array of resources:

```typespec
@get
list(): Product[];
```

### Paginated Collections

For paginated collections, use the `CollectionWithNextLink` model:

```typespec
@get
list(@query page: int32 = 1, @query pageSize: int32 = 10): CollectionWithNextLink<Product>;
```

The `CollectionWithNextLink` model has this structure:

```typespec
model CollectionWithNextLink<T> {
  value: T[];
  nextLink?: url;
}
```

### Wrapped Collections

Some APIs wrap collections with metadata:

```typespec
model ProductCollection {
  items: Product[];
  totalCount: int32;
  page: int32;
  pageSize: int32;
}

@get
list(@query page: int32 = 1, @query pageSize: int32 = 10): ProductCollection;
```

## Collection Parameters

Collection endpoints often support parameters for filtering, sorting, and pagination.

### Filtering Parameters

Filtering parameters narrow down the results:

```typespec
@route("/products")
interface Products {
  @get
  list(@query category?: string, @query minPrice?: decimal, @query maxPrice?: decimal): Product[];
}
```

### Pagination Parameters

Pagination parameters control how many results are returned:

```typespec
@route("/products")
interface Products {
  @get
  list(@query page: int32 = 1, @query pageSize: int32 = 10): CollectionWithNextLink<Product>;
}
```

The `pageSize` parameter limits the number of items per page, while the `page` parameter selects which page to return.

### Sorting Parameters

Sorting parameters determine the order of results:

```typespec
@route("/products")
interface Products {
  @get
  list(
    @query sortBy?: "name" | "price" | "createdAt",
    @query sortOrder?: "asc" | "desc",
  ): Product[];
}
```

## Nested Collection Endpoints

For child resources, collection endpoints are nested under their parent:

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

@route("/users/{userId}/orders")
interface UserOrders extends ResourceCollectionOperations<Order, Error> {}
```

This creates nested collection endpoints like `/users/{userId}/orders`.

## Creating Resources in Collections

The `@createsResource` decorator marks an operation that adds a resource to a collection:

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
  @createsResource(Product)
  @post
  create(@body product: ResourceCreateModel<Product>): ResourceCreatedResponse<Product>;
}
```

The `ResourceCreateModel` template automatically filters properties based on visibility.

## Batch Operations

Batch operations perform actions on multiple resources in a single request.

### Batch Creation

Creating multiple resources at once:

```typespec
@resource("products")
model Product {
  @key
  id: string;

  name: string;
  price: decimal;
}

model BatchCreateRequest {
  items: ResourceCreateModel<Product>[];
}

model BatchCreateResponse {
  items: Product[];
  errors?: ErrorDetail[];
}

@route("/products")
interface Products {
  @post
  batchCreate(@body request: BatchCreateRequest): BatchCreateResponse;
}
```

### Batch Update

Updating multiple resources at once:

```typespec
model ProductUpdate {
  @key
  id: string;

  price?: decimal;
  name?: string;
}

model BatchUpdateRequest {
  items: ProductUpdate[];
}

model BatchUpdateResponse {
  items: Product[];
  errors?: ErrorDetail[];
}

@route("/products/batch")
interface ProductBatch {
  @patch
  batchUpdate(@body request: BatchUpdateRequest): BatchUpdateResponse;
}
```

### Batch Delete

Deleting multiple resources at once:

```typespec
model BatchDeleteRequest {
  ids: string[];
}

model BatchDeleteResponse {
  deletedIds: string[];
  errors?: ErrorDetail[];
}

@route("/products/batch")
interface ProductBatch {
  @post
  batchDelete(@body request: BatchDeleteRequest): BatchDeleteResponse;
}
```

## Collection Actions

Collection actions are operations that don't map directly to CRUD. TypeSpec supports these with the `@collectionAction` decorator:

```typespec
@resource("products")
model Product {
  @key
  id: string;

  name: string;
  price: decimal;
}

model PriceUpdateRequest {
  category: string;
  percentChange: decimal;
}

model PriceUpdateResponse {
  updatedCount: int32;
}

@route("/products")
interface Products {
  @collectionAction(Product, "bulk-price-update")
  @post
  bulkPriceUpdate(@body request: PriceUpdateRequest): PriceUpdateResponse;
}
```

This creates an endpoint like `/products/bulk-price-update`.

## Projections and Partial Responses

Some APIs allow clients to request only specific fields:

```typespec
@resource("users")
model User {
  @key
  id: string;

  name: string;
  email: string;
  address: Address;
  phoneNumber: string;
  preferences: UserPreferences;
}

@route("/users")
interface Users {
  @get
  list(@query fields?: string): User[];
}
```

The `fields` parameter would contain a comma-separated list of fields to include, like `fields=id,name,email`.

## Best Practices for Collection Endpoints

1. **Provide Pagination**: Always design for pagination from the start, even if your dataset is initially small.

2. **Support Filtering**: Include filtering options that match common use cases.

3. **Document Parameters**: Use the `@doc` decorator to describe what each parameter does.

```typespec
@route("/products")
interface Products {
  @get
  list(
    @doc("Filter by product category")
    @query
    category?: string,

    @doc("Minimum price filter")
    @query
    minPrice?: decimal,

    @doc("Maximum price filter")
    @query
    maxPrice?: decimal,

    @doc("Page number (1-based)")
    @query
    page: int32 = 1,

    @doc("Items per page")
    @query
    pageSize: int32 = 10,
  ): CollectionWithNextLink<Product>;
}
```

4. **Set Reasonable Defaults**: Provide default values for pagination parameters.

5. **Include Collection Metadata**: Return total counts and pagination info when possible.

6. **Use Consistent Parameter Names**: Maintain consistency in parameter naming across endpoints.

7. **Handle Empty Collections Gracefully**: Return an empty array, not an error, when no items match the criteria.

8. **Consider Rate Limiting**: Protect collection endpoints with rate limiting for large datasets.

In the next section, we'll explore pagination strategies in more detail.
