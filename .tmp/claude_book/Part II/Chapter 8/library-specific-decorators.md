# Library-Specific Decorators

While TypeSpec provides many built-in decorators, much of the language's power comes from decorators defined in specialized libraries. These library-specific decorators enable protocol binding, enhance code generation, and add format-specific metadata to your API definitions.

## HTTP Library Decorators

The `@typespec/http` library provides decorators for describing HTTP-based APIs:

### Importing the HTTP Library

```typespec
import "@typespec/http";
using TypeSpec.Http;
```

### HTTP Method Decorators

These decorators specify the HTTP method for operations:

```typespec
interface Users {
  @get
  getUser(id: string): User;

  @post
  createUser(user: User): User;

  @put
  updateUser(id: string, user: User): User;

  @patch
  partialUpdateUser(id: string, updates: UserPatch): User;

  @delete
  deleteUser(id: string): void;

  @head
  checkUserExists(id: string): void;

  @options
  getUserOptions(): void;
}
```

### HTTP Route Decorators

The `@route` decorator specifies URL paths:

```typespec
@route("/users")
interface Users {
  // GET /users
  @get
  listUsers(): User[];

  // POST /users
  @post
  createUser(@body user: User): User;

  // GET /users/{id}
  @get
  @route("/{id}")
  getUser(@path id: string): User;
}
```

### Parameter Decorators

These decorators specify how operation parameters are transmitted:

```typespec
interface Users {
  @get
  @route("/{id}")
  getUser(
    @path id: string,
    @query includeDetails?: boolean,
    @header("If-None-Match") etag?: string,
  ): User;

  @post
  createUser(@body user: User, @header contentType: string): User;

  @get
  searchUsers(
    @query q?: string,
    @query filter?: string,
    @query sort?: string,
    @header("Accept-Language") language?: string,
  ): User[];
}
```

### Response Decorators

Decorators for HTTP response details:

```typespec
interface Users {
  @get
  @route("/{id}")
  @statusCode(200)
  getUser(@path id: string): User;

  @post
  @statusCode(201)
  @header("Location")
  createUser(@body user: User): {
    @statusCode
    statusCode: 201;

    @header("Location")
    location: string;

    @body
    body: User;
  };

  @delete
  @statusCode(204)
  deleteUser(@path id: string): void;
}
```

### Error Response Decorators

For mapping models to status codes:

```typespec
@error
@statusCode(404)
model NotFoundError {
  code: "NotFound";
  message: string;
}

@error
@statusCode(400)
model ValidationError {
  code: "ValidationError";
  message: string;
  details: string[];
}

@get
op getUser(@path id: string): User | NotFoundError;

@post
op createUser(@body user: User): User | ValidationError;
```

### Content Type Decorators

For specifying request and response media types:

```typespec
@route("/documents")
interface Documents {
  @get
  @route("/{id}")
  @produces("application/pdf")
  getDocument(@path id: string): bytes;

  @post
  @consumes("application/json", "application/xml")
  @produces("application/json")
  createDocument(@body document: Document): Document;
}
```

## OpenAPI Library Decorators

The `@typespec/openapi` library provides decorators specific to OpenAPI documentation:

### Importing the OpenAPI Library

```typespec
import "@typespec/openapi";
using TypeSpec.OpenAPI;
```

### API Information Decorators

For providing metadata about your API:

```typespec
@info({
  title: "Pet Store API",
  version: "1.0.0",
  description: "A sample API for managing pets",
  termsOfService: "https://example.com/terms",
  contact: {
    name: "API Support",
    url: "https://example.com/support",
    email: "support@example.com",
  },
  license: {
    name: "Apache 2.0",
    url: "https://www.apache.org/licenses/LICENSE-2.0.html",
  },
})
namespace PetStore;
```

### Security Scheme Decorators

For defining security requirements:

```typespec
@useAuth(PetStore.SecuritySchemes.ApiKey)
namespace PetStore {
  namespace SecuritySchemes {
    @apiKey
    @header("api-key")
    model ApiKey {}

    @oauth2Auth(OAuthFlows.implicit)
    model OAuth2Implicit {}

    @oauth2Flows({
      implicit: {
        authorizationUrl: "https://example.com/oauth/authorize",
        scopes: {
          `read:pets`: "Read your pets",
          `write:pets`: "Modify pets in your account",
        },
      },
    })
    model OAuthFlows {}
  }
}
```

### Extension Decorators

For adding OpenAPI extensions:

```typespec
@extension(
  "x-logo",
  {
    url: "https://example.com/logo.png",
    altText: "Example API Logo",
  }
)
namespace PetStore;

@extension("x-rate-limit", 100)
interface Pets {
  @get
  list(): Pet[];
}
```

## REST Library Decorators

The `@typespec/rest` library provides decorators for RESTful API patterns:

### Importing the REST Library

```typespec
import "@typespec/rest";
using TypeSpec.Rest;
```

### Resource Decorators

For defining REST resources:

```typespec
@resource("user")
model User {
  @key
  id: string;

  name: string;
  email: string;
}

@resourceCollection("users")
interface Users {
  @get
  list(): User[];

  @get
  get(@path id: string): User;

  @post
  create(@body user: User): User;

  @put
  update(@path id: string, @body user: User): User;

  @delete
  delete(@path id: string): void;
}
```

### Standard Response Decorators

For using standardized response patterns:

```typespec
@pageable
op listUsers(): User[];

@creatable
op createUser(@body user: User): User;

@updatable
op updateUser(@path id: string, @body user: User): User;
```

## Protocol-Specific Library Decorators

Other protocol libraries provide their own specialized decorators:

### JSON Schema Decorators

From the `@typespec/json-schema` library:

```typespec
import "@typespec/json-schema";
using TypeSpec.JsonSchema;

@additionalProperties(false)
model User {
  id: string;
  name: string;

  @additionalProperties(true)
  settings: Record<string, string>;
}
```

### Protocol Buffers Decorators

From the `@typespec/protobuf` library:

```typespec
import "@typespec/protobuf";
using TypeSpec.Protobuf;

@protoPackage("example.users.v1")
namespace Example.Users.V1 {
  @protoMessage("User")
  model User {
    @protoFieldNumber(1)
    id: string;

    @protoFieldNumber(2)
    name: string;

    @protoFieldNumber(3)
    @protoFieldType("int32")
    age: int32;
  }
}
```

## Combining Decorators from Multiple Libraries

Library decorators can be combined to create comprehensive API definitions:

```typespec
import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi";
using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.OpenAPI;

@service({
  title: "User Management API",
  version: "1.0.0",
})
namespace UserService {
  @info({
    description: "API for managing users",
    contact: {
      name: "API Support",
      email: "support@example.com",
    },
  })
  @resource("user")
  model User {
    @key
    id: string;

    name: string;
    email: string;
  }

  @tag("Users")
  @route("/users")
  interface Users {
    @summary("List users")
    @get
    @pageable
    list(): User[];

    @summary("Get a user by ID")
    @get
    @route("/{id}")
    get(@path id: string): User | NotFoundError;

    @summary("Create a new user")
    @post
    @creatable
    create(@body user: User): User | ValidationError;
  }

  @error
  @statusCode(404)
  model NotFoundError {
    code: "NotFound";
    message: string;
  }

  @error
  @statusCode(400)
  model ValidationError {
    code: "ValidationError";
    message: string;
    details: string[];
  }
}
```

## Best Practices for Library Decorators

1. **Understand the library**: Each library has its own set of decorators with specific behaviors. Read the documentation to understand what each decorator does.

2. **Be consistent**: Use decorators from the same library consistently throughout your API definition.

3. **Import only what you need**: Only import libraries you're actively using to avoid confusion.

4. **Use namespace aliases**: When using multiple libraries, namespace aliases can make your code more readable:

   ```typespec
   import "@typespec/http" as Http;
   import "@typespec/rest" as Rest;

   @Http.route("/users")
   @Rest.resourceCollection("users")
   interface Users {
     // ...
   }
   ```

5. **Layer decorators properly**: Some decorators work at different levels of abstraction. Start with higher-level decorators (like those from `@typespec/rest`) and add lower-level ones (like those from `@typespec/http`) as needed.

6. **Document your choices**: When using decorators, document why you chose specific decorators or patterns to help others understand your API design.

7. **Consider emitter compatibility**: Be aware that not all emitters support all decorators from all libraries. Check compatibility if you're targeting specific output formats.

By effectively using library-specific decorators, you can extend TypeSpec's capabilities to create rich, protocol-specific API definitions that precisely describe how your API should behave across different implementation technologies.
