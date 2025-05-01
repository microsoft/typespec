# Importing the HTTP Library

The HTTP library is a core component of TypeSpec that enables you to define HTTP-based APIs with precision and clarity. It provides decorators, models, and types that map TypeSpec constructs to HTTP concepts like methods, headers, query parameters, and response codes.

## What is the HTTP Library?

The `@typespec/http` library is the foundation for building REST APIs in TypeSpec. It provides:

- HTTP verb decorators (`@get`, `@post`, `@put`, etc.)
- Request and response metadata decorators (`@header`, `@query`, `@path`, `@body`, etc.)
- HTTP status code handling
- Authentication schemes
- Common HTTP response types
- File handling
- And much more

This library acts as the bridge between TypeSpec's type system and HTTP protocol concepts, allowing you to express HTTP API contracts in a clean, organized manner.

## Installing the HTTP Library

To use the HTTP library in your TypeSpec project, you need to install it as a dependency:

```bash
npm install @typespec/http
```

If you're using the TypeSpec CLI to manage your project (`tsp init`), the HTTP library might already be installed as a dependency in your `package.json` file.

## Importing the Library

Once installed, you can import the HTTP library in your TypeSpec files using the `import` statement:

```typespec
import "@typespec/http";
```

This makes all the types, models, and decorators from the HTTP library available in your TypeSpec files, but you'll need to reference them with their fully qualified names (e.g., `TypeSpec.Http.get`).

## Using the Library with the `using` Directive

To avoid having to use fully qualified names for HTTP library components, you can use the `using` directive:

```typespec
import "@typespec/http";
using TypeSpec.Http;
```

With this directive in place, you can now use the HTTP decorators and types directly:

```typespec
@service
namespace PetStore;

@route("/pets")
interface Pets {
  @get
  listPets(): Pet[];

  @post
  createPet(@body pet: Pet): Pet;

  @get
  @route("/{id}")
  getPet(@path id: string): Pet;
}

model Pet {
  id: string;
  name: string;
  tag?: string;
}
```

## Combining Multiple Libraries

HTTP functionality is often used in combination with other TypeSpec libraries such as REST or OpenAPI. You can import and use multiple libraries together:

```typespec
import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi";

using TypeSpec.Http;
using TypeSpec.Rest;
```

This enables you to leverage features from multiple libraries to create comprehensive API definitions.

## Configuring the HTTP Library in Your Project

The HTTP library also provides linting rules that can help ensure your API design follows best practices. You can enable these rules in your `tspconfig.yaml` file:

```yaml
linter:
  extends:
    - "@typespec/http/all"
```

This configuration ensures that your TypeSpec code adheres to HTTP design best practices, making your APIs more consistent and maintainable.

## Next Steps

With the HTTP library imported into your TypeSpec project, you're ready to start defining HTTP operations, including:

- Specifying HTTP verbs for operations
- Defining routes and path parameters
- Working with query parameters
- Structuring request and response bodies

These topics will be covered in the following sections of this chapter.
