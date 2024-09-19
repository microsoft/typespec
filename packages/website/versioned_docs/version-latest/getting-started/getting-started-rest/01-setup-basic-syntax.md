---
id: 01-setup-basic-syntax
title: Getting Started with TypeSpec For REST APIs
pagination_next: getting-started/getting-started-rest/02-operations-responses # Explicitly needed as its also being the category page https://github.com/facebook/docusaurus/issues/6183
---

# Getting Started with TypeSpec for REST APIs

## Introduction

Welcome to our tutorial on using TypeSpec to define REST APIs with HTTP. In this section, we'll introduce you to TypeSpec, help you set up your environment, and cover the basic syntax and structure of TypeSpec. By the end of this section, you'll have a solid foundation to build upon in the subsequent sections.

### What is TypeSpec?

TypeSpec is a language and toolset developed by Microsoft for defining data models and service APIs. It provides a structured way to describe the shape and behavior of data and services, ensuring consistency and reducing errors in API development. With TypeSpec, you can generate code, documentation, and other artifacts from your API definitions, making it easier to maintain and evolve your services. Microsoft uses TypeSpec internally to define APIs for various products and services, including Azure.

TypeSpec is used to define the **interface** of your API, which clients will use to interact with resources provided by your service. This includes specifying the operations, request and response models, and error handling mechanisms. The actual API logic is implemented in the backend service, which processes the requests and communicates with the database.

Before we start writing TypeSpec code, we need to set up our development environment. For detailed instructions on setting up your environment, please refer to the [Installation Guide](../../introduction/installation.md).

### Summary of Setup and Installation

1. **Install Node.js**: Download and install Node.js from [nodejs.org](https://nodejs.org/). This will also install npm, the Node.js package manager. The minimum versions required are Node.js 20.0.0 and npm 7.0.0.
2. **Install TypeSpec CLI**: Run `npm install -g @typespec/compiler` to install the TypeSpec CLI.
3. **Verify Installation**: Run `tsp --version` to verify that the TypeSpec CLI is installed correctly.
4. **Create a New Project**:
   - Run `tsp init` and select the `Generic REST API` template.
   - Run `tsp install` to install dependencies.
   - Run `tsp compile .` to compile the initial file.
   - Run `tsp compile . --watch` to automatically compile changes on save.

### Project Structure Overview

Once you've completed these steps, you'll have a basic TypeSpec project set up. Here's an overview of the files and directories in your TypeSpec project:

```
Project Root
├── main.tsp
├── tspconfig.yaml
├── package.json
├── node_modules/
└── tsp-output/
```

- **main.tsp**: Entry point for TypeSpec definitions.
- **tspconfig.yaml**: TypeSpec compiler configuration.
- **package.json**: Project metadata and dependencies.
- **node_modules/**: Installed dependencies.
- **tsp-output/**: Generated files.
- **openapi.yaml**: Generated OpenAPI specification.

As we work through the tutorial, keep the openapi.yaml file open in Visual Studio or VS Code to watch the API specification evolve as we make changes.

## Basic Syntax and Structure

Now that we have our environment set up, let's dive into the basic syntax and structure of TypeSpec. We'll create a simple REST API for a pet store by introducing concepts in a layered fashion, increasing complexity as we progress through the tutorial.

As the tutorial advances and the code examples grow more complex, we'll highlight changes in the code to help you easily spot where new lines have been added.

### Import and Using Statements

Before defining models and services, we need to import the necessary TypeSpec libraries and make them available in our namespace.

As we progress through the tutorial, you can follow along by updating the `main.tsp` file in your project and compiling the changes to see the results reflected in the generated `openapi.yaml` specification.

You can also alternatively use the `Try it` feature with the code samples to quickly view the generated OpenAPI spec in your browser via the TypeSpec Playground.

Let's begin by adding the following import and using statements to the `main.tsp` file:

```tsp tryit="{"emit": ["@typespec/openapi3"]}"
import "@typespec/http";

using TypeSpec.Http;
```

In this example:

- `import` statement brings in the [TypeSpec HTTP library](../../libraries/http/reference/), which provides the decorators and models we'll be using to define our REST API.
- `using` statement makes the imported library available in the current namespace, allowing us to use its features and decorators.

**NOTE: Your generated project file likely already has these import/using statements, plus import/using for the `@typespec/openapi3` library. The `@typespec/openapi3` library is necessary for emitting the OpenAPI specification file but is not required for creating our Pet Store API in TypeSpec. Remove them from your `main.tsp` file so your code matches the example above.**

## Defining a REST Service

A REST service in TypeSpec is defined using the [`@service`](../../standard-library/built-in-decorators#@service) decorator. This decorator allows you to specify metadata about your service, such as its title. Additionally, you can use the [`@server`](../../libraries/http/reference/decorators#@TypeSpec.Http.server) decorator to define the server endpoint where your service will be hosted.

### Example: Defining a Service with a Title and Server Endpoint

Let's start by defining a simple REST service for a Pet Store:

```tsp tryit="{"emit": ["@typespec/openapi3"]}"
import "@typespec/http";

using TypeSpec.Http;
// highlight-start
@service({
  title: "Pet Store",
})
@server("https://example.com", "Single server endpoint")
// highlight-end
```

In this example:

- The `@service` decorator is used to define a service with the title "Pet Store".
- The `@server` decorator specifies the server endpoint for the service, which is "https://example.com".

**OpenAPI Comparison**: In OpenAPI, this is similar to defining the `info` object (which includes the title) and the `servers` array (which includes the server URL).

**NOTE: This code will not compile as-is because we've not yet defined a `namespace` for these decorators to apply to. We'll cover that topic next.**

## Organizing with Namespaces

[Namespaces](../../language-basics/namespaces.md) in TypeSpec help you organize your models and operations logically. They act as containers for related definitions, making your API easier to manage and understand.

### Example: Creating a Namespace

Let's create a namespace for our Pet Store service:

```tsp tryit="{"emit": ["@typespec/openapi3"]}"
import "@typespec/http";

using TypeSpec.Http;

@service({
  title: "Pet Store",
})
@server("https://example.com", "Single server endpoint")

// highlight-next-line
namespace PetStore;
```

In this example:

- The `namespace` keyword is used to define a top-level namespace named `PetStore`.
- All models and operations related to the Pet Store service will be defined within this namespace.
- The first use of namespace defines the top-level namespace and does not require brackets. This is because it serves as the primary container for all related definitions.
- Any subsequent namespaces defined within this top-level namespace will require brackets {} to indicate that they are nested within the top-level namespace.

**OpenAPI Comparison**: In OpenAPI, namespaces are similar to using tags to group related operations and definitions.

## Defining Models

In TypeSpec, a [model](../../language-basics/models.md) is a fundamental building block used to define the structure of data. Models are used to represent entities, such as a `Pet`, with various properties that describe the entity's attributes.

### Example: Defining a Simple Model

Let's define a simple model for a `Pet`:

```tsp tryit="{"emit": ["@typespec/openapi3"]}"
import "@typespec/http";

using TypeSpec.Http;

@service({
  title: "Pet Store",
})
@server("https://example.com", "Single server endpoint")
namespace PetStore;

// highlight-start
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
// highlight-end
```

In this example:

- The `model` keyword is used to define a new model named `Pet`.
- The `Pet` model has four properties: `id`, `name`, `age`, and `kind`.
- The `petType` [`enum`](../../language-basics/enums.md) defines possible values for the `kind` property.

**OpenAPI Comparison**: In OpenAPI, this is similar to defining a `schema` object under the `components` section, where you define the structure and properties of your data models.

### Example: Adding Validation Annotations

We can add [validation](../../language-basics/values#validation) annotations to our model properties to enforce certain constraints:

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

  // highlight-next-line
  @minLength(1)
  name: string;

  // highlight-next-line
  @minValue(0)
  // highlight-next-line
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

**OpenAPI Comparison**: In OpenAPI, this is similar to using `minLength`, `minimum`, and `maximum` constraints within the `schema` object.

## Conclusion

In this section, we introduced you to TypeSpec, set up the development environment, and covered basic language syntax and structure. We defined a simple REST service, organized our API using namespaces, and defined a model with validation annotations.

With this foundational knowledge, you're now ready to dive deeper into defining operations and handling different types of responses in your REST API. In the next section, we'll expand our API by adding CRUD operations.
