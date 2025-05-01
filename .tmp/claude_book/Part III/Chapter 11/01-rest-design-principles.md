# REST Design Principles

## Introduction to REST

REST (Representational State Transfer) is an architectural style for designing networked applications. Introduced by Roy Fielding in his 2000 doctoral dissertation, REST emphasizes a stateless client-server relationship where resources are identified by URLs and can be manipulated using standard HTTP methods.

## Core REST Principles

### 1. Resource-Based

In REST, everything is a resource that can be identified by a unique URL. Resources are the key abstraction in REST APIs, representing entities that clients want to interact with.

```typespec
// Example: User resource
model User {
  id: string;
  name: string;
  email: string;
}
```

### 2. Uniform Interface

REST APIs use standard HTTP methods to perform operations on resources:

- **GET**: Retrieve a resource (read-only)
- **POST**: Create a new resource
- **PUT**: Update a resource by replacing it entirely
- **PATCH**: Partially update a resource
- **DELETE**: Remove a resource

### 3. Statelessness

Each request from client to server must contain all information needed to understand and process the request. The server does not store client state between requests.

### 4. Client-Server Architecture

The client and server are separate entities that evolve independently. This separation improves portability and scalability.

### 5. Layered System

A client cannot ordinarily tell whether it is connected directly to the end server or an intermediary. Intermediary servers can improve system scalability through load balancing and shared caches.

### 6. Cacheable

Responses must define themselves as cacheable or non-cacheable to prevent clients from reusing stale data.

## RESTful API Design Best Practices

### 1. Use Nouns, Not Verbs in URLs

Resources should be named with nouns representing the entity, not verbs representing the operations:

✅ Good: `/users`, `/users/{id}`, `/users/{id}/orders`  
❌ Bad: `/getUsers`, `/createUser`, `/deleteUser/{id}`

### 2. Use HTTP Methods Appropriately

Map CRUD operations to their corresponding HTTP methods:

- Create → POST
- Read → GET
- Update → PUT/PATCH
- Delete → DELETE

### 3. Use Plural Resource Names

Using plural nouns for resource collections creates a consistent API experience:

✅ Good: `/users`, `/products`, `/categories`  
❌ Mixed: `/user`, `/products`, `/category`

### 4. Use Resource Hierarchies

Express relationships between resources through nested URLs:

```
/users/{userId}
/users/{userId}/orders
/users/{userId}/orders/{orderId}
```

### 5. Use HTTP Status Codes Correctly

Return appropriate HTTP status codes to indicate the outcome of operations:

- 2xx: Success (200 OK, 201 Created, 204 No Content)
- 3xx: Redirection
- 4xx: Client errors (400 Bad Request, 401 Unauthorized, 404 Not Found)
- 5xx: Server errors (500 Internal Server Error)

### 6. Provide Meaningful Error Messages

Include detailed error information when returning non-successful status codes.

### 7. Support Filtering, Sorting, and Pagination

For collections, provide query parameters for filtering, sorting, and pagination:

```
/products?category=electronics&sort=price&order=desc&page=2&limit=10
```

### 8. Version Your API

Include the API version in the URL or request header to ensure backward compatibility:

```
/v1/users
/v2/users
```

## TypeSpec and RESTful Design

TypeSpec provides powerful tools for designing RESTful APIs that adhere to these principles. With TypeSpec's `@typespec/rest` library, you can model resources and operations in a way that naturally aligns with REST principles.

In the following sections, we'll explore how to implement these principles using TypeSpec's REST capabilities.
