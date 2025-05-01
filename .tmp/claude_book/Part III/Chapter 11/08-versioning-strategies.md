# Versioning Strategies

## Introduction to API Versioning

API versioning is a critical aspect of REST API design that allows you to evolve your API over time without breaking existing clients. TypeSpec provides several approaches to implement versioning in your REST APIs.

In this section, we'll explore different versioning strategies and how to implement them using TypeSpec's REST library and the versioning package.

## Why Version Your API?

Versioning is essential for several reasons:

1. **Backward Compatibility**: Allows existing clients to continue functioning even as the API evolves
2. **Gradual Migration**: Enables clients to upgrade to new versions at their own pace
3. **Innovation**: Lets you introduce breaking changes without disrupting the ecosystem
4. **Deprecation Management**: Provides a clear path for retiring outdated functionality

## Versioning Strategies in REST APIs

There are several common approaches to versioning REST APIs:

### URI Path Versioning

Including the version in the URI path:

```
/v1/products
/v2/products
```

### Query Parameter Versioning

Passing the version as a query parameter:

```
/products?api-version=2023-01-01
```

### Header Versioning

Using HTTP headers to specify the version:

```
Accept: application/json; api-version=2023-01-01
```

### Content Type Versioning

Embedding the version in the content type:

```
Accept: application/vnd.company.v2+json
```

## Implementing Versioning with TypeSpec

TypeSpec provides built-in support for versioning through its versioning library.

### Importing the Versioning Library

First, import the versioning library:

```typespec
import "@typespec/versioning";
```

### Defining API Versions

Define your API versions with the `@version` decorator:

```typespec
@service({
  title: "Product Catalog API",
})
@version("2023-01-01")
namespace ProductCatalog;
```

For multiple versions, you can create a version enum:

```typespec
enum ApiVersions {
  v1: "2022-06-01",
  v2: "2023-01-01",
  v3: "2023-09-01",
}

@service({
  title: "Product Catalog API",
})
@version(ApiVersions.v3)
namespace ProductCatalog;
```

### URI Path Versioning in TypeSpec

Implement URI path versioning by including the version in route paths:

```typespec
@service({
  title: "Product Catalog API",
})
namespace ProductCatalog;

@route("/v1/products")
interface ProductsV1 {
  @get list(): Product[];
}

@route("/v2/products")
interface ProductsV2 {
  @get list(): ProductV2[];
}
```

### Query Parameter Versioning in TypeSpec

For query parameter versioning, use the versioning library's utilities:

```typespec
import "@typespec/versioning";

@service({
  title: "Product Catalog API",
})
@useVersioning(ApiVersions)
namespace ProductCatalog;

@route("/products")
interface Products {
  @get
  @added(ApiVersions.v1)
  listV1(): Product[];

  @get
  @added(ApiVersions.v2)
  listV2(): ProductV2[];
}
```

The TypeSpec versioning library will automatically generate the proper query parameter versioning.

## Versioning Models and Properties

### Adding New Properties in Later Versions

Mark properties with the version they were added:

```typespec
model Product {
  id: string;
  name: string;
  price: decimal;

  @added(ApiVersions.v2)
  description?: string;

  @added(ApiVersions.v3)
  category?: string;
}
```

### Deprecating Properties

Mark properties for deprecation with the `@deprecated` decorator:

```typespec
model Product {
  id: string;
  name: string;

  @deprecated(ApiVersions.v2, "Use 'cost' instead")
  price: decimal;

  @added(ApiVersions.v2)
  cost: decimal;
}
```

### Introducing New Models in Later Versions

Create new model versions and mark them with the `@added` decorator:

```typespec
@added(ApiVersions.v1)
model Product {
  id: string;
  name: string;
  price: decimal;
}

@added(ApiVersions.v2)
model ProductV2 {
  id: string;
  name: string;
  cost: decimal;
  description?: string;
}
```

## Versioning Operations

### Adding New Operations

Mark new operations with the `@added` decorator:

```typespec
@route("/products")
interface Products {
  @get
  list(): Product[];

  @added(ApiVersions.v2)
  @get
  search(@query term: string): Product[];
}
```

### Deprecating Operations

Mark operations for deprecation:

```typespec
@route("/products")
interface Products {
  @deprecated(ApiVersions.v3, "Use 'search' instead")
  @get
  list(): Product[];

  @added(ApiVersions.v2)
  @get
  search(@query term: string): Product[];
}
```

### Changing Operation Parameters

Add new parameters with version information:

```typespec
@route("/products")
interface Products {
  @get
  list(
    @query pageSize: int32 = 10,

    @added(ApiVersions.v2)
    @query
    sortBy?: string,
  ): Product[];
}
```

## Handling Breaking Changes

### What Constitutes a Breaking Change?

Breaking changes include:

1. Removing or renaming properties
2. Changing property types
3. Adding required properties
4. Removing operations
5. Changing response formats

### Strategies for Breaking Changes

When implementing breaking changes:

1. **Introduce New Versions**: Create new models and operations with the changes
2. **Mark Old Versions as Deprecated**: Signal to clients that they should migrate
3. **Provide Migration Documentation**: Help clients understand how to upgrade
4. **Set Sunset Dates**: Communicate when deprecated versions will be removed

## Implementing Version-Specific Endpoints

For complex version differences, use version-specific interfaces:

```typespec
@route("/products")
@deprecated(ApiVersions.v3)
interface ProductsV1 {
  @get
  list(): Product[];
}

@route("/products")
@added(ApiVersions.v2)
interface ProductsV2 {
  @get
  list(): ProductV2[];

  @get
  search(@query term: string): ProductV2[];
}
```

## Best Practices for API Versioning

1. **Version from the Start**: Even for v1, include versioning mechanisms.

2. **Use Semantic Versioning**: Follow clear versioning patterns:

   - Major version changes for breaking changes
   - Minor version changes for backward-compatible additions
   - Patch version changes for backward-compatible fixes

3. **Minimize Breaking Changes**: Design your API with extensibility in mind to reduce the need for breaking changes.

4. **Document Version Differences**: Clearly document what changed between versions:

```typespec
@doc("Product resource (V2)")
@added(ApiVersions.v2)
model ProductV2 {
  @doc("Unique identifier")
  id: string;

  @doc("Product name")
  name: string;

  @doc("Product cost (replaces 'price' from V1)")
  cost: decimal;

  @doc("Product description (new in V2)")
  description?: string;
}
```

5. **Support Multiple Versions**: Plan to support at least one prior major version.

6. **Version Headers and Responses**: Use appropriate headers in responses to indicate the API version.

7. **Version-Specific Documentation**: Generate separate documentation for each API version.

8. **Test All Versions**: Maintain test suites for each supported API version.

9. **Choose a Consistent Versioning Strategy**: Stick with one approach throughout your API.

10. **Consider Using Date-Based Versions**: For rapidly evolving APIs, date-based versions (like `2023-01-01`) provide clear chronology.

## Advanced Versioning Techniques

### Union Types for Version Differences

Use union types to model differences between versions:

```typespec
@added(ApiVersions.v1)
model ProductBase {
  id: string;
  name: string;
}

@added(ApiVersions.v1)
model ProductV1 extends ProductBase {
  price: decimal;
}

@added(ApiVersions.v2)
model ProductV2 extends ProductBase {
  cost: decimal;
  description?: string;
}

@route("/products/{id}")
interface ProductOperations {
  @get
  read(@path id: string): ProductV1 | ProductV2;
}
```

### Conditional Services

Define services that are only available in specific versions:

```typespec
@service({
  title: "Product Recommendations API",
})
@added(ApiVersions.v3)
namespace ProductRecommendations;

@route("/recommendations")
interface Recommendations {
  @get
  getForUser(@query userId: string): Product[];
}
```

### Version-Specific Client Generation

TypeSpec emitters can generate version-specific client libraries:

```
tsp compile . --emit=@typespec/openapi3 --option version=2023-01-01
```

In the next section, we'll explore error handling patterns for REST APIs.
