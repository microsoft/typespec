# Namespaces

Namespaces in TypeSpec are used to organize your models, operations, and other definitions logically. They act as containers for related definitions, making your API easier to manage and understand.

## Declaring a Namespace

You can declare a namespace using the `namespace` keyword followed by the name of the namespace. For example:

```typespec
namespace PetStore {
// Definitions related to the PetStore API will go here

}
```

In this example, the `PetStore` namespace groups all definitions related to the PetStore API.

## Using Namespaces

To use a namespace in your TypeSpec definitions, you can reference it directly. For example:

```typespec
namespace PetStore {
  model Pet {
    name: string;
    age: uint8;
  }
}
```

In this case, the `Pet` model is defined within the `PetStore` namespace, indicating that it is part of the PetStore API.

## Nested Namespaces

You can also create nested namespaces to further organize your definitions. For example:

```typespec
namespace PetStore.Models {
  model Pet {
    name: string;
    age: uint8;
  }
}
```

In this example, the `Pet` model is defined within a nested namespace, `Models`, under the `PetStore` namespace.

## Summary

Using namespaces effectively allows you to create a well-structured TypeSpec project. By organizing your definitions into namespaces, you can improve the readability and maintainability of your API, making it easier for developers to understand the relationships between different components.

As you work through your TypeSpec projects, remember to use namespaces to keep your definitions organized and clear.
