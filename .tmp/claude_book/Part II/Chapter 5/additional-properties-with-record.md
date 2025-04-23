# Additional Properties with Record<T>

In TypeSpec, models have a fixed set of properties by default. However, there are cases where you need to allow additional, arbitrary properties beyond those explicitly defined. The `Record<T>` type provides a powerful way to handle these scenarios.

## Understanding Record<T>

The `Record<T>` type represents an object with string keys and values of type `T`. You can use it to define properties that can hold arbitrary key-value pairs:

```typespec
model Metadata {
  additionalInfo: Record<string>;
}
```

In this example, `additionalInfo` can hold any number of string-valued properties with any valid property names.

## Basic Usage

### Simple String Records

The most common use is `Record<string>`, which allows any string values:

```typespec
model User {
  id: string;
  name: string;
  attributes: Record<string>; // Can contain any string properties
}
```

Example instance:

```json
{
  "id": "123",
  "name": "John Doe",
  "attributes": {
    "favoriteColor": "blue",
    "preferredLanguage": "Spanish",
    "timezone": "GMT-5"
  }
}
```

### Records with Other Value Types

You can specify different value types for the record:

```typespec
model Configuration {
  stringSettings: Record<string>; // String values
  numericSettings: Record<int32>; // Integer values
  flagSettings: Record<boolean>; // Boolean values
}
```

Example instance:

```json
{
  "stringSettings": {
    "theme": "dark",
    "currency": "USD"
  },
  "numericSettings": {
    "maxRetries": 3,
    "timeout": 30
  },
  "flagSettings": {
    "enableNotifications": true,
    "darkMode": false
  }
}
```

### Records with Complex Value Types

Records can have complex value types, including models:

```typespec
model ContactInfo {
  type: string; // "phone", "email", etc.
  value: string;
  isVerified: boolean;
}

model User {
  id: string;
  name: string;
  contacts: Record<ContactInfo>; // Each key has a ContactInfo value
}
```

Example instance:

```json
{
  "id": "123",
  "name": "John Doe",
  "contacts": {
    "personal": {
      "type": "email",
      "value": "john@example.com",
      "isVerified": true
    },
    "work": {
      "type": "phone",
      "value": "+1-555-123-4567",
      "isVerified": false
    }
  }
}
```

## Common Use Cases

### Metadata and Custom Fields

`Record<T>` is ideal for metadata and custom fields that may vary per instance:

```typespec
model Product {
  id: string;
  name: string;
  price: float64;
  metadata: Record<string>; // For custom product attributes
}
```

### Feature Flags and Settings

For systems with configurable settings:

```typespec
model UserPreferences {
  id: string;
  userId: string;
  settings: Record<string | boolean | int32>; // Different types of settings
}
```

### Dynamic Data Models

When the data model may evolve or vary:

```typespec
model DynamicEntity {
  type: string;
  id: string;

  // Dynamic properties based on 'type'
  properties: Record<unknown>;
}
```

### Extensions and Integration Points

For APIs that support extensions or integrations:

```typespec
model ExtensibleResource {
  id: string;
  name: string;

  // Properties added by extensions/integrations
  extensions: Record<unknown>;
}
```

## Best Practices

### 1. Use Specific Types When Possible

Only use `Record<T>` when the property names or structure truly cannot be known in advance. For known structures, explicit model definitions provide better documentation and type safety.

### 2. Document Expected Patterns

Even with dynamic properties, document expected patterns and conventions:

```typespec
@doc("Metadata can include custom attributes. Commonly used keys include 'organization', 'department', and 'costCenter'.")
metadata: Record<string>;
```

### 3. Consider Data Validation Requirements

Remember that `Record<T>` allows any valid property names. If you need to validate the structure, you might need additional application logic.

### 4. Be Mindful of API Evolution

`Record<T>` provides flexibility but can make API changes harder to track. When possible, evolve from `Record<T>` to explicit properties as usage patterns emerge.

### 5. Balance Flexibility and Structure

Provide a balance between flexibility and structure:

```typespec
model Product {
  // Core properties that are always required
  id: string;

  name: string;
  price: float64;

  // Standard optional properties
  description?: string;

  imageUrl?: string;

  // Completely flexible custom data
  customData: Record<unknown>;
}
```

## Limitations and Considerations

1. **Validation Constraints**: TypeSpec's decorators for validation (`@minLength`, `@pattern`, etc.) cannot be applied to the dynamic properties within a `Record<T>`.

2. **Documentation Generation**: Dynamic properties may not appear in generated documentation, which can make the API harder to understand.

3. **Client Experience**: Excessive use of `Record<T>` can make the API less intuitive for clients to use, as they have less compile-time guidance.

4. **Evolution Challenges**: It can be difficult to track which dynamic properties are in use, making it challenging to evolve them into formal properties later.

By using `Record<T>` appropriately, you can create flexible API models that accommodate various use cases while still maintaining a sufficient level of structure and documentation.
