---
title: Versioning
---

# Versioning

## Introduction

In this section, we'll focus on implementing versioning in your REST API. Versioning allows you to manage changes to your API over time without breaking existing clients. We'll introduce the `@versioned` decorator, show how to define versions with enums, and demonstrate how to use the `@added` decorator to specify version-specific models and operations.

## Adding the Versioning Library

Before we can use the versioning decorators, we need to add the `@typespec/versioning` library to our project. This involves updating the `package.json` file and installing the necessary dependencies.

### Step 1: Update `package.json`

Add the `@typespec/versioning` library to your `package.json` file:

```json
{
  "name": "tsp_pet_store",
  "version": "0.1.0",
  "type": "module",
  "dependencies": {
    "@typespec/compiler": "latest",
    "@typespec/http": "latest",
    "@typespec/openapi3": "latest",
    "@typespec/versioning": "latest"
  },
  "private": true
}
```

### Step 2: Install Dependencies

Run the following command to install the new dependencies:

```sh
tsp install
```

## Introduction to the `@versioned` Decorator

The [`@versioned`](../../libraries/versioning/reference/decorators#@TypeSpec.Versioning.versioned) decorator is used to define different versions of your API. This decorator allows you to specify the versions that your API supports and manage changes across these versions.

### Example: Defining API Versions

Let's define two versions of our API, `v1` and `v2`:

```typespec
import "@typespec/http";
import "@typespec/versioning";

using TypeSpec.Http;
using TypeSpec.Versioning;

@service({
  title: "Pet Store",
})
@server("https://example.com", "Single server endpoint")
@versioned(Versions)
namespace PetStore;

enum Versions {
  v1: "1.0",
  v2: "2.0",
}
```

In this example:

- We're importing and using a new module, `@typespec/versioning`, which provides versioning support.
- The `@versioned` decorator is used to define the versions supported by the API, defined in the `Versions` enum.
- The `Versions` enum specifies two versions: `v1` (1.0) and `v2` (2.0).

## Using the `@added` Decorator

The [`@added`](../../libraries/versioning/reference/decorators#@TypeSpec.Versioning.added) decorator is used to indicate that a model or operation was added in a specific version of the API. This allows you to manage changes and additions to your API over time.

### Example: Adding a New Model in a Specific Version

Let's add a `Toy` model that is only available in version 2 of the API:

```tsp tryit="{"emit": ["@typespec/openapi3"]}"
import "@typespec/http";
import "@typespec/versioning";

using TypeSpec.Http;
using TypeSpec.Versioning;

@service({
  title: "Pet Store",
})
@server("https://example.com", "Single server endpoint")
@versioned(Versions)
namespace PetStore;

enum Versions {
  v1: "1.0",
  v2: "2.0",
}

model Pet {
  id: int32;

  @minLength(1)
  name: string;

  @minValue(0)
  @maxValue(100)
  age: int32;

  kind: petType;
}

enum petType {
  dog: "dog",
  cat: "cat",
  fish: "fish",
  bird: "bird",
  reptile: "reptile",
}

@added(Versions.v2)
model Toy {
  id: int32;
  name: string;
}
```

In this example:

- The `Toy` model is defined with the `@added(Versions.v2)` decorator to indicate that it was added in version 2 of the API.

## Version-Specific Operations

Let's define version-specific operations to manage toys for pets. These operations will only be available in version 2 of the API.

### Example: Adding Version-Specific Operations

```tsp tryit="{"emit": ["@typespec/openapi3"]}"
import "@typespec/http";
import "@typespec/versioning";

using TypeSpec.Http;
using TypeSpec.Versioning;

@service({
  title: "Pet Store",
})
@server("https://example.com", "Single server endpoint")
@versioned(Versions)
namespace PetStore;

enum Versions {
  v1: "1.0",
  v2: "2.0",
}

model Pet {
  id: int32;

  @minLength(1)
  name: string;

  @minValue(0)
  @maxValue(100)
  age: int32;

  kind: petType;
}

enum petType {
  dog: "dog",
  cat: "cat",
  fish: "fish",
  bird: "bird",
  reptile: "reptile",
}

@added(Versions.v2)
model Toy {
  id: int32;
  name: string;
}

model CommonParameters {
  @header
  requestID: string;

  @query
  locale?: string;

  @header
  clientVersion?: string;
}

@route("/pets")
namespace Pets {
  @get
  op listPets(...CommonParameters): {
    @body pets: Pet[];
  };

  @get
  op getPet(@path petId: int32, ...CommonParameters): {
    @body pet: Pet;
  } | {
    @body error: NotFoundError;
  };

  @post
  @useAuth(BearerAuth)
  op createPet(@body pet: Pet, ...CommonParameters): {
    @statusCode statusCode: 201;
    @body newPet: Pet;
  } | {
    @statusCode statusCode: 400;
    @body error: ValidationError;
  };

  @put
  @useAuth(BearerAuth)
  op updatePet(@path petId: int32, @body pet: Pet, ...CommonParameters):
    | {
        @body updatedPet: Pet;
      }
    | {
        @body error: NotFoundError;
      }
    | {
        @statusCode statusCode: 400;
        @body error: ValidationError;
      }
    | InternalServerErrorResponse;

  @delete
  @useAuth(BearerAuth)
  op deletePet(@path petId: int32, ...CommonParameters): {
    @statusCode statusCode: 204;
  } | {
    @body error: NotFoundError;
  };

  @route("{petId}/toys")
  namespace Toys {
    @added(Versions.v2)
    @get
    op listToys(@path petId: int32, ...CommonParameters): {
      @body toys: Toy[];
    };

    @added(Versions.v2)
    @post
    @useAuth(BearerAuth)
    op createToy(@path petId: int32, @body toy: Toy, ...CommonParameters): {
      @statusCode statusCode: 201;
      @body newToy: Toy;
    };

    @added(Versions.v2)
    @put
    @useAuth(BearerAuth)
    op updateToy(@path petId: int32, @path toyId: int32, @body toy: Toy, ...CommonParameters): {
      @body updatedToy: Toy;
    };

    @added(Versions.v2)
    @delete
    @useAuth(BearerAuth)
    op deleteToy(@path petId: int32, @path toyId: int32, ...CommonParameters): {
      @statusCode statusCode: 204;
    };
  }
}

@error
model NotFoundError {
  code: "NOT_FOUND";
  message: string;
}

@error
model ValidationError {
  code: "VALIDATION_ERROR";
  message: string;
  details: string[];
}

@error
model InternalServerError {
  code: "INTERNAL_SERVER_ERROR";
  message: string;
}

model InternalServerErrorResponse {
  @statusCode statusCode: 500;
  @body error: InternalServerError;
}
```

In this example:

- The `Toys` namespace is defined under the `Pets` namespace.
- The `@added(Versions.v2)` decorator is applied to the operations within the `Toys` namespace to indicate that they were added in version 2 of the API.
- The `Toys` namespace includes operations to list, create, update, and delete toys for a specific pet. These operations are only available in version 2 of the API.

### Generating OpenAPI Specifications for Different Versions

Once we start adding versions, the TypeSpec compiler will generate individual OpenAPI specifications for each version. In our case, it will generate two OpenAPI specs, one for each version of our pet store service API. Our file structure will now look like this:

```
main.tsp
tspconfig.yaml
package.json
node_modules/
tsp-output/
┗ @typespec/
  ┗ openapi3/
┃   ┣ openapi.1.0.yaml
┃   ┗ openapi.2.0.yaml
```

The 2.0 version of the OpenAPI spec will include the Toy model and any other additions specified for version 2 of our service, while the 1.0 version will not include these additions.

Generating separate specs for each version ensures backward compatibility, provides clear documentation for developers to understand differences between versions, and simplifies maintenance by allowing independent updates to each version's specifications.

## Conclusion

In this section, we focused on implementing versioning in your REST API. By using the `@versioned` and `@added` decorators, we can manage changes to our API over time without breaking existing clients.
