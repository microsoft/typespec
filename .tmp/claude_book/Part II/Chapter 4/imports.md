# Imports

In TypeSpec, imports allow you to reference and use types, decorators, and other elements defined in external files or libraries. This modularity is essential for building maintainable and organized API definitions.

## Importing TypeSpec Files

You can import other TypeSpec files using a relative path to the file. The extension `.tsp` is implied and should be omitted from the import statement.

```typespec
import "./models/common";
import "../shared/types";
```

When importing a file, all the declarations in that file become available in the current file. This includes models, scalars, operations, interfaces, and any other TypeSpec constructs.

## Importing Libraries

TypeSpec libraries are packages that provide reusable components, decorators, and types. To import a library, use its package name:

```typespec
import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi";
```

Libraries often define namespaces that contain their types and decorators. To use these elements more conveniently, you can combine imports with the `using` statement:

```typespec
import "@typespec/http";
using TypeSpec.Http;

@get
op getUserProfile(): User;
```

In this example, the `@get` decorator from the `TypeSpec.Http` namespace can be used directly after the `using` statement.

## Library Versioning

When importing libraries, TypeSpec uses the version resolution rules of npm. Libraries can specify peer dependencies on other libraries to ensure compatibility.

```json
{
  "dependencies": {
    "@typespec/http": "^0.51.0"
  }
}
```

## Default Imports

When importing a TypeSpec file without any explicit exports, all declarations are implicitly exported and available for import.

## Best Practices

- **Organize imports**: Keep imports at the top of your TypeSpec files for better readability.
- **Use relative paths**: For local TypeSpec files, use relative paths that make it clear where the imported file is located.
- **Import specific libraries**: Only import libraries that you actually need in your TypeSpec file.
- **Group imports logically**: Group related imports together, separating library imports from local file imports.

By organizing your imports effectively, you can create more maintainable and modular TypeSpec definitions.
