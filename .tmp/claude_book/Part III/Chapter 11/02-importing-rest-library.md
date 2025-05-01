# Importing the REST Library

## Introduction to TypeSpec's REST Library

The `@typespec/rest` library is a powerful extension to TypeSpec that provides specialized decorators, models, and interfaces for building REST APIs. This library helps you implement RESTful principles in a structured and consistent way.

## Getting Started with the REST Library

### Installation

If you're starting a new TypeSpec project, the REST library is typically included when you initialize a REST API project:

```bash
tsp init
# Choose "Generic REST API" when prompted
```

For existing projects, you can add the REST library as a dependency:

```bash
npm install @typespec/rest
```

### Basic Import and Usage

To use the REST library in your TypeSpec files, you need to import it and bring its namespace into scope:

```typespec
import "@typespec/http"; // REST library depends on HTTP
import "@typespec/rest";

using TypeSpec.Http;
using TypeSpec.Rest;
```

The `using` statements bring the library's namespaces into scope, allowing you to use its decorators and types without fully qualifying them.

## Relationship Between HTTP and REST Libraries

The REST library builds on top of the HTTP library:

- The **HTTP library** (`@typespec/http`) provides the basic HTTP protocol bindings, including HTTP methods, status codes, headers, and route definitions.
- The **REST library** (`@typespec/rest`) adds resource-oriented patterns, resource modeling, and specialized operations for RESTful APIs.

Both libraries are usually used together when building REST APIs.

## What the REST Library Provides

The REST library includes:

### 1. Resource Modeling

Define resources with the `@resource` decorator:

```typespec
@resource("users")
model User {
  @key
  id: string;

  name: string;
  email: string;
}
```

### 2. Resource Operations

Pre-defined operations templates for common REST patterns:

```typespec
interface UserOperations extends ResourceOperations<User, Error> {}
```

### 3. CRUD Operation Decorators

Specialized decorators for defining CRUD operations on resources:

```typespec
@readsResource(User)
op getUser(@path id: string): User;

@createsResource(User)
op createUser(@body user: User): User;

@updatesResource(User)
op updateUser(@path id: string, @body user: User): User;

@deletesResource(User)
op deleteUser(@path id: string): void;

@listsResource(User)
op listUsers(): User[];
```

### 4. Resource Relationships

Define parent-child relationships between resources:

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
```

### 5. Automatic Routing

Generate consistent resource-based routes with `@autoRoute`:

```typespec
@autoRoute
interface Orders {
  @get list(@segment("orders") @path userId: string): Order[];
  @get get(@segment("orders") @path userId: string, @path orderId: string): Order;
}
```

## TypeSpec.Rest Namespace Structure

The REST library is organized into multiple namespaces:

1. `TypeSpec.Rest` - Main namespace with core decorators
2. `TypeSpec.Rest.Resource` - Resource-related interfaces and models

The `Resource` sub-namespace contains predefined operation templates and response models that can be reused across your API.

## Example: Basic REST Library Usage

Here's a simple example that shows how to use the REST library to define a resource and its operations:

```typespec
import "@typespec/http";
import "@typespec/rest";

using TypeSpec.Http;
using TypeSpec.Rest;

@service({
  title: "Bookstore API",
})
namespace Bookstore;

@resource("books")
model Book {
  @key
  id: string;

  title: string;
  author: string;
  publishDate: utcDateTime;
  price: decimal;
}

@autoRoute
interface Books {
  @get list(): Book[];
  @get get(@path id: string): Book;
  @post create(@body book: Book): Book;
  @put update(@path id: string, @body book: Book): Book;
  @delete delete(@path id: string): void;
}
```

In the next sections, we'll explore how to leverage these features to model resources, implement CRUD operations, and build complete REST APIs.
