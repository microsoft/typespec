# Model Declaration Syntax

Models in TypeSpec are declared using the `model` keyword, followed by a name and a body enclosed in curly braces. The body contains property declarations that define the structure of the model.

## Basic Model Declaration

Here's the simplest form of a model declaration:

```typespec
model User {
  id: string;
  name: string;
  email: string;
}
```

This declares a model named `User` with three properties: `id`, `name`, and `email`, all of type `string`.

## Property Declarations

Each property in a model is declared with:

- A name
- A colon (`:`)
- A type
- A semicolon (`;`) to end the declaration

```typespec
model Product {
  id: string;
  name: string;
  price: float64;
  description: string;
  category: string;
  inStock: boolean;
}
```

## Name Conventions

Model names in TypeSpec typically follow these conventions:

- Use PascalCase (first letter of each word capitalized)
- Use singular nouns
- Be descriptive and clear about what the model represents

For example: `User`, `Product`, `OrderItem`, `ShippingAddress`.

## Empty Models

You can declare models without any properties:

```typespec
model EmptyResponse {}
```

This is useful for representing entities that don't have any properties but need to be distinct types.

## Models in Namespaces

Models are typically declared within namespaces to organize related types:

```typespec
namespace Ecommerce {
  model Product {
    id: string;
    name: string;
    price: float64;
  }

  model Order {
    id: string;
    productId: string;
    quantity: int32;
  }
}
```

## Documentation

It's a good practice to document your models using the `@doc` decorator:

```typespec
@doc("Represents a user in the system")
model User {
  @doc("Unique identifier for the user")
  id: string;

  @doc("User's full name")
  name: string;

  @doc("User's email address")
  email: string;
}
```

## Nested Models

You can nest model declarations within other models:

```typespec
model Order {
  id: string;

  model Address {
    street: string;
    city: string;
    zipCode: string;
  }

  shippingAddress: Address;
  billingAddress: Address;
}
```

However, this practice is generally discouraged for complex models as it can make the code harder to read and maintain. Instead, declare models separately and reference them:

```typespec
model Address {
  street: string;
  city: string;
  zipCode: string;
}

model Order {
  id: string;
  shippingAddress: Address;
  billingAddress: Address;
}
```

## Inline Anonymous Models

You can define anonymous inline models for properties:

```typespec
model User {
  id: string;
  address: {
    street: string;
    city: string;
    zipCode: string;
  };
}
```

While this can be convenient, it's generally better to define named models separately for reusability and clarity, especially for complex structures.

## Model References

Models can reference other models as property types:

```typespec
model Category {
  id: string;
  name: string;
}

model Product {
  id: string;
  name: string;
  category: Category;
}
```

## Cyclical References

Models can reference each other cyclically:

```typespec
model Person {
  id: string;
  name: string;
  friends: Person[];
}
```

Or with multiple models:

```typespec
model Post {
  id: string;
  title: string;
  author: User;
  comments: Comment[];
}

model User {
  id: string;
  name: string;
  posts: Post[];
}

model Comment {
  id: string;
  content: string;
  author: User;
  post: Post;
}
```

TypeSpec handles these cyclical references properly without issues.

## Best Practices

When declaring models, consider these best practices:

- Keep models focused on a single responsibility
- Group related properties together
- Use descriptive names for both models and properties
- Add documentation with `@doc` decorators
- Reuse models instead of duplicating similar structures
- Avoid overly complex nesting
- Organize models logically in namespaces

Following these practices will make your TypeSpec code more maintainable and easier to understand for others working with your API definitions.
