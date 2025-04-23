# What Are Models and Why Are They Important

## Introduction to Models

Models are one of the core building blocks in TypeSpec. They represent structured data types that define the shape of resources, requests, responses, and other entities in your API. Models in TypeSpec are similar to classes in object-oriented programming languages, interfaces in TypeScript, or schemas in JSON Schema.

```typespec
model User {
  id: string;
  name: string;
  email: string;
  age: int32;
  isActive: boolean;
}
```

## Why Models Are Important

Models play a crucial role in API design for several reasons:

### 1. Data Structure Definition

Models provide a clear and structured way to define the data shapes in your API. They specify what properties exist, their data types, and whether they are required or optional. This structured approach helps both API producers and consumers understand the data being exchanged.

### 2. Type Safety

By defining models, you establish a type system for your API. This type safety helps catch errors early in the development process rather than at runtime. When emitters generate code from your TypeSpec definitions, they can leverage these types to provide type checking in the target language.

### 3. Reusability

Models can be reused across different operations, reducing duplication and ensuring consistency. For example, the same `User` model might be used in creating, retrieving, updating, and listing user resources:

```typespec
model User {
  id: string;
  name: string;
  email: string;
}

interface Users {
  @get
  getUser(id: string): User;

  @post
  createUser(@body user: User): User;

  @get
  listUsers(): User[];
}
```

### 4. Documentation

Models serve as documentation for the data structures in your API. With decorators like `@doc`, you can provide detailed descriptions for models and their properties:

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

### 5. Validation Rules

Models can include validation rules using decorators, defining constraints on the data:

```typespec
model User {
  id: string;

  @minLength(2)
  @maxLength(100)
  name: string;

  @pattern("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}")
  email: string;

  @minValue(13)
  age: int32;
}
```

### 6. API Evolution

Well-designed models make it easier to evolve your API over time. You can add optional properties, create new model versions, or extend existing models without breaking backward compatibility.

## Models in the API Lifecycle

Models are relevant throughout the entire API lifecycle:

1. **Design Phase**: Defining models helps clarify what data your API will expose.
2. **Development Phase**: Models guide the implementation of both the server and client code.
3. **Documentation Phase**: Models provide a clear reference for what data to expect.
4. **Testing Phase**: Models inform the creation of test cases and validation.
5. **Maintenance Phase**: Models help manage changes to your API's data structures.

## Models vs. Other TypeSpec Constructs

While models are central to TypeSpec, they work alongside other constructs:

- **Scalars**: Define primitive data types that models can use as property types
- **Enums**: Define a fixed set of values that model properties can accept
- **Interfaces**: Group related operations, which often consume or produce models
- **Unions**: Represent values that could be one of several model types

In the following sections, we'll explore how to define and work with models in detail.
