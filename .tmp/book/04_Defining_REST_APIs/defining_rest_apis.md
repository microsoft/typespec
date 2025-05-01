# Defining REST APIs

Defining REST APIs with TypeSpec involves creating structured representations of your services that clients can interact with. This section will cover the essential concepts of REST APIs and how to implement them using TypeSpec.

## Overview of REST API Concepts

REST (Representational State Transfer) is an architectural style for designing networked applications. It relies on a stateless, client-server communication model and uses standard HTTP methods to perform operations on resources. Key concepts include:

- **Resources**: The primary entities that your API exposes, such as users, products, or orders.
- **HTTP Methods**: Standard methods used to interact with resources, including:
  - **GET**: Retrieve a resource.
  - **POST**: Create a new resource.
  - **PUT**: Update an existing resource.
  - **DELETE**: Remove a resource.

## Defining a REST Service

In TypeSpec, you can define a REST service using the `@service` decorator. This decorator allows you to specify metadata about your service, such as its title and description. For example:

```typespec
@service(#{ title: "Pet Store API" })
@server("https://api.example.com")
model Pet {
  name: string;
  age: uint8;
}
```

In this example, the `Pet` model is part of the "Pet Store API" service hosted at the specified URL.

### Using the @service and @server Decorators

The `@service` decorator is used to define the service's metadata, while the `@server` decorator specifies the server endpoint where the service will be hosted. You can use these decorators to provide essential information about your API.

## Organizing with Namespaces

To keep your API definitions organized, you can use namespaces. Namespaces help group related models and operations logically. For example:

```typespec
namespace PetStore {
  @service(#{ title: "Pet Store API" })
  @server("https://api.example.com")
  model Pet {
    name: string;
    age: uint8;
  }
}
```

In this example, the `Pet` model is defined within the `PetStore` namespace, indicating that it is part of the Pet Store API.

## Defining Models for API Resources

Models are used to define the structure of the data that your API will expose. For example, you can define a `Pet` model with properties such as `name` and `age`:

```typespec
model Pet {
  name: string;
  age: uint8;
}
```

This model represents a pet with a name and age, which can be used in your API operations.

## Adding Validation Annotations

You can enhance your models by adding validation annotations to enforce constraints on the properties. For example:

```typespec
model Pet {
  @minLength(1)
  name: string;

  @minValue(0)
  age: uint8;
}
```

In this example, the `name` property must have at least one character, and the `age` property must be a non-negative value.

## Summary

Defining REST APIs with TypeSpec allows you to create structured and organized representations of your services. By understanding the key concepts of REST, using decorators effectively, and defining models for your resources, you can build clear and maintainable APIs.

As you work with TypeSpec, remember to leverage these concepts to create robust and user-friendly APIs.
