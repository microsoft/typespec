# Model Properties

Model properties define the individual data elements that make up a model in TypeSpec. They are the building blocks that determine the structure and shape of your API's data models.

## Basic Property Syntax

Properties are declared within a model using the syntax `propertyName: propertyType`:

```typespec
model User {
  id: string;
  name: string;
  age: int32;
  isActive: boolean;
}
```

Property names follow TypeSpec identifier rules and are conventionally written in camelCase.

## Optional Properties

By default, all properties in a model are required. To mark a property as optional, append a question mark (`?`) to the property name:

```typespec
model User {
  id: string;
  name: string;
  middleName?: string; // Optional property
  email?: string; // Optional property
}
```

Optional properties may be omitted when creating instances of the model.

## Property Types

Properties can be of various types:

### Primitive Types

```typespec
model Example {
  stringProp: string;
  intProp: int32;
  floatProp: float32;
  boolProp: boolean;
  dateProp: utcDateTime;
}
```

### Array Types

To define an array of a specific type, use the square bracket notation:

```typespec
model BlogPost {
  id: string;
  title: string;
  tags: string[]; // Array of strings
  comments: Comment[]; // Array of Comment models
}
```

### Model Types

Properties can reference other models:

```typespec
model Address {
  street: string;
  city: string;
  zipCode: string;
}

model User {
  id: string;
  name: string;
  homeAddress: Address; // Property of type Address
  workAddress?: Address; // Optional property of type Address
}
```

### Union Types

Properties can be defined as unions to accept multiple types:

```typespec
model Property {
  name: string;
  value: string | int32 | boolean; // Can be any of these types
}
```

### Enum Types

Properties can reference enum types:

```typespec
enum Status {
  Active,
  Inactive,
  Pending,
}

model User {
  id: string;
  name: string;
  status: Status; // Property of enum type
}
```

## Property Decorators

Properties can be decorated with metadata using decorators:

### Documentation

```typespec
model User {
  @doc("Unique identifier for the user")
  id: string;

  @doc("User's full name")
  name: string;
}
```

### Validation Constraints

```typespec
model User {
  id: string;

  @minLength(2)
  @maxLength(100)
  name: string;

  @minValue(0)
  @maxValue(120)
  age: int32;

  @pattern("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}")
  email: string;
}
```

### Encoding and Format

```typespec
model User {
  id: string;

  @format("email")
  email: string;

  @encodedName("date-of-birth")
  dateOfBirth: utcDateTime;
}
```

### Key Properties

You can mark properties as keys to identify instances of a model:

```typespec
model User {
  @key
  id: string;

  name: string;
  email: string;
}
```

You can also specify an alternative name for the key:

```typespec
model User {
  @key("userId")
  id: string;

  name: string;
}
```

### Visibility Control

You can control when properties are visible using the `@visibility` decorator:

```typespec
model User {
  @visibility(Lifecycle.Read)
  id: string;

  @visibility(Lifecycle.Create, Lifecycle.Update)
  password: string;

  name: string; // Visible in all operations
}
```

## Property Inheritance and Overriding

When a model extends another model, it inherits all properties from the base model:

```typespec
model Person {
  id: string;
  name: string;
}

model Employee extends Person {
  employeeId: string;
  department: string;
}
```

In this example, `Employee` has the properties `id`, `name`, `employeeId`, and `department`.

## Spread Properties

You can use the spread operator (`...`) to include all properties from another model:

```typespec
model Address {
  street: string;
  city: string;
  zipCode: string;
}

model ContactInfo {
  email: string;
  phone: string;
  ...Address; // Includes all properties from Address
}
```

This is useful for composition and avoiding inheritance when it's not appropriate.

## Default Values

TypeSpec doesn't directly support declaring default values for properties in the language syntax, but this information can be captured using decorators provided by emitters.

## Best Practices

- **Use descriptive names**: Choose property names that clearly indicate the purpose or content.
- **Follow consistent casing**: Use camelCase for property names.
- **Be specific with types**: Use the most specific type that's appropriate for each property.
- **Document properties**: Use the `@doc` decorator to provide clear descriptions.
- **Use optional properties judiciously**: Only mark properties as optional if they truly might not be present.
- **Group related properties**: Keep related properties together in the model definition.
- **Apply appropriate constraints**: Use validation decorators to enforce data integrity.

By understanding how to effectively use properties, you can create detailed, precise, and well-structured models for your APIs.
