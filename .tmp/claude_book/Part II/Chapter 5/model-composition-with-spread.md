# Model Composition with Spread

Model composition in TypeSpec allows you to create new models by combining the properties from existing models. The primary mechanism for this is the spread operator (`...`), which provides a powerful way to reuse and compose model definitions.

## Understanding the Spread Operator

The spread operator (`...`) lets you include all properties from one model into another. When you spread a model, all of its properties are copied into the target model:

```typespec
model Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

model ContactInfo {
  email: string;
  phone: string;
  ...Address; // Includes all properties from Address
}
```

In this example, `ContactInfo` will have all properties from `Address` (street, city, state, zipCode, country) as well as its own properties (email, phone).

## Composition vs. Inheritance

While inheritance (using `extends`) establishes an "is-a" relationship, composition with spread establishes a "has-all" relationship. The key differences are:

- **Inheritance**: The derived model is a specialized version of the base model, suitable for true hierarchical relationships.
- **Composition**: The composed model simply contains properties from other models, without implying a type relationship.

Composition is often preferred when you want to reuse properties without establishing a hierarchical relationship:

```typespec
model Address {
  street: string;
  city: string;
  zipCode: string;
}

// Inheritance approach - implies a Customer IS-A Address (usually not correct)
model Customer extends Address {
  name: string;
  email: string;
}

// Composition approach - Customer HAS-ALL properties from Address
model BetterCustomer {
  name: string;
  email: string;
  ...Address; // More semantically correct
}
```

## Spreading Multiple Models

You can spread multiple models in a single definition:

```typespec
model PersonalInfo {
  name: string;
  age: int32;
  dateOfBirth: utcDateTime;
}

model Address {
  street: string;
  city: string;
  zipCode: string;
}

model ContactInfo {
  email: string;
  phone: string;
}

model UserProfile {
  id: string;
  ...PersonalInfo; // Spreads all properties from PersonalInfo
  ...Address; // Spreads all properties from Address
  ...ContactInfo; // Spreads all properties from ContactInfo
  lastLogin: utcDateTime;
}
```

This creates a flattened model with all properties from the spread models, plus any properties defined directly in the model.

## Property Conflicts

When spreading models, property name conflicts can occur. The resolution follows these rules:

1. Properties defined directly in the model take precedence over spread properties.
2. Properties from later spreads override properties from earlier spreads with the same name.

```typespec
model BaseInfo {
  id: string;
  name: string;
  description: string;
}

model ExtraInfo {
  name: string; // Will override BaseInfo.name
  category: string;
}

model Product {
  ...BaseInfo; // Spreads id, name, description
  ...ExtraInfo; // Spreads name (overrides BaseInfo.name), category
  description: string; // Overrides BaseInfo.description
}
```

In this example, `Product` will have:

- `id` from `BaseInfo`
- `name` from `ExtraInfo` (overriding `BaseInfo.name`)
- `description` from the direct property (overriding `BaseInfo.description`)
- `category` from `ExtraInfo`

## Spreading and Decorators

When spreading models, property decorators are not always preserved. If you need specific decorators on properties in the composed model, consider adding them directly:

```typespec
model BaseInfo {
  id: string;

  @minLength(3)
  name: string;
}

model Product {
  ...BaseInfo;
  @minLength(5) // Need to reapply constraint
  name: string; // Override with own constraints
}
```

## Conditional Inclusion with Templates and Spread

You can combine templates and spread operators for powerful conditional inclusion patterns:

```typespec
model BaseResource<T> {
  id: string;
  ...T; // Spread whatever template type is provided
}

model Metadata {
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
}

model User is BaseResource<Metadata> {
  name: string;
  email: string;
}
```

## Achieving Multiple Inheritance with Spread

While TypeSpec doesn't support multiple inheritance directly with `extends`, you can approximate it using the spread operator:

```typespec
model Entity {
  id: string;
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
}

model Auditable {
  createdBy: string;
  updatedBy: string;
}

// Similar to "class User extends Entity, Auditable" in other languages
model User {
  ...Entity;
  ...Auditable;
  name: string;
  email: string;
}
```

## Partial Spreading

TypeSpec doesn't directly support spreading only select properties, but you can achieve this by using intermediate models:

```typespec
model Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

model DomesticAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

model InternationalContact {
  name: string;
  email: string;
  ...DomesticAddress;
  country: string;
}
```

## Best Practices

- **Use spread for composition**: Use the spread operator to combine properties without implying an "is-a" relationship.
- **Be aware of property conflicts**: Pay attention to property name conflicts when spreading multiple models.
- **Consider naming conventions**: To avoid conflicts, consider prefixing property names in models that are likely to be spread.
- **Document spread behaviors**: Comment your code to explain the purpose of spreading specific models.
- **Be consistent**: Establish patterns for how you use spread across your API design.
- **Favor readability**: Complex compositions with multiple spreads can become hard to understand. Structure your models to keep the code readable.
- **Use inheritance for true "is-a" relationships**: Reserve inheritance for when the derived model is genuinely a specialized version of the base model.

By mastering model composition with the spread operator, you can create flexible, reusable model definitions while maintaining clean, well-structured API designs.
