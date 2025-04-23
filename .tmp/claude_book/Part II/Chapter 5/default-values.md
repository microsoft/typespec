# Default Values

Default values in TypeSpec allow you to specify the value a property should have when not explicitly provided. This feature is particularly useful for optional properties where you want to ensure a fallback value.

## Syntax for Default Values

To specify a default value for a property, use the `=` operator followed by the default value:

```typespec
model User {
  id: string;
  name: string;
  isActive: boolean = true;
  role: string = "user";
  createdAt: utcDateTime = utcDateTime.now();
}
```

In this example:

- `isActive` defaults to `true`
- `role` defaults to the string `"user"`
- `createdAt` defaults to the current UTC datetime

## Default Values with Optional Properties

Default values can be combined with optional properties:

```typespec
model Product {
  id: string;
  name: string;
  quantity?: int32 = 1;
  isAvailable?: boolean = true;
}
```

When a property is both optional and has a default value:

1. If the property is not provided in the input, the default value is used
2. If the property is explicitly set to `null` or `undefined`, the default is not applied

## Types of Default Values

TypeSpec supports default values for various types:

### Scalar Types

```typespec
model Example {
  stringProp: string = "default text";
  intProp: int32 = 42;
  floatProp: float64 = 3.14;
  boolProp: boolean = false;
}
```

### Enum Values

```typespec
enum Color {
  Red,
  Green,
  Blue,
}

model Theme {
  primaryColor: Color = Color.Blue;
}
```

### Date and Time Values

```typespec
model Timestamp {
  created: utcDateTime = utcDateTime.now();
  validUntil: utcDateTime = utcDateTime.fromISO("2025-12-31T23:59:59Z");
}
```

### Array Defaults

```typespec
model Tags {
  categories: string[] = ["default"];
}
```

Note that array defaults should be used cautiously, as they behave as static values in generated code.

## Expression Values

TypeSpec supports various expressions for default values:

### String Templates

```typespec
const version = "1.0";
model ApiInfo {
  apiVersion: string = `v${version}`;
}
```

### Arithmetic Expressions

```typespec
const basePrice = 10;
model Pricing {
  standardPrice: float64 = basePrice;
  premiumPrice: float64 = basePrice * 2;
  enterprisePrice: float64 = basePrice * 5;
}
```

## Default Values with Model Composition

When using model composition, default values from the base model are preserved:

```typespec
model BaseUser {
  isActive: boolean = true;
  role: string = "user";
}

model AdminUser extends BaseUser {
  role: string = "admin"; // Overrides the default from BaseUser
}
```

In this example, `AdminUser` inherits the `isActive` property with its default value, but overrides the default value for `role`.

## Default Values and Spread Operator

When using the spread operator, default values are included:

```typespec
model Defaults {
  prop1: string = "default";
  prop2: int32 = 42;
}

model WithDefaults {
  ...Defaults;
  prop3: boolean = true;
}
```

The `WithDefaults` model will have all three properties with their respective default values.

## When to Use Default Values

Consider using default values in these scenarios:

1. **Common configurations**: When a property has a common or recommended value
2. **Reducing client complexity**: To minimize the properties clients need to specify
3. **Backward compatibility**: When adding new properties to existing models
4. **Progressive rollout**: To enable new features with safe defaults

## Best Practices

- **Use meaningful defaults**: Defaults should represent a reasonable value for most use cases
- **Document the defaults**: Make default values clear in your documentation
- **Be consistent**: Use similar defaults for similar properties across models
- **Consider context**: Different default values may be appropriate in different contexts
- **Don't use defaults as a substitute for required properties**: If a property must have a specific value, consider making it required instead

By effectively using default values, you can make your API more user-friendly while still maintaining flexibility and control.
