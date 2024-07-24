---
id: 01-setup-basic-syntax
title: Getting Started with TypeSpec For REST APIs
pagination_next: getting-started/getting-started-rest/02-operations-responses # Explicitly needed as its also being the category page https://github.com/facebook/docusaurus/issues/6183
---

# Getting Started with TypeSpec for REST APIs

## Introduction

Welcome to the first part of our tutorial on using TypeSpec to define REST APIs with HTTP. In this section, we'll introduce you to TypeSpec, help you set up your environment, and cover the basic syntax and structure of TypeSpec. By the end of this section, you'll have a solid foundation to build upon in the subsequent sections.

Before we start writing TypeSpec code, we need to set up our development environment. For detailed instructions on setting up your environment, please refer to the [Installation Guide](../../introduction/installation.md).

### Summary of Setup and Installation

1. **Install Node.js**: Download and install Node.js from [nodejs.org](https://nodejs.org/).
2. **Install TypeSpec CLI**: Run `npm install -g @typespec/compiler` to install the TypeSpec CLI.
3. **Verify Installation**: Run `tsp --version` to verify that the TypeSpec CLI is installed correctly.
4. **Create a New Project**:
   - Run `tsp init` and select the `Generic REST API` template.
   - Run `tsp install` to install dependencies.
   - Run `tsp compile .` to compile the initial file. You can also run `tsp compile . --watch` to automatically compile changes on save.

## Basic Syntax and Structure

Now that we have our environment set up, let's dive into the basic syntax and structure of TypeSpec. We'll start with a simple example to illustrate the key concepts.

### Import and Using Statements

Before defining models and services, we need to import the necessary TypeSpec libraries and make them available in our namespace.

As we progress through the tutorial, you can follow along by updating the `main.tsp` file in your project and compiling the changes to see the results reflected in the generated `openapi.yaml` specification.

In most cases throughout this tutorial, you can alternatively use the `Try it` feature with the code samples to view the generated OpenAPI spec in your browser via the TypeSpec Playground.

Let's begin by adding the following import and using statements to the `main.tsp` file:

```typespec
import "@typespec/http";

using TypeSpec.Http;
```

In this example:

- `import` statement brings in the [TypeSpec HTTP library](../../libraries/http/reference/), which provides the decorators and models we'll be using to define our REST API.
- `using` statement makes the imported library available in the current namespace, allowing us to use its features and decorators.

### Understanding Models

In TypeSpec, a [model](../../language-basics/models.md) is a fundamental building block used to define the structure of data. Models are used to represent entities, such as a `Pet`, with various properties that describe the entity's attributes.

### Example: Defining a Simple Model

Let's define a simple model for a `Pet`:

```typespec
import "@typespec/http";

using TypeSpec.Http;

model Pet {
  id: int32;
  name: string;
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
```

In this example:

- The `model` keyword is used to define a new model named `Pet`.
- The `Pet` model has four properties: `id`, `name`, `age`, and `kind`.
- The `petType` [`enum`](../../language-basics/enums.md) defines possible values for the `kind` property.

### Example: Adding Validation Annotations

We can add [validation](../../language-basics/values#validation) annotations to our model properties to enforce certain constraints:

```typespec
import "@typespec/http";

using TypeSpec.Http;

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
```

In this example:

- `@minLength(1)` ensures that the `name` property has at least one character.
- `@minValue(0)` and `@maxValue(100)` ensure that the `age` property is between 0 and 100.

## Defining a REST Service

A REST service in TypeSpec is defined using the [`@service`](../../standard-library/built-in-decorators#@service) decorator. This decorator allows you to specify metadata about your service, such as its title. Additionally, you can use the [`@server`](../../libraries/http/reference/decorators#@TypeSpec.Http.server) decorator to define the server endpoint where your service will be hosted.

### Example: Defining a Service with a Title and Server Endpoint

Let's start by defining a simple REST service for a Pet Store:

```typespec
import "@typespec/http";

using TypeSpec.Http;

@service({
  title: "Pet Store",
})
@server("https://example.com", "Single server endpoint")
namespace PetStore;
```

In this example:

- The `@service` decorator is used to define a service with the title "Pet Store".
- The `@server` decorator specifies the server endpoint for the service, which is "https://example.com".

## Organizing with Namespaces

[Namespaces](../../language-basics/namespaces.md) in TypeSpec help you organize your models and operations logically. They act as containers for related definitions, making your API easier to manage and understand.

### Example: Creating a Namespace

Let's create a namespace for our Pet Store service:

```typespec
import "@typespec/http";

using TypeSpec.Http;

@service({
  title: "Pet Store",
})
@server("https://example.com", "Single server endpoint")
namespace PetStore;
```

In this example:

- The `namespace` keyword is used to define a namespace named `PetStore`.
- All models and operations related to the Pet Store service will be defined within this namespace.

## Adding Models to the Namespace

Next, we'll add the `Pet` model we defined earlier to our `PetStore` namespace.

### Example: Adding the Pet Model

```typespec
import "@typespec/http";

using TypeSpec.Http;

@service({
  title: "Pet Store",
})
@server("https://example.com", "Single server endpoint")
namespace PetStore;

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
```

In this example:

- The `Pet` model is defined within the `PetStore` namespace.
- The model includes validation annotations to enforce constraints on the properties.
- The `petType` enum is also defined within the `PetStore` namespace.

## Defining HTTP Operations

Now that we have our service, namespace, and model defined, let's add some HTTP [operations](../../language-basics/operations.md) to interact with our `Pet` model. We'll start with a simple `GET` operation to list all pets.

### Example: Defining a GET Operation

```tsp tryit="{"emit": ["@typespec/openapi3"]}"
import "@typespec/http";

using TypeSpec.Http;

@service({
  title: "Pet Store",
})
@server("https://example.com", "Single server endpoint")
namespace PetStore;

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

@route("/pets")
namespace Pets {
  @get
  op listPets(): {
    @body pets: Pet[];
  };
}
```

In this example:

- The `@route` decorator is used to define the base path for the `Pets` namespace.
- The `@get` decorator defines a `GET` operation named `listPets`.
- The `listPets` operation returns a list of `Pet` objects in the response body.

### Example: Defining a GET Operation with Path Parameter

Let's add another `GET` operation to retrieve a specific pet by its `petId`.

```tsp tryit="{"emit": ["@typespec/openapi3"]}"
import "@typespec/http";

using TypeSpec.Http;

@service({
  title: "Pet Store",
})
@server("https://example.com", "Single server endpoint")
namespace PetStore;

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

@route("/pets")
namespace Pets {
  @get
  op listPets(): {
    @body pets: Pet[];
  };

  @get
  op getPet(@path petId: int32): {
    @body pet: Pet;
  } | {
    @body error: NotFoundError;
  };
}

@error
model NotFoundError {
  code: "NOT_FOUND";
  message: string;
}
```

In this example:

- The `getPet` operation retrieves a specific pet by its `petId` and returns it in the response body.
- If the pet is not found, it returns a `NotFoundError`, a custom error we've defined within the PetStore namespace. We'll cover error handling in more detail in a later section.

## Conclusion

In this section, we introduced you to TypeSpec, set up the development environment, and covered the basic syntax and structure of TypeSpec. We defined a simple model with validation annotations, created a REST service with a title and server endpoint, organized our API using namespaces, and added a model and HTTP operations.

In the next section, we'll dive deeper into defining more HTTP operations and handling different types of responses.
