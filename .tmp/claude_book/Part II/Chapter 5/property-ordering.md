# Property Ordering

The order of properties in TypeSpec models can impact how the models are interpreted and generated in various outputs. Understanding property ordering helps create more consistent and predictable API designs.

## Default Ordering Behavior

By default, properties in TypeSpec models are ordered as they appear in the model definition:

```typespec
model User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}
```

In this example, the properties will be ordered exactly as defined: `id`, `firstName`, `lastName`, `email`, and `phone`.

## Significance of Property Order

Property order can be significant in several contexts:

1. **Generated Documentation**: The order of properties affects how they appear in generated documentation, which impacts readability and user understanding.

2. **Generated Code**: In some target languages or frameworks, property order can affect serialization or deserialization behavior.

3. **Client Experience**: A logical property order makes APIs more intuitive for consumers, especially for complex models with many properties.

4. **Consistency**: Consistent ordering across related models provides a more cohesive API design.

## Strategic Property Ordering

Consider ordering properties strategically:

```typespec
model User {
  // Identity properties first
  id: string;

  username: string;

  // Basic information
  firstName: string;

  lastName: string;
  email: string;
  phone: string;

  // Additional details
  address: Address;

  preferences: UserPreferences;

  // Metadata at the end
  createdAt: utcDateTime;

  updatedAt: utcDateTime;
  isActive: boolean;
}
```

This ordering makes the model more readable by grouping related properties together.

## Property Order with Model Composition

When using model composition with the `extends` keyword, properties from the base model appear before properties from the derived model:

```typespec
model BaseUser {
  id: string;
  username: string;
}

model DetailedUser extends BaseUser {
  firstName: string;
  lastName: string;
}
```

In `DetailedUser`, the properties will be ordered as: `id`, `username`, `firstName`, `lastName`.

## Property Order with Spread Operator

When using the spread operator, the properties from the spread model are inserted at the position of the spread:

```typespec
model ContactInfo {
  email: string;
  phone: string;
}

model User {
  id: string;
  username: string;
  ...ContactInfo;
  address: Address;
}
```

In this example, the property order will be: `id`, `username`, `email`, `phone`, `address`.

## Overriding Properties and Order

When overriding properties (either through extension or spread), the position of the original property is maintained:

```typespec
model BaseUser {
  id: string;
  name: string;
  email: string;
}

model AdminUser extends BaseUser {
  name: string; // Override
  role: string; // New property
}
```

In `AdminUser`, the property order will still be: `id`, `name`, `email`, `role`, with `name` keeping its position from the base model.

## Best Practices for Property Ordering

1. **Group related properties**: Keep related properties together for better readability.

2. **Put identifying properties first**: Start with properties that identify the resource.

3. **Follow a consistent pattern**: Use the same ordering pattern across similar models.

4. **Consider operation contexts**: Order properties based on how they're most commonly used in operations.

5. **Place metadata at the end**: Properties like timestamps, status flags, or audit fields often make sense at the end.

## Example: Consistent Order Pattern

```typespec
// A consistent ordering pattern across resources
model User {
  // Identity (always first)
  id: string;

  // Core properties (specific to the resource)
  name: string;

  email: string;

  // Relationships (references to other resources)
  roleId: string;

  teamIds: string[];

  // Status and flags
  isActive: boolean;

  status: UserStatus;

  // Metadata (always last)
  createdAt: utcDateTime;

  updatedAt: utcDateTime;
}

model Team {
  // Identity (always first)
  id: string;

  // Core properties (specific to the resource)
  name: string;

  description: string;

  // Relationships (references to other resources)
  memberIds: string[];

  // Status and flags
  isPrivate: boolean;

  status: TeamStatus;

  // Metadata (always last)
  createdAt: utcDateTime;

  updatedAt: utcDateTime;
}
```

By following consistent property ordering patterns, you create more maintainable and understandable API definitions that provide a better experience for API consumers.
