# 2. Imports and Libraries

Modular code organization is a cornerstone of TypeSpec development. This section explores how to import TypeSpec files and libraries, allowing you to create reusable components and leverage the rich ecosystem of TypeSpec libraries.

## Understanding Imports in TypeSpec

The import system in TypeSpec enables you to:

1. **Split code across multiple files** - For better organization and maintenance
2. **Reuse type definitions** - To promote consistency and reduce duplication
3. **Use standard libraries** - To leverage pre-built functionality
4. **Create modular APIs** - By composing smaller, focused components

## Basic Import Syntax

TypeSpec provides two primary mechanisms for including code from other files:

### File Imports

To import definitions from another TypeSpec file, use the `import` statement with a relative path:

```typespec
import "./models/user.tsp";
```

This imports all exported declarations from the file at the specified path relative to the current file. File paths should use forward slashes (`/`) regardless of the operating system.

### Library Imports

TypeSpec libraries are installed as npm packages. To import a TypeSpec library, use its package name:

```typespec
import "@typespec/http";
```

This imports the `@typespec/http` library, which provides HTTP-specific decorators and types for building RESTful APIs.

## Import Resolution

When TypeSpec encounters an import statement, it resolves the import using the following process:

### File Resolution

For file imports like `import "./models/user.tsp"`:

1. The path is interpreted relative to the current file
2. The file extension `.tsp` is required
3. The file must exist at the specified location
4. Circular imports are allowed but might lead to complex dependency trees

### Library Resolution

For library imports like `import "@typespec/http"`:

1. The library is resolved using Node.js module resolution
2. The compiler looks for the library in:
   - The project's `node_modules` directory
   - Global `node_modules` directories
3. The library must follow the TypeSpec library structure (usually with a `lib/main.tsp` entry point)

## Using Imported Declarations

After importing a file or library, you can use its declarations in your code. There are two approaches:

### Fully Qualified Names

You can always use the fully qualified name of an imported declaration, which includes its namespace:

```typespec
import "./models/user.tsp";

model UserProfile {
  user: UserModels.User; // Using the fully qualified name
  // ...
}
```

### The `using` Directive

For frequently used namespaces, you can add a `using` directive to avoid repeating the namespace qualification:

```typespec
import "./models/user.tsp";
using UserModels; // Add the namespace to the current scope

model UserProfile {
  user: User; // User is now directly accessible without qualification
  // ...
}
```

The `using` directive brings all declarations from the specified namespace into the current scope, making them directly accessible.

## Core TypeSpec Libraries

TypeSpec comes with several core libraries that provide essential functionality for API design:

### @typespec/compiler

The compiler library provides fundamental types and decorators:

```typespec
import "@typespec/compiler";
```

Key features:

- Core decorators like `@doc` for documentation
- Intrinsic types like `string`, `number`, etc.
- Validation decorators for type constraints

### @typespec/http

The HTTP library provides types and decorators for HTTP APIs:

```typespec
import "@typespec/http";
using TypeSpec.Http;
```

Key features:

- HTTP verbs: `@get`, `@post`, `@put`, `@delete`, etc.
- Status codes and common responses
- Request and response headers
- Authentication schemes

### @typespec/rest

The REST library builds on the HTTP library to provide REST-specific patterns:

```typespec
import "@typespec/rest";
using TypeSpec.Rest;
```

Key features:

- Resource-oriented API modeling
- Standard REST patterns
- CRUD operation decorators
- Paging and filtering conventions

### @typespec/openapi

Libraries for generating OpenAPI specifications:

```typespec
import "@typespec/openapi"; // For OpenAPI 2.0 (Swagger)
```

```typespec
import "@typespec/openapi3"; // For OpenAPI 3.0
```

Key features:

- OpenAPI metadata decorators
- Format control for the generated specification
- Schema customization options

### @typespec/versioning

The versioning library provides tools for API versioning:

```typespec
import "@typespec/versioning";
using TypeSpec.Versioning;
```

Key features:

- Version decorators for models and operations
- Added/removed property tracking
- Generating versioned API specifications

## Advanced Import Techniques

TypeSpec offers several advanced import techniques for more sophisticated scenarios:

### Re-exporting Declarations

You can re-export declarations from other files to create a unified public API:

```typespec
import "./models/user.tsp";
import "./models/product.tsp";

export {
  UserModels.User,
  ProductModels.Product,
};
```

The `export` statement makes specific declarations available to importers of the current file.

### Library Alias

When importing multiple libraries with potentially conflicting names, you can use an alias:

```typespec
import Auth as AuthLib from "./authentication.tsp";
import Auth as AuthAPI from "./auth-api.tsp";

// Now you can use AuthLib.User and AuthAPI.User
```

### Dynamic Imports (JavaScript)

For libraries that need to extend TypeSpec with custom decorators, you can use JavaScript imports:

```javascript
// in a .js file that's part of your TypeSpec library
import { createDecoratorDefinition } from "@typespec/compiler";
```

This is typically used when building custom TypeSpec libraries with extended functionality.

## Import Best Practices

Follow these best practices to maintain clean and efficient imports:

1. **Import Organization**

   - Place all imports at the top of the file
   - Group imports by type (core libraries, custom libraries, local files)
   - Maintain consistent ordering

   ```typespec
   // Core libraries first
   import "@typespec/http";
   import "@typespec/rest";

   // Third-party libraries next
   import "@azure/typespec-azure-core";

   // Local imports last
   import "./models/common.tsp";
   import "./operations/user.tsp";
   ```

2. **Namespace Management**

   - Use `using` directives for frequently used namespaces
   - Prefer explicit namespace qualification for clarity when needed
   - Avoid importing namespaces with conflicting names

3. **File Structure**

   - Split large TypeSpec definitions into logical modules
   - Create index files that re-export related declarations
   - Use consistent file naming conventions

4. **Dependency Management**
   - Keep your TypeSpec library dependencies up to date
   - Ensure version compatibility between libraries
   - Use `package.json` to track dependencies properly

## Common Import Errors and Solutions

### "Cannot find module"

```
Error: Cannot find module '@typespec/http'
```

**Solution**: Install the missing library:

```bash
npm install @typespec/http
```

### "Cannot find file"

```
Error: Cannot find file './models/user.tsp'
```

**Solution**: Check the file path and ensure it's correct relative to the importing file.

### "Duplicate identifier"

```
Error: Duplicate identifier 'User'
```

**Solution**: Use namespaces to avoid conflicts, or use fully qualified names:

```typespec
// Instead of
using Namespace1;
using Namespace2; // Also has User

// Use qualified names
model Profile {
  user1: Namespace1.User;
  user2: Namespace2.User;
}
```

### "Circular dependency detected"

```
Warning: Circular dependency detected between './a.tsp' and './b.tsp'
```

**Solution**: Restructure your code to reduce circular dependencies, or extract shared types to a common file that both can import.

## Building a Modular TypeSpec Project

For larger projects, consider this modular approach to organizing your TypeSpec files:

```
my-api/
├── main.tsp          # Main entry point
├── tspconfig.yaml    # Configuration
├── models/           # Data models
│   ├── index.tsp     # Re-exports all models
│   ├── user.tsp      # User-related models
│   └── product.tsp   # Product-related models
├── operations/       # API operations
│   ├── index.tsp     # Re-exports all operations
│   ├── users.tsp     # User operations
│   └── products.tsp  # Product operations
└── common/           # Shared types
    ├── index.tsp     # Re-exports all common types
    ├── errors.tsp    # Error models
    └── pagination.tsp # Pagination types
```

In this structure:

- Each domain has its own directory
- Index files re-export contents for easier imports
- The main entry point imports only the index files

Example main.tsp:

```typespec
import "@typespec/http";
import "@typespec/rest";
using TypeSpec.Http;
using TypeSpec.Rest;

import "./models/index.tsp";
import "./operations/index.tsp";
import "./common/index.tsp";

@service({
  title: "My API Service",
})
namespace MyAPI;
```

## Next Steps

Now that you understand how to import TypeSpec files and libraries, we'll explore namespaces in the next section. Namespaces are a crucial concept in TypeSpec that help organize your API definitions and avoid naming conflicts.
