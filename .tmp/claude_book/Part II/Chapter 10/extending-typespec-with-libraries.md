# Extending TypeSpec with Libraries

TypeSpec libraries provide a powerful mechanism for extending the language's capabilities, sharing reusable components, and implementing domain-specific abstractions. This section explores how to use existing libraries and create your own.

## What are TypeSpec Libraries?

TypeSpec libraries are packages that:

1. Provide reusable TypeSpec code (models, operations, interfaces, etc.)
2. Add new decorators that extend TypeSpec's functionality
3. Implement domain-specific semantics and validations
4. Can be shared via package managers like npm

Libraries help maintain a clean separation between the core language and domain-specific features, allowing TypeSpec to remain focused while being extensible for various use cases.

## Using Existing Libraries

### Library Installation

TypeSpec libraries are typically distributed as npm packages with names starting with `@typespec/`:

```bash
npm install @typespec/http
npm install @typespec/rest
npm install @typespec/openapi
```

### Library Import

To use a library in your TypeSpec code, import it with the `using` directive:

```typespec
// Import a specific library
using TypeSpec.Http;

// Import multiple libraries
using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.OpenAPI;
```

When you import a library, you gain access to:

- All types defined in the library
- Decorators provided by the library
- Any emitters bundled with the library

### Using Library Components

Once imported, you can use the components provided by the library:

```typespec
using TypeSpec.Http;
using TypeSpec.Rest;

// Use library-defined types
model Error {
  code: int32;
  message: string;
}

// Use library decorators
@route("/users")
@get
op listUsers(): User[];

@route("/users/{id}")
@get
op getUser(@path id: string): User | Error;
```

### Library Configuration

Some libraries allow configuration through the `tspconfig.yaml` file:

```yaml
library-name:
  option1: value1
  option2: value2
```

## Core TypeSpec Libraries

TypeSpec ships with several core libraries:

### TypeSpec.Http

Provides HTTP-specific abstractions:

```typespec
using TypeSpec.Http;

@route("/resources")
@get
op listResources(): Resource[];

@route("/resources/{id}")
@get
op getResource(@path id: string, @query filter?: string): Resource;

@route("/resources")
@post
op createResource(@body resource: Resource): Resource;
```

### TypeSpec.Rest

Builds on TypeSpec.Http to provide RESTful API abstractions:

```typespec
using TypeSpec.Rest;

@resource("users")
model User {
  @key id: string;
  name: string;
  email: string;
}

interface Users extends ResourceOperations<User> {
  // Additional custom operations
  @route("{id}/verify")
  @post
  verifyUser(@path id: string): void;
}
```

### TypeSpec.OpenAPI

Provides functionality for OpenAPI (Swagger) generation:

```typespec
using TypeSpec.OpenAPI;

@info({
  title: "My API",
  version: "1.0.0",
  description: "API description",
})
namespace MyAPI;

@operationId("ListUsers")
op listUsers(): User[];
```

### TypeSpec.Versioning

Helps manage API versioning:

```typespec
using TypeSpec.Versioning;

@versioned(Versions.v1)
@service({
  title: "My Versioned API",
})
namespace MyAPI;

enum Versions {
  v1: "2023-01-01",
  v2: "2023-06-01",
}

@added(Versions.v1)
model UserV1 {
  id: string;
  name: string;
}

@added(Versions.v2)
model UserV2 {
  id: string;
  name: string;
  email: string;
}
```

## Creating Your Own Library

### Library Structure

A typical TypeSpec library has the following structure:

```
my-library/
├── package.json
├── lib.tsp           # Main TypeSpec file
├── decorators.ts     # TypeScript code for decorators
├── emitter.ts        # Optional emitter implementation
└── README.md
```

### Library Declaration

The main TypeSpec file (`lib.tsp`) declares the library namespace:

```typespec
namespace MyLibrary;

// Library-provided models
model StandardError {
  code: int32;
  message: string;
  details?: string;
}

// Public types
model PaginatedResult<T> {
  items: T[];
  nextLink?: string;
  count: int32;
}
```

### Implementing Decorators

Decorators are implemented in TypeScript using the TypeSpec compiler API:

```typescript
// decorators.ts
import {
  createTypeSpecLibrary,
  JSONSchemaType,
  DecoratorContext,
  ModelType,
} from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "my-library",
  diagnostics: {
    invalidModel: {
      severity: "error",
      messages: {
        default: "Invalid model: {message}",
      },
    },
  },
});

/**
 * Decorator that marks a model as a resource
 */
export function $resource(context: DecoratorContext, target: ModelType, resourceName: string) {
  // Store metadata on the model
  context.program.stateMap.set(target, {
    resourceName,
    isResource: true,
  });

  // Validation logic
  if (!target.properties.some((p) => p.name === "id")) {
    context.program.reportDiagnostic({
      code: "invalid-model",
      target,
      messageId: "default",
      messageArgs: {
        message: "Resource must have an 'id' property",
      },
    });
  }
}

// Register the decorator
$lib.createDecorator({
  name: "resource",
  target: "Model",
  args: [{ name: "resourceName", type: "string" }],
  handler: $resource,
});
```

### Package Definition

Define your library in `package.json`:

```json
{
  "name": "@company/typespec-mylibrary",
  "version": "1.0.0",
  "description": "My TypeSpec Library",
  "author": "Your Name",
  "license": "MIT",
  "typespec": {
    "extends": "@typespec/compiler"
  },
  "dependencies": {
    "@typespec/compiler": "^0.40.0"
  }
}
```

### Building Library Emitters

Libraries can include emitters to translate TypeSpec code into other formats:

```typescript
// emitter.ts
import { createTypeSpecLibrary, EmitterOptions, Program } from "@typespec/compiler";

export async function $onEmit(program: Program, options: EmitterOptions) {
  // Access program information
  const models = program.getGlobalNamespaceType().models;

  // Generate output
  const output = {
    models: models.map((model) => ({
      name: model.name,
      properties: model.properties.map((prop) => ({
        name: prop.name,
        type: prop.type.kind,
      })),
    })),
  };

  // Write to output file
  program.host.writeFile(`${options.outputDir}/output.json`, JSON.stringify(output, null, 2));
}

export const $lib = createTypeSpecLibrary({
  name: "my-library-emitter",
  diagnostics: {},
  emitter: {
    name: "my-emitter",
    handler: $onEmit,
  },
});
```

## Library Patterns and Best Practices

### Namespace Organization

Organize your library with clean namespaces:

```typespec
namespace MyLibrary;

// Core models
model Result<T> {
  data?: T;
  error?: Error;
}

// Sub-namespaces for organization
namespace MyLibrary.Validation {
  model ValidationError {
    field: string;
    message: string;
  }
}

namespace MyLibrary.Http {
  enum StatusCode {
    OK: 200,
    Created: 201,
    BadRequest: 400,
    // ...
  }
}
```

### Type Versioning

Include version information in your library types:

```typespec
namespace MyLibrary.v1;

model Resource {
  id: string;
  name: string;
}

namespace MyLibrary.v2;

model Resource {
  id: string;
  name: string;
  description?: string;
  metadata: Record<string, string>;
}
```

### Extension Points

Design your library with clear extension points:

```typespec
namespace MyLibrary;

// Base interface that users can extend
@extensible
interface ResourceOperations<T> {
  list(): T[];
  get(id: string): T;
  create(item: T): T;
  update(id: string, item: T): T;
  delete(id: string): void;
}

// Base model that users can extend
@extensible
model Error {
  code: int32;
  message: string;
}
```

### Documentation

Document your library thoroughly using TypeSpec doc comments:

```typespec
namespace MyLibrary;

/**
 * Represents a paginated collection of items
 * @param T - The type of items in the collection
 * @param PageSize - The type of the page size parameter (default: int32)
 */
model PagedCollection<T, PageSize = int32> {
  /** The items in the current page */
  items: T[];

  /** The total number of items across all pages */
  totalCount: int32;

  /** The number of items per page */
  pageSize: PageSize;

  /** URL to the next page, if available */
  nextLink?: string;
}
```

### Testing Libraries

Test your library using the TypeSpec testing framework:

```typescript
// test.ts
import { TestHost, createTestHost } from "@typespec/compiler/testing";

describe("MyLibrary", () => {
  let host: TestHost;

  beforeEach(async () => {
    host = await createTestHost({
      libraries: ["../dist/index.js"],
    });
  });

  it("validates resource models correctly", async () => {
    const diagnostics = await host.diagnose(`
      using MyLibrary;
      
      @resource("users")
      model InvalidUser {
        // Missing id property
        name: string;
      }
    `);

    expect(diagnostics.length).toBe(1);
    expect(diagnostics[0].code).toBe("invalid-model");
  });
});
```

## Integrating with Existing Libraries

### Extending Core Libraries

Build on existing libraries to add functionality:

```typespec
using TypeSpec.Http;
using TypeSpec.Rest;

namespace MyExtension;

// Add custom decorators that enhance existing libraries
extern dec authenticated(target: Operation);

@authenticated
@route("/secure-resource")
@get
op getSecureResource(): string;
```

### Library Composition

Compose multiple libraries to build comprehensive solutions:

```typespec
// Import multiple libraries
using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.OpenAPI;
using MyCompany.ValidationLibrary;
using MyCompany.AuthLibrary;

// Use components from different libraries together
@authenticated
@validated
@route("/resources")
@get
op listResources(): Resource[] | Error;
```

### Dependency Management

Manage library dependencies properly:

```json
{
  "name": "@company/typespec-mylibrary",
  "version": "1.0.0",
  "peerDependencies": {
    "@typespec/compiler": "^0.40.0",
    "@typespec/http": "^0.40.0"
  },
  "dependencies": {
    "@typespec/rest": "^0.40.0"
  }
}
```

## Real-World Library Examples

### Authentication Library

```typespec
namespace Auth;

// Authentication types
model Credentials {
  username: string;
  password: string;
}

model Token {
  accessToken: string;
  refreshToken: string;
  expiresIn: int32;
}

// Authentication decorators
extern dec authenticated(target: Operation);

extern dec permissions(target: Operation, permissions: string[]);

// Auth operations
interface Authentication {
  @route("/auth/login")
  @post
  login(@body credentials: Credentials): Token;

  @route("/auth/refresh")
  @post
  refreshToken(
    @body token: {
      refreshToken: string;
    },
  ): Token;

  @route("/auth/logout")
  @post
  @authenticated
  logout(): void;
}
```

### Validation Library

```typespec
namespace Validation;

// Validation decorators
extern dec pattern(target: ModelProperty, pattern: string);

extern dec length(target: ModelProperty, min: int32, max: int32);

extern dec range(target: ModelProperty, min: numeric, max: numeric);

extern dec required(target: ModelProperty);

extern dec readonly(target: ModelProperty);

// Usage example
model User {
  @pattern("^[a-zA-Z0-9]+$")
  @length(3, 50)
  @required
  username: string;

  @pattern("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")
  @required
  email: string;

  @range(0, 120)
  age?: int32;

  @readonly
  createdAt: string;
}
```

### Testing Library

```typespec
namespace Testing;

// Test case definition
model TestCase<Input, Expected> {
  name: string;
  input: Input;
  expected: Expected;
}

// Test suite definition
model TestSuite<T> {
  name: string;
  cases: TestCase<unknown, unknown>[];
}

// Test results
model TestResult {
  name: string;
  passed: boolean;
  message?: string;
  duration: int32;
}

// Test reporting
model TestReport {
  totalTests: int32;
  passed: int32;
  failed: int32;
  skipped: int32;
  results: TestResult[];
}
```

## Publishing Your Library

### Package Configuration

Configure your package for publishing:

```json
{
  "name": "@company/typespec-mylibrary",
  "version": "1.0.0",
  "description": "My TypeSpec Library",
  "main": "dist/index.js",
  "tspMain": "lib/lib.tsp",
  "scripts": {
    "build": "tsc && tsp compile lib/lib.tsp",
    "test": "jest"
  },
  "files": ["dist", "lib"],
  "keywords": ["typespec", "library"]
}
```

### Distribution

Publish your library to npm:

```bash
npm publish --access public
```

### Versioning Strategy

Follow semantic versioning for your library:

- **Major version**: Breaking changes
- **Minor version**: New features, non-breaking changes
- **Patch version**: Bug fixes

### Documentation

Create comprehensive documentation for your library:

- README with installation and usage instructions
- API reference for all types and decorators
- Examples showing common use cases
- Changelog tracking version changes

## Conclusion

TypeSpec's library ecosystem is a powerful extension mechanism that allows you to:

- Share reusable TypeSpec code across projects
- Extend the language with new decorators and semantics
- Create domain-specific abstractions
- Implement custom emitters for various target platforms

By creating and sharing libraries, you contribute to the TypeSpec ecosystem and help establish best practices and patterns for API development across your organization and the broader community.

Whether you're using existing libraries or building your own, this modular approach helps manage complexity and promotes reuse, making TypeSpec a versatile tool for API design across diverse domains and requirements.
