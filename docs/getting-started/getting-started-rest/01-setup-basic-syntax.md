# Getting Started with TypeSpec for REST APIs

## Introduction

Welcome to the first part of our tutorial on using TypeSpec to define REST APIs with HTTP. In this section, we'll introduce you to TypeSpec, help you set up your environment, and cover the basic syntax and structure of TypeSpec. By the end of this section, you'll have a solid foundation to build upon in the subsequent sections.

## Setting Up the Environment

Before we start writing TypeSpec code, we need to set up our development environment. In the context of this tutorial, we'll assume you're using [Visual Studio Code](https://code.visualstudio.com/) as your code editor. If you're using a different editor, you may need to adjust the setup accordingly.

Follow these steps to get started:

### Step 1: Install Node.js

TypeSpec requires Node.js. If you don't have Node.js installed, download and install it from [nodejs.org](https://nodejs.org/).

### Step 2: Install TypeSpec CLI

Once Node.js is installed, you can install the TypeSpec CLI using npm (Node Package Manager). Open your terminal or command prompt and run the following command:

```sh
npm install -g @typespec/cli
```

### Step 3: Verify Installation

To verify that TypeSpec CLI is installed correctly, run the following command:

```sh
typespec --version
```

You should see the version number of the TypeSpec CLI, indicating that the installation was successful.

### Step 4: Create a New Project

:::note
Make sure to have installed the [editor extension](../../introduction/installation.md#install-the-vs-and-vscode-extensions) to get syntax highlighting and IntelliSense.
:::

1. Make a new folder somewhere.
2. Run `tsp init` and select the `Generic REST API` template.
3. Run `tsp install` to install dependencies.
4. Run `tsp compile .` to compile the initial file. You can either run `tsp compile . --watch` to automatically compile changes on save or keep running the command manually after that.

Resulting file structure:

```
main.tsp
tspconfig.yaml
package.json
node_modules/
tsp-output/
  @typespec/
    openapi3/
      openapi.yaml
```

## Basic Syntax and Structure

Now that we have our environment set up, let's dive into the basic syntax and structure of TypeSpec. We'll start with a simple example to illustrate the key concepts.

### Import and Using Statements

Before defining models and services, we need to import the necessary TypeSpec libraries and make them available in our namespace.

```typespec
import "@typespec/http";
import "@typespec/rest";

using TypeSpec.Http;
using TypeSpec.Rest;
```

In this example:

- `import` statements bring in the TypeSpec libraries for HTTP and REST functionalities.
- `using` statements make the imported libraries available in the current namespace, allowing us to use their features and decorators.

### Example: Defining a Simple Model

Let's define a simple model for a `Pet`:

```typespec
import "@typespec/http";
import "@typespec/rest";

using TypeSpec.Http;
using TypeSpec.Rest;

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

- `model` keyword is used to define a new model named `Pet`.
- The `Pet` model has four properties: `id`, `name`, `age`, and `kind`.
- The `petType` enum defines possible values for the `kind` property.

### Example: Adding Validation Annotations

We can add validation annotations to our model properties to enforce certain constraints:

```typespec
import "@typespec/http";
import "@typespec/rest";

using TypeSpec.Http;
using TypeSpec.Rest;

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

A REST service in TypeSpec is defined using the `@service` decorator. This decorator allows you to specify metadata about your service, such as its title. Additionally, you can use the `@server` decorator to define the server endpoint where your service will be hosted.

### Example: Defining a Service with a Title and Server Endpoint

Let's start by defining a simple REST service for a Pet Store:

```typespec
import "@typespec/http";
import "@typespec/rest";

using TypeSpec.Http;
using TypeSpec.Rest;

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

Namespaces in TypeSpec help you organize your models and operations logically. They act as containers for related definitions, making your API easier to manage and understand.

### Example: Creating a Namespace

Let's create a namespace for our Pet Store service:

```typespec
import "@typespec/http";
import "@typespec/rest";

using TypeSpec.Http;
using TypeSpec.Rest;

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
import "@typespec/rest";

using TypeSpec.Http;
using TypeSpec.Rest;

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

Now that we have our service, namespace, and model defined, let's add some HTTP operations to interact with our `Pet` model. We'll start with a simple `GET` operation to list all pets.

### Example: Defining a GET Operation

```typespec
import "@typespec/http";
import "@typespec/rest";

using TypeSpec.Http;
using TypeSpec.Rest;

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

```typespec
import "@typespec/http";
import "@typespec/rest";

using TypeSpec.Http;
using TypeSpec.Rest;

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
- If the pet is not found, it returns a `NotFoundError`.

## Conclusion

In this section, we introduced you to TypeSpec, set up the development environment, and covered the basic syntax and structure of TypeSpec. We defined a simple model with validation annotations, created a REST service with a title and server endpoint, organized our API using namespaces, and added a model and HTTP operations.

In the next section, we'll dive deeper into defining more HTTP operations and handling different types of responses.
