# Model Composition

Model composition in TypeSpec allows you to create new models by combining or extending existing ones. This promotes reusability, maintainability, and consistency in your API definitions. TypeSpec provides three main mechanisms for model composition: the spread operator, the `extends` keyword, and the `is` keyword.

## Spread Operator

The spread operator (`...`) copies all properties from one model into another. It's a simple way to include all properties from an existing model without creating an inheritance relationship.

### Basic Usage

```typespec
model Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

model ContactInfo {
  email: string;
  phone: string;
  ...Address; // Includes all properties from Address
}
```

In this example, `ContactInfo` will have all the properties from `Address` (street, city, state, zipCode) plus its own properties (email, phone).

### Property Ordering with Spread

The spread properties are inserted at the position where the spread operator appears:

```typespec
model BaseFields {
  id: string;
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
}

model Product {
  name: string;
  price: float64;
  ...BaseFields; // BaseFields properties appear here
  description: string;
}
```

The property order in `Product` will be: name, price, id, createdAt, updatedAt, description.

### Multiple Spreads

You can use the spread operator multiple times in a single model:

```typespec
model TimestampFields {
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
}

model AuditFields {
  createdBy: string;
  updatedBy: string;
}

model Document {
  id: string;
  title: string;
  ...TimestampFields;
  content: string;
  ...AuditFields;
}
```

### Property Overriding

When a model has a property with the same name as a spread property, the explicitly declared property takes precedence:

```typespec
model BaseUser {
  id: string;
  name: string;
  role: string;
}

model AdminUser {
  ...BaseUser;
  role: "admin"; // Overrides the role property from BaseUser
}
```

In `AdminUser`, the `role` property will have the fixed value `"admin"`, overriding the `string` type from `BaseUser`.

## Extends Keyword

The `extends` keyword creates an inheritance relationship between models. The derived model inherits all properties from the base model and can add its own properties.

### Basic Usage

```typespec
model Person {
  id: string;
  name: string;
  email: string;
}

model Employee extends Person {
  employeeId: string;
  department: string;
  hireDate: plainDate;
}
```

Here, `Employee` has all the properties from `Person` plus its own properties.

### Multiple Inheritance

TypeSpec does not support direct multiple inheritance with `extends`. If you need to combine properties from multiple models, use the spread operator alongside `extends`:

```typespec
model TimestampFields {
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
}

model Resource {
  id: string;
}

model Document extends Resource {
  title: string;
  content: string;
  ...TimestampFields; // Composition via spread
}
```

### Property Overriding with Extends

Similar to the spread operator, properties can be overridden in derived models:

```typespec
model BaseProduct {
  id: string;
  name: string;
  price: float64;
  isAvailable: boolean;
}

model SpecialProduct extends BaseProduct {
  price: float64 = 0; // Override with a default value
  isAvailable: boolean = true; // Override with a default value
  discountCode: string;
}
```

### Inheritance Chains

Models can form inheritance chains:

```typespec
model Resource {
  id: string;
}

model Document extends Resource {
  title: string;
  content: string;
}

model Article extends Document {
  author: string;
  publishDate: plainDate;
}
```

Each model in the chain inherits properties from all its ancestors.

## Is Keyword

The `is` keyword creates a new model that is structurally equivalent to another type. Unlike `extends`, it does not create an inheritance relationship but rather a type alias with potential modifications.

### Basic Usage

```typespec
model User {
  id: string;
  name: string;
  email: string;
}

model CustomerUser is User; // Exact same structure as User
```

### With Templates

The `is` keyword is particularly useful with templates:

```typespec
model Paginated<T> {
  items: T[];
  totalCount: int32;
  pageSize: int32;
  pageNumber: int32;
}

model UserList is Paginated<User>;
model ProductList is Paginated<Product>;
```

### With Built-in Templates

TypeSpec provides several built-in templates that can be used with `is`:

```typespec
model User {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Only include specified properties
model UserSummary is PickProperties<User, "id" | "name">;

// Make all properties optional
model UserPatch is OptionalProperties<User>;

// Omit specified properties
model PublicUser is OmitProperties<User, "id">;
```

## Combining Composition Techniques

You can combine different composition techniques for more complex scenarios:

```typespec
model BaseEntity {
  id: string;
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
}

model TimestampFields {
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
}

model AuditFields {
  createdBy: string;
  updatedBy: string;
}

// Using extends
model Resource extends BaseEntity {
  name: string;
}

// Using spread
model Document {
  id: string;
  ...TimestampFields;
  ...AuditFields;
  title: string;
  content: string;
}

// Using is with a template
model ResourceList is Paginated<Resource>;
```

## Best Practices

1. **Choose the right composition technique**:

   - Use `extends` when there's a clear inheritance relationship
   - Use spread (`...`) when you want to reuse properties without inheritance
   - Use `is` for type aliases and with templates

2. **Avoid deep inheritance hierarchies**: Deep inheritance can make models harder to understand. Consider using composition (spread) for complex scenarios.

3. **Be careful with property overrides**: When overriding properties, ensure the new type is compatible with the original.

4. **Keep base models focused**: Base models should have a clear responsibility. Don't create base models that are too generic or too specific.

5. **Document composition relationships**: When using composition, document the relationships between models to help others understand your design.

6. **Use built-in templates**: Leverage TypeSpec's built-in templates like `OptionalProperties` and `PickProperties` for common patterns.

By effectively using model composition, you can create more maintainable, consistent, and reusable API definitions with less duplication and better organization.
