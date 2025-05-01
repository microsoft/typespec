# Filtering and Sorting

## Introduction to Filtering and Sorting

Filtering and sorting are essential capabilities for collection endpoints in REST APIs. They allow clients to narrow down results and control their order, making data retrieval more efficient and useful. TypeSpec's REST library provides patterns for implementing these features consistently.

## Filtering Basics

Filtering allows clients to retrieve a subset of resources that match specific criteria. In TypeSpec, filters are typically implemented as query parameters.

### Simple Equality Filters

The most basic filters check for equality:

```typespec
@resource("products")
model Product {
  @key
  id: string;

  name: string;
  category: string;
  price: decimal;
  inStock: boolean;
}

@route("/products")
interface Products {
  @get
  list(@query category?: string, @query inStock?: boolean): Product[];
}
```

This allows clients to filter products by category or availability.

### Range Filters

Range filters use min/max patterns for numeric values:

```typespec
@route("/products")
interface Products {
  @get
  list(@query minPrice?: decimal, @query maxPrice?: decimal): Product[];
}
```

### Date Filters

Similar to range filters, but for dates:

```typespec
@resource("orders")
model Order {
  @key
  id: string;

  customerId: string;
  orderDate: utcDateTime;
  total: decimal;
}

@route("/orders")
interface Orders {
  @get
  list(@query fromDate?: utcDateTime, @query toDate?: utcDateTime): Order[];
}
```

### Collection Filters

For filtering on multiple values of the same property:

```typespec
@route("/products")
interface Products {
  @get
  list(
    @query categories?: string[], // Comma-separated list
    @query ids?: string[],
  ): Product[];
}
```

This allows clients to filter for products in multiple categories or with specific IDs.

### Text Search Filters

For free-text search capabilities:

```typespec
@route("/products")
interface Products {
  @get
  list(
    @query search?: string, // Searches across multiple fields
  ): Product[];
}
```

## Advanced Filtering

### Filter Objects

For more complex filters, you can use structured objects:

```typespec
model ProductFilterCriteria {
  category?: string;
  minPrice?: decimal;
  maxPrice?: decimal;
  inStock?: boolean;
  search?: string;
}

@route("/products/search")
interface ProductSearch {
  @post
  search(@body filter: ProductFilterCriteria): Product[];
}
```

This approach is useful when the filtering criteria become too complex for query parameters.

### Expression-based Filtering

Some APIs support OData-like filter expressions:

```typespec
@route("/products")
interface Products {
  @get
  list(
    @query filter?: string, // e.g., "category eq 'electronics' and price lt 100.0"
  ): Product[];
}
```

While TypeSpec doesn't directly support parsing these expressions, you can document the expected format.

## Sorting Basics

Sorting controls the order of results in a collection. TypeSpec implements sorting through query parameters.

### Basic Sorting

The simplest approach uses a field name and direction:

```typespec
@route("/products")
interface Products {
  @get
  list(
    @query sortBy?: "name" | "price" | "category",
    @query sortOrder?: "asc" | "desc" = "asc",
  ): Product[];
}
```

This allows clients to sort products by name, price, or category, in ascending or descending order.

### Default Sorting

Specify default sort order with parameter defaults:

```typespec
@route("/products")
interface Products {
  @get
  list(
    @query sortBy?: "name" | "price" | "category" = "name",
    @query sortOrder?: "asc" | "desc" = "asc",
  ): Product[];
}
```

This sorts by name ascending by default.

### Multiple Sort Fields

For sorting on multiple fields:

```typespec
@route("/products")
interface Products {
  @get
  list(
    @query sort?: string, // e.g., "category:asc,price:desc"
  ): Product[];
}
```

The format is typically a comma-separated list of field:direction pairs.

## Implementing Filtering and Sorting

Let's look at a complete example combining both filtering and sorting:

```typespec
@resource("products")
model Product {
  @key
  id: string;

  name: string;
  category: string;
  price: decimal;
  inStock: boolean;
  createdAt: utcDateTime;
}

@route("/products")
interface Products {
  @listsResource(Product)
  @get
  list(
    // Filtering
    @query category?: string,

    @query minPrice?: decimal,
    @query maxPrice?: decimal,
    @query inStock?: boolean,
    @query search?: string,
    @query createdAfter?: utcDateTime,

    // Sorting
    @query sortBy?: "name" | "price" | "category" | "createdAt" = "name",

    @query sortOrder?: "asc" | "desc" = "asc",

    // Pagination
    @query page: int32 = 1,

    @query pageSize: int32 = 10,
  ): CollectionWithNextLink<Product>;
}
```

## Filtering in Nested Resources

For child resources, filtering works the same way:

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

  orderDate: utcDateTime;
  status: "pending" | "processing" | "shipped" | "delivered";
  total: decimal;
}

@route("/users/{userId}/orders")
interface UserOrders {
  @listsResource(Order)
  @get
  list(
    @path userId: string,

    // Filtering
    @query status?: "pending" | "processing" | "shipped" | "delivered",

    @query minTotal?: decimal,
    @query fromDate?: utcDateTime,
    @query toDate?: utcDateTime,

    // Sorting
    @query sortBy?: "orderDate" | "total" = "orderDate",

    @query sortOrder?: "asc" | "desc" = "desc",
  ): CollectionWithNextLink<Order>;
}
```

## Documenting Filters and Sorting

Use the `@doc` decorator to explain the purpose of each parameter:

```typespec
@route("/products")
interface Products {
  @get
  list(
    @doc("Filter by product category")
    @query
    category?: string,

    @doc("Minimum price filter (inclusive)")
    @query
    minPrice?: decimal,

    @doc("Maximum price filter (inclusive)")
    @query
    maxPrice?: decimal,

    @doc("Search across product name and description")
    @query
    search?: string,

    @doc("Field to sort by")
    @query
    sortBy?: "name" | "price" | "category" = "name",

    @doc("Sort direction (asc = ascending, desc = descending)")
    @query
    sortOrder?: "asc" | "desc" = "asc",
  ): CollectionWithNextLink<Product>;
}
```

## Filter Validation

Add validation to filter parameters:

```typespec
@route("/products")
interface Products {
  @get
  list(
    @query category?: string,

    @minValue(0)
    @query
    minPrice?: decimal,

    @minValue(0)
    @query
    maxPrice?: decimal,

    @minLength(3)
    @maxLength(50)
    @query
    search?: string,
  ): CollectionWithNextLink<Product>;
}
```

## Best Practices for Filtering and Sorting

1. **Keep Filters Simple**: Start with basic filters and add complexity only as needed.

2. **Validate Filter Values**: Use TypeSpec validators to ensure filter values are valid.

3. **Provide Default Sort Order**: Always specify a default sort for predictable results.

4. **Document Filter Behavior**: Explain how each filter impacts results, especially for text search.

5. **Use Consistent Naming**: Follow a consistent pattern for filter and sort parameters.

6. **Consider Combining Parameters**: For complex filtering, consider using a POST endpoint with a filter object.

7. **Test Edge Cases**: Verify behavior with empty results, invalid filters, etc.

8. **Support Null/Empty Values**: Define how filters handle null or empty values.

```typespec
@doc("Filter by category. Use 'null' to find products without a category.")
@query category?: string;
```

9. **Support Partial Matching**: For text filters, document whether they support exact or partial matching.

```typespec
@doc("Search product names. Supports partial matches.")
@query name?: string;
```

10. **Respect Pagination**: Ensure filtering and sorting work correctly with pagination.

```typespec
// Filter first, sort second, paginate last
@get
list(
  // Filter
  @query category?: string,

  // Sort
  @query sortBy?: string = "name",

  // Paginate
  @query page: int32 = 1,
  @query pageSize: int32 = 10
): CollectionWithNextLink<Product>;
```

In the next section, we'll explore versioning strategies for REST APIs.
