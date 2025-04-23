# Properties: Required and Optional

In TypeSpec models, properties can be either required or optional. Understanding how to define each type and when to use them is crucial for creating accurate API definitions.

## Required Properties

By default, all properties in a TypeSpec model are required, meaning they must be provided when creating an instance of the model.

```typespec
model User {
  id: string;
  name: string;
  email: string;
}
```

In this example, `id`, `name`, and `email` are all required properties. When this model is used in an API, all three properties must be included in requests and responses (unless otherwise specified by decorators or visibility modifiers).

## Optional Properties

To define optional properties, append a question mark (`?`) to the property name:

```typespec
model User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  address?: string;
}
```

In this example, `phoneNumber` and `address` are optional properties. They can be omitted in requests and responses without causing validation errors.

## Combining Required and Optional Properties

You'll often need to combine required and optional properties in your models:

```typespec
model Product {
  // Required properties
  id: string;

  name: string;
  price: float64;

  // Optional properties
  description?: string;

  category?: string;
  imageUrl?: string;
  tags?: string[];
}
```

## When to Use Optional Properties

Consider making properties optional in these scenarios:

1. **Truly optional data**: Information that might not be available or applicable for all instances
2. **Partial updates**: Properties that can be omitted during updates
3. **Progressive disclosure**: Information that becomes available at later stages in a resource's lifecycle
4. **Backward compatibility**: When adding new properties to existing models

## Optional Arrays

When an array property is optional, the entire array can be omitted, but if provided, it must contain valid items:

```typespec
model User {
  id: string;
  name: string;
  tags?: string[];
}
```

Here, the `tags` property can be omitted entirely, but if included, it must be an array of strings.

## Optional Object Properties

For properties that are complex objects, the optional modifier applies to the entire object:

```typespec
model Address {
  street: string;
  city: string;
  zipCode: string;
}

model User {
  id: string;
  name: string;
  address?: Address;
}
```

In this example, the entire `address` object can be omitted, but if included, it must have all the required properties of the `Address` model.

## Required vs. Optional in Different Contexts

The meaning of required and optional can vary based on the context:

1. **Creation contexts**: Required properties must be provided when creating a resource
2. **Update contexts**: Optional properties can be omitted when updating a resource
3. **Read contexts**: Required properties will always be returned when reading a resource

TypeSpec provides ways to handle these different contexts through visibility modifiers, which we'll cover in a later section.

## Common Patterns

### Creating Resources

When creating API resources, you might want different rules for the creation operation:

```typespec
model User {
  @visibility(Lifecycle.Read)
  id: string; // Server-generated, not required for creation

  name: string;
  email: string;
  bio?: string; // Optional even during creation
}
```

### Update Operations

For update operations, you typically want all properties to be optional:

```typespec
model UserUpdate {
  name?: string;
  email?: string;
  bio?: string;
}
```

Alternatively, you can use the built-in template:

```typespec
model UserUpdate is UpdateableProperties<User>;
```

## Best Practices

- **Be explicit about optionality**: Make it clear which properties are required and which are optional
- **Document the meaning**: Use `@doc` decorators to explain when optional properties should be provided
- **Consider different contexts**: Think about creation, update, and read contexts separately
- **Default wisely**: Default values (discussed in the next section) interact with optionality
- **Be consistent**: Follow a consistent pattern for similar resources in your API

By carefully considering which properties should be required and which should be optional, you can create more flexible and user-friendly APIs.
