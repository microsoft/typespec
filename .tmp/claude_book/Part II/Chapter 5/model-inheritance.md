# Model Inheritance

Model inheritance in TypeSpec allows you to create new models that build upon existing ones, inheriting their properties and behaviors. This powerful feature promotes code reuse, consistency, and organization in your API definitions.

## Basic Inheritance Syntax

To create a model that inherits from another, use the `extends` keyword:

```typespec
model Resource {
  id: string;
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
}

model User extends Resource {
  name: string;
  email: string;
}
```

In this example, the `User` model inherits all properties from the `Resource` model and adds its own properties. An instance of `User` will have the properties `id`, `createdAt`, `updatedAt`, `name`, and `email`.

## Multiple Base Models

Unlike some programming languages, TypeSpec does not support direct multiple inheritance with the `extends` keyword. A model can only extend a single base model.

However, you can achieve similar functionality using the spread operator (discussed in more detail in the next section).

## Inheritance Chain

Models can form an inheritance chain, where each model extends the previous one:

```typespec
model Resource {
  id: string;
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
}

model Person extends Resource {
  name: string;
  email: string;
  dateOfBirth?: utcDateTime;
}

model Employee extends Person {
  employeeId: string;
  department: string;
  hireDate: utcDateTime;
}
```

In this example, `Employee` inherits from `Person`, which inherits from `Resource`. An instance of `Employee` will have all properties from all three models.

## Inheritance vs. Composition

While inheritance establishes an "is-a" relationship (an Employee is a Person), composition establishes a "has-a" relationship (a User has an Address). Both approaches have their place in model design:

```typespec
// Inheritance: "is-a" relationship
model Person {
  name: string;
  email: string;
}

model Employee extends Person {
  employeeId: string;
  department: string;
}

// Composition: "has-a" relationship
model Address {
  street: string;
  city: string;
  zipCode: string;
}

model User {
  id: string;
  name: string;
  homeAddress: Address;
  workAddress?: Address;
}
```

## Overriding Property Decorators

When extending a model, you can add decorators to inherited properties:

```typespec
model Resource {
  id: string;
  name: string;
}

model RestrictedResource extends Resource {
  @minLength(5)
  @maxLength(50)
  name: string; // Same property from Resource, but with constraints
}
```

This allows you to refine the properties inherited from the base model.

## Discriminated Models

For polymorphic scenarios where you need to distinguish between different model types, you can use the `@discriminator` decorator:

```typespec
@discriminator("kind")
model Pet {
  kind: string;
  name: string;
  age: int32;
}

model Dog extends Pet {
  kind: "dog";
  breed: string;
  bark: boolean;
}

model Cat extends Pet {
  kind: "cat";
  color: string;
  meow: boolean;
}
```

The `@discriminator` decorator specifies which property should be used to determine the concrete type of a model at runtime. This is essential for polymorphic models in APIs.

## Visibility in Inheritance

Visibility decorators on properties are inherited and can be refined in derived models:

```typespec
model Resource {
  @visibility(Lifecycle.Read)
  id: string;

  name: string;
}

model User extends Resource {
  @visibility(Lifecycle.Read, Lifecycle.Create)
  id: string; // Now also visible in Create operations

  email: string;
}
```

## Inheritance and Templates

Inheritance works with template models as well:

```typespec
model Resource<T> {
  id: string;
  metadata: T;
}

model UserResource extends Resource<UserMetadata> {
  name: string;
  email: string;
}

model UserMetadata {
  createdBy: string;
  createdAt: utcDateTime;
}
```

## Best Practices

- **Use inheritance for true "is-a" relationships**: Only use inheritance when the derived model is a specialized version of the base model.
- **Keep inheritance chains shallow**: Deep inheritance hierarchies can become difficult to understand and maintain.
- **Favor composition over inheritance** when appropriate: Use models as property types rather than extending models if the relationship is "has-a" rather than "is-a".
- **Ensure base models are stable**: Changes to base models affect all derived models, so they should be well-designed and stable.
- **Document the inheritance hierarchy**: Use comments or documentation to explain the purpose and relationship of models in an inheritance chain.
- **Use discriminated models** for polymorphic scenarios: When different model types need to be distinguished at runtime, use the `@discriminator` pattern.
- **Be consistent** with inheritance patterns across your API: Establish and follow consistent conventions for inheritance in your API design.

By effectively using model inheritance, you can create well-structured, reusable, and maintainable data definitions for your APIs that accurately reflect the domain relationships.
