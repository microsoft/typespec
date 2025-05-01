# Resource Modeling

## Understanding Resources in REST APIs

Resources are the fundamental building blocks of REST APIs. A resource is any kind of object, data, or service that can be accessed by the client. In REST architecture, resources are identified by URIs and manipulated through standard HTTP methods.

In TypeSpec, the REST library provides specialized tools for modeling resources and their relationships, making it easier to build well-structured, consistent REST APIs.

## Defining Resources with `@resource`

The primary way to define a resource in TypeSpec is using the `@resource` decorator. This decorator marks a model as a resource and specifies its collection name.

```typespec
@resource("products")
model Product {
  @key
  id: string;

  name: string;
  description: string;
  price: decimal;
}
```

In this example:

- `@resource("products")` marks the `Product` model as a resource
- The string argument "products" defines the collection name, which influences the URL path

## Resource Keys with `@key`

Resources typically have one or more properties that uniquely identify them. These properties are marked with the `@key` decorator:

```typespec
@resource("users")
model User {
  @key
  id: string;

  name: string;
  email: string;
}
```

Keys are important because:

1. They uniquely identify a resource instance
2. They appear in URL paths for accessing individual resources
3. They establish relationships between resources

You can define multiple keys for composite key scenarios:

```typespec
@resource("subscriptions")
model Subscription {
  @key
  userId: string;

  @key
  planId: string;

  startDate: utcDateTime;
  endDate: utcDateTime;
}
```

## Resource Hierarchies and Relationships

REST APIs often model hierarchical relationships between resources. The `@parentResource` decorator establishes a parent-child relationship:

```typespec
@resource("users")
model User {
  @key
  id: string;

  name: string;
}

@parentResource(User)
@resource("posts")
model Post {
  @key
  id: string;

  title: string;
  content: string;
  publishedDate: utcDateTime;
}
```

This defines that `Post` is a child resource of `User`, leading to nested routes like `/users/{userId}/posts`.

### Nested Resources

You can create deeper resource hierarchies by chaining parent-child relationships:

```typespec
@resource("users")
model User {
  @key
  id: string;

  name: string;
}

@parentResource(User)
@resource("posts")
model Post {
  @key
  id: string;

  title: string;
  content: string;
}

@parentResource(Post)
@resource("comments")
model Comment {
  @key
  id: string;

  text: string;
  authorName: string;
}
```

This would result in a URL structure like `/users/{userId}/posts/{postId}/comments/{commentId}`.

## Resource Templates

TypeSpec's template system allows you to create reusable resource patterns. For instance, you might define a template for resources that need tracking information:

```typespec
model TrackableResource<T> {
  ...T;
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
  createdBy: string;
  updatedBy: string;
}

@resource("departments")
model Department
  is TrackableResource<{
    @key
    id: string;

    name: string;
    description: string;
  }>;
```

## Path Segment Configuration

The `@segment` decorator allows you to specify how a resource property appears in the URL path:

```typespec
@resource("books")
model Book {
  @key
  @segment("book-id")
  id: string;

  title: string;
  author: string;
}
```

This would result in paths like `/books/book-id/{id}` instead of `/books/{id}`.

## Resource Extension Pattern

Sometimes you need to attach additional functionality to existing resources without modifying them. TypeSpec's REST library supports resource extensions:

```typespec
@resource("users")
model User {
  @key
  id: string;

  name: string;
}

@resource("profiles")
model Profile {
  @key
  id: string;

  bio: string;
  avatarUrl: string;
}

interface UserProfiles extends ExtensionResourceOperations<Profile, User, Error> {}
```

This creates a relationship where profiles are extensions to users, resulting in URLs like `/users/{userId}/profiles`.

## Advanced Resource Modeling

### Resource with Complex Keys

For resources with complex or composite keys, you can use multiple `@key` decorators:

```typespec
@resource("enrollments")
model Enrollment {
  @key
  studentId: string;

  @key
  courseId: string;

  enrollmentDate: utcDateTime;
  grade: string;
}
```

### Singleton Resources

Some resources exist as singletons within a parent resource. For example, a user might have a single profile:

```typespec
@resource("users")
model User {
  @key
  id: string;

  name: string;
}

@parentResource(User)
model Profile {
  bio: string;
  avatarUrl: string;
  socialLinks: string[];
}

interface UserProfile extends SingletonResourceOperations<Profile, Error> {}
```

This would result in endpoints like `/users/{userId}/profile` without an ID in the profile path.

## Best Practices for Resource Modeling

1. **Use Nouns for Resource Names**: Resources should be named with nouns (e.g., "users", "products") rather than verbs.

2. **Be Consistent with Pluralization**: Choose either plural or singular for collection names and be consistent throughout your API.

3. **Keep Resource Models Focused**: A resource model should represent a single concept with a clear boundary.

4. **Use Inheritance for Common Properties**: Leverage TypeSpec's inheritance capabilities to share common properties across resources.

5. **Think About Resource Granularity**: Consider how resources will be accessed and modified when deciding on resource boundaries.

6. **Document Resources**: Use the `@doc` decorator to provide clear descriptions of resources and their properties.

```typespec
@doc("A user of the system")
@resource("users")
model User {
  @doc("Unique identifier for the user")
  @key
  id: string;

  @doc("User's full name")
  name: string;

  @doc("User's email address")
  email: string;
}
```

In the next section, we'll explore how to implement CRUD operations for these resources.
