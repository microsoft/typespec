---
title: Pagination
---

# Pagination

TypeSpec provide built-in support for some of the common pagination pattern used.

Pagination can be categorized into two types:

- Client driven pagination: In this pattern, the client is responsible for managing the pagination state(figuring out the next page, previous page, etc).
- Server driven pagination: In this pattern the server gives the client information on how to navigate to the next, previous, first, last page, etc.

## Basics

To enable pagination for an operation the first step is to decorate it with the `@list` decorator and have the return type contain a property decorated with `@pageItems`

```tsp
@list op listPets(): {
  @pageItems pets: Pet[];
};
```

## Client driven pagination

For client driven pagination there are 3 decorators that can be used to annotate the operation parameters.

- `@pageSize`: Number of items to return per page.
- `@offset`: Number of items to skip
- `@pageIndex`: Page index.

`@offset` and `@pageIndex` are not necessary mutually exclusive but they are used to achieve the same goal.

### Example 1: Fixed page size and offset

```tsp
@list op listPets(@offset skip?: int32 = 0): {
  @pageItems pets: Pet[];
};
```

### Example 2: Custom page size and offset

```tsp
@list op listPets(@offset skip?: int32, @pageSize perPage?: int32 = 100): {
  @pageItems pets: Pet[];
};
```

### Example 2: Custom page size and page index

```tsp
@list op listPets(@pageIndex page?: int32 = 1, @pageSize perPage?: int32 = 100): {
  @pageItems pets: Pet[];
};
```

## Server driven pagination

For server driven pagination, the server returns information on how to navigate to other pages. There is 5 decorators that can be used to annotate the corersonding properties:

- `@nextLink`: Link to the next page.
- `@prevLink`: Link to the previous page.
- `@firstLink`: Link to the first page.
- `@lastLink`: Link to the last page.
- `@continuationToken`: Should be specified in both the parameters and return type of the operation. In the return type it is the token to navigate to the next page and in the parameters it mark which parameter to use to pass the next continuation token.

:::note
It is possible to use server driven pagination on top of client driven pagination.
:::

### Example 1: Using continuation token

```tsp
@list op listPets(@continuationToken token?: string): {
  @pageItems pets: Pet[];
  @continuationToken nextToken?: string;
};
```

### Example 2: Using links for an HTTP service

```tsp
@list op listPets(): {
  @pageItems pets: Pet[];
  links: {
    @nextLink next?: url;
    @prevLink prev?: url;
    @firstLink first?: url;
    @lastLink last?: url;
  };
};
```

### Example 3: Combining client and server driven pagination for an HTTP service

```tsp
@list op listPets(@query @pageIndex page?: int32 = 1, @query @pageSize perPage?: int32 = 100): {
  @pageItems pets: Pet[];

  // Links would return the url resolve with page and perPage set
  links: {
    @nextLink next?: url;
    @prevLink prev?: url;
    @firstLink first?: url;
    @lastLink last?: url;
  };
};
```
