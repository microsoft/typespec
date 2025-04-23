# Visibility Modifiers

Visibility modifiers in TypeSpec allow you to control when properties are visible in different contexts. This is particularly useful for creating models that behave differently during creation, update, and read operations.

## Understanding Visibility

In REST APIs, the same resource often has different representations depending on the operation:

- When **creating** a resource, some properties might be required while others are server-generated
- When **updating** a resource, some properties might be read-only
- When **reading** a resource, you might see all properties, including server-generated ones

TypeSpec's visibility modifiers let you define these differences within a single model.

## The @visibility Decorator

The primary tool for controlling property visibility is the `@visibility` decorator:

```typespec
@visibility(visibilityValue1, visibilityValue2, ...)
```

This decorator can be applied to model properties to specify when they should be visible.

## Lifecycle Visibility

The most common visibility context is the resource lifecycle. TypeSpec provides the `Lifecycle` enum with the following values:

- `Lifecycle.Create`: Visible when creating a resource
- `Lifecycle.Read`: Visible when reading a resource
- `Lifecycle.Update`: Visible when updating a resource
- `Lifecycle.Query`: Visible when querying for resources

Here's how to use them:

```typespec
model User {
  @visibility(Lifecycle.Read)
  id: string; // Only visible when reading (server-generated)

  name: string; // Always visible (create, read, update)
  email: string; // Always visible (create, read, update)

  @visibility(Lifecycle.Create)
  password: string; // Only visible when creating

  @visibility(Lifecycle.Read)
  createdAt: utcDateTime; // Only visible when reading (server-generated)

  @visibility(Lifecycle.Read)
  lastLogin?: utcDateTime; // Only visible when reading (server-generated)
}
```

In this example:

- `id`, `createdAt`, and `lastLogin` are only visible when reading the resource
- `password` is only visible when creating the resource
- `name` and `email` are always visible

## Multiple Visibility Values

Properties can have multiple visibility values:

```typespec
model Product {
  @visibility(Lifecycle.Read)
  id: string; // Only visible when reading

  name: string; // Always visible

  @visibility(Lifecycle.Create, Lifecycle.Update)
  categoryId: string; // Visible during creation and updates

  @visibility(Lifecycle.Read)
  createdAt: utcDateTime; // Only visible when reading
}
```

Here, `categoryId` can be specified during both creation and updates.

## Creating Context-Specific Views

TypeSpec provides built-in templates to extract properties with specific visibility:

### Create View

The `Create<T>` template extracts properties visible during creation:

```typespec
model User {
  @visibility(Lifecycle.Read)
  id: string;

  name: string;
  email: string;

  @visibility(Lifecycle.Create)
  password: string;
}

model CreateUser is Create<User>;
// Equivalent to:
// model CreateUser {
//   name: string;
//   email: string;
//   password: string;
// }
```

### Update View

The `Update<T>` template extracts properties visible during updates:

```typespec
model UpdateUser is Update<User>;
// Equivalent to:
// model UpdateUser {
//   name: string;
//   email: string;
// }
```

### Read View

The `Read<T>` template extracts properties visible during reads:

```typespec
model ReadUser is Read<User>;
// Equivalent to:
// model ReadUser {
//   id: string;
//   name: string;
//   email: string;
// }
```

## Custom Visibility Classes

Beyond the built-in `Lifecycle` contexts, you can define your own visibility classes:

```typespec
enum ApiVersion {
  V1,
  V2,
  V3,
}

model VersionedFeature {
  id: string;
  name: string;

  @visibility(ApiVersion.V2, ApiVersion.V3)
  advancedOptions: string;

  @visibility(ApiVersion.V3)
  experimentalFlag: boolean;
}
```

In this example, `advancedOptions` is only visible in V2 and V3 of the API, while `experimentalFlag` is only visible in V3.

## Removing Visibility

Sometimes you might want to remove specific visibility values:

```typespec
model BaseUser {
  @visibility(Lifecycle.Read, Lifecycle.Create)
  id: string;
}

model AdminUser extends BaseUser {
  @removeVisibility(Lifecycle.Create)
  id: string; // Now only has Lifecycle.Read visibility
}
```

## The @invisible Decorator

The `@invisible` decorator removes all visibility for a property within a specific context:

```typespec
model User {
  id: string;
  name: string;

  @invisible(Lifecycle)
  internalId: string; // Not visible in any Lifecycle context
}
```

## Default Visibility

By default, properties have visibility in all contexts. You can change this default:

```typespec
@defaultVisibility(Lifecycle.Read)
model ReadOnlyByDefault {
  id: string; // Only visible during Read
  name: string; // Only visible during Read

  @visibility(Lifecycle.Create, Lifecycle.Update)
  modifiableField: string; // Visible during Create and Update
}
```

## Filtering with Visibility

You can create filtered views of models using the `@withVisibilityFilter` decorator:

```typespec
model User {
  @visibility(Lifecycle.Read)
  id: string;

  name: string;

  @visibility(Lifecycle.Create)
  password: string;

  @visibility(ApiVersion.V2)
  preferences: UserPreferences;
}

@withVisibilityFilter(ApiVersion.V2)
model UserV2 is User;
// Contains: id, name, preferences (but not password)
```

## Common Patterns

### CRUD Resource Pattern

```typespec
model Product {
  // Read-only, server-generated properties
  @visibility(Lifecycle.Read)
  id: string;

  @visibility(Lifecycle.Read)
  createdAt: utcDateTime;

  @visibility(Lifecycle.Read)
  updatedAt: utcDateTime;

  // Always visible properties
  name: string;

  description: string;
  price: float64;

  // Create-only properties
  @visibility(Lifecycle.Create)
  categoryId: string;

  // Updateable flags
  @visibility(Lifecycle.Create, Lifecycle.Update)
  isAvailable: boolean;
}

// Views for specific operations
model CreateProduct is Create<Product>;
model ReadProduct is Read<Product>;
model UpdateProduct is Update<Product>;
```

### Multi-phase Resource Pattern

```typespec
model Reservation {
  @visibility(Lifecycle.Read)
  id: string;

  // Initial reservation phase
  startDate: plainDate;

  endDate: plainDate;
  roomType: string;

  // Confirmation phase
  @visibility(Lifecycle.Create, Lifecycle.Update)
  guestName: string;

  @visibility(Lifecycle.Create, Lifecycle.Update)
  guestEmail: string;

  // Payment phase (must be after confirmation)
  @visibility(Lifecycle.Update)
  paymentMethod: string;

  // Server-managed status
  @visibility(Lifecycle.Read)
  status: string;
}
```

## Best Practices

1. **Be explicit about visibility**: Make it clear which properties are visible in which contexts.

2. **Document visibility expectations**: Use `@doc` decorators to explain the visibility behavior.

3. **Use templates for consistent views**: Leverage `Create<T>`, `Read<T>`, and `Update<T>` for consistent views.

4. **Keep the resource model complete**: Define the full resource model with all properties and their visibility rather than creating separate models for each operation.

5. **Consider client experience**: Design visibility with the API consumer's experience in mind.

6. **Be consistent across resources**: Use similar visibility patterns across similar resources.

By effectively using visibility modifiers, you can create more flexible, intuitive, and precise API definitions that accommodate the different requirements of different operations while maintaining a single source of truth for your models.
