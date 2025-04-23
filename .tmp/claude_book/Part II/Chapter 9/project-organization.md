# Project Organization

As TypeSpec projects grow in size and complexity, organizing your code across multiple files becomes increasingly important. Good project organization improves maintainability, promotes code reuse, and makes it easier for developers to navigate and understand your API definitions.

## Multi-file Projects

TypeSpec supports splitting your API definition across multiple files using the `import` statement:

```typespec
// Import a local file
import "./models/user.tsp";
import "./operations/users.tsp";

// Import from a library
import "@typespec/http";
```

When you import a file, all the types defined in that file become available in the current file.

## Basic Project Structure

A typical TypeSpec project might have a structure like this:

```
my-api/
├── main.tsp             # Main entry point
├── models/              # Data models
│   ├── user.tsp
│   ├── product.tsp
│   └── order.tsp
├── operations/          # API operations
│   ├── users.tsp
│   ├── products.tsp
│   └── orders.tsp
├── common/              # Common types and utilities
│   ├── pagination.tsp
│   ├── errors.tsp
│   └── metadata.tsp
└── package.json         # Project configuration
```

## Main Entry Point

The main entry point (often `main.tsp`) typically imports all other files and may define the top-level namespace and service metadata:

```typespec
// main.tsp
import "@typespec/http";
import "./models/user.tsp";
import "./models/product.tsp";
import "./models/order.tsp";
import "./operations/users.tsp";
import "./operations/products.tsp";
import "./operations/orders.tsp";
import "./common/pagination.tsp";
import "./common/errors.tsp";

@service({
  title: "E-Commerce API",
  version: "1.0.0",
})
namespace ECommerce;
```

## Organizing by Resource

A common approach is to organize files by resource, with models and operations for each resource in separate files:

```
my-api/
├── main.tsp
├── users/
│   ├── models.tsp        # User-related models
│   └── operations.tsp    # User-related operations
├── products/
│   ├── models.tsp        # Product-related models
│   └── operations.tsp    # Product-related operations
└── common/
    └── types.tsp         # Common types
```

Example content for these files:

```typespec
// users/models.tsp
namespace MyAPI.Users {
  model User {
    id: string;
    name: string;
    email: string;
  }
}

// users/operations.tsp
import "./models.tsp";
import "@typespec/http";
using TypeSpec.Http;

namespace MyAPI.Users {
  @route("/users")
  interface Operations {
    @get
    op list(): User[];

    @get
    @route("/{id}")
    op get(@path id: string): User;

    // ...
  }
}
```

## Organizing by Layer

Another approach is to organize by layer (models, operations, interfaces):

```
my-api/
├── main.tsp
├── models/
│   ├── user.tsp
│   ├── product.tsp
│   └── order.tsp
├── interfaces/
│   ├── users.tsp
│   ├── products.tsp
│   └── orders.tsp
└── common/
    └── types.tsp
```

Example content:

```typespec
// models/user.tsp
namespace MyAPI.Models {
  model User {
    id: string;
    name: string;
    email: string;
  }
}

// interfaces/users.tsp
import "../models/user.tsp";
import "@typespec/http";
using TypeSpec.Http;
using MyAPI.Models;

namespace MyAPI.Interfaces {
  @route("/users")
  interface Users {
    @get
    op list(): User[];

    @get
    @route("/{id}")
    op get(@path id: string): User;

    // ...
  }
}
```

## Shared Libraries

For reusable components that might be used across multiple projects, you can create library packages:

```
my-libraries/
├── common-types/
│   ├── main.tsp
│   ├── pagination.tsp
│   ├── errors.tsp
│   └── package.json
└── authentication/
    ├── main.tsp
    ├── models.tsp
    ├── operations.tsp
    └── package.json
```

These libraries can then be installed and imported in other projects:

```typespec
// In your API project
import "@myorg/common-types";
import "@myorg/authentication";

using MyOrg.CommonTypes;
using MyOrg.Authentication;

namespace MyAPI {
  op listUsers(): PagedResult<User>;

  @route("/auth")
  interface Auth
    extends AuthOperations {}
      // Additional auth operations
}
```

## Feature Modules

For larger APIs, you might organize by feature modules:

```
my-api/
├── main.tsp
├── auth/
│   ├── index.tsp
│   ├── models.tsp
│   └── operations.tsp
├── users/
│   ├── index.tsp
│   ├── models.tsp
│   └── operations.tsp
├── products/
│   ├── index.tsp
│   ├── models.tsp
│   ├── categories.tsp
│   └── operations.tsp
└── common/
    └── index.tsp
```

Each module has an index file that exports all the module's types:

```typespec
// auth/index.tsp
export * from "./models.tsp";
export * from "./operations.tsp";

// main.tsp
import "./auth/index.tsp";
import "./users/index.tsp";
import "./products/index.tsp";
import "./common/index.tsp";
```

## Versioning Approaches

There are several approaches to organizing versioned APIs:

### 1. Versioned Namespaces

```
my-api/
├── main.tsp
├── v1/
│   ├── users.tsp
│   └── products.tsp
└── v2/
    ├── users.tsp
    └── products.tsp
```

With separate namespaces for each version:

```typespec
// v1/users.tsp
namespace MyAPI.v1 {
  model User {
    id: string;
    name: string;
  }
}

// v2/users.tsp
namespace MyAPI.v2 {
  model User {
    id: string;
    name: string;
    email: string; // Added in v2
  }
}
```

### 2. Versioned Directories with Shared Types

```
my-api/
├── main.tsp
├── common/
│   └── types.tsp
├── v1/
│   ├── main.tsp
│   ├── users.tsp
│   └── products.tsp
└── v2/
    ├── main.tsp
    ├── users.tsp
    └── products.tsp
```

With imports of common types:

```typespec
// common/types.tsp
namespace MyAPI.Common {
  model Error {
    code: string;
    message: string;
  }
}

// v1/main.tsp
import "../common/types.tsp";
```

## Package.json Configuration

The `package.json` file configures your TypeSpec project:

```json
{
  "name": "my-api",
  "version": "1.0.0",
  "dependencies": {
    "@typespec/compiler": "latest",
    "@typespec/http": "latest",
    "@typespec/openapi": "latest"
  },
  "private": true,
  "tspMain": "main.tsp"
}
```

Key TypeSpec-specific fields:

- `tspMain`: Specifies the main entry point for your TypeSpec project
- `dependencies`: Lists the TypeSpec libraries your project depends on

## Working with Large Projects

For very large projects, consider these additional strategies:

### 1. Breaking into Multiple Projects

Split a large API into multiple smaller, related projects:

```
my-company-apis/
├── user-management-api/
│   ├── main.tsp
│   └── ...
├── product-catalog-api/
│   ├── main.tsp
│   └── ...
└── order-processing-api/
    ├── main.tsp
    └── ...
```

### 2. Shared Type Libraries

Create shared libraries for types used across multiple APIs:

```
my-company-apis/
├── common-types/
│   ├── main.tsp
│   └── ...
├── user-management-api/
│   ├── main.tsp
│   └── ...
└── product-catalog-api/
    ├── main.tsp
    └── ...
```

### 3. Using TypeSpec Projects

The TypeSpec compiler supports a project concept with a `tspconfig.yaml` file:

```yaml
# tspconfig.yaml
entrypoint: main.tsp
emit:
  - "@typespec/openapi3"
options:
  "@typespec/openapi3":
    output-file: openapi.yaml
```

## Best Practices

### File Organization

- **One concept per file**: Keep each file focused on a single concept or resource.
- **Consistent naming**: Use consistent file naming conventions.
- **Logical grouping**: Group related files in directories that reflect their relationship.
- **Clear entry points**: Provide clear entry points for each module or component.
- **Reasonable file sizes**: Keep files to a reasonable size (typically under 500 lines).

### Import Management

- **Explicit imports**: Make imports explicit to clarify dependencies.
- **Import organization**: Group imports by source (built-in libraries, external libraries, local files).
- **Relative paths**: Use relative paths for local imports.
- **Minimal imports**: Import only what you need from each source.

### Namespace Organization

- **Consistent namespace structure**: Use a consistent namespace structure across files.
- **Namespace alignment**: Align namespaces with file structure where possible.
- **Avoid deep nesting**: Keep namespace nesting to a reasonable depth.

### Documentation

- **Module documentation**: Document the purpose of each module or directory.
- **Cross-references**: Document relationships between modules.
- **Versioning documentation**: Clearly document version differences.

By following these organization principles, you can create TypeSpec projects that are easy to navigate, understand, and maintain, even as they grow in size and complexity.
