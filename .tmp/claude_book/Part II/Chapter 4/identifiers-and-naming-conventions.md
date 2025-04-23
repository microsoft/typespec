# Identifiers and Naming Conventions

Identifiers in TypeSpec are names assigned to various elements such as models, operations, properties, and namespaces. Following consistent naming conventions makes your API definitions more readable and maintainable.

## Valid Identifiers

TypeSpec identifiers follow similar rules to many programming languages:

- Must start with a letter (a-z, A-Z) or underscore (\_)
- Can contain letters, digits (0-9), and underscores
- Are case-sensitive (`User` and `user` are different identifiers)

```typespec
// Valid identifiers
model User {}
model API_Client {}
model customer2 {}

// Invalid identifiers
model 2Customer {}  // Cannot start with a digit
model User-Info {}  // Hyphen not allowed
```

## Reserved Keywords

Some words are reserved in TypeSpec and cannot be used as identifiers:

```
alias, boolean, byte, decimal, enum, extends, false, float, int, interface, model,
namespace, null, object, op, string, true, union, using, void, global, is, extern
```

If you need to use a reserved keyword as an identifier, you can use backticks:

```typespec
model Product {
  `enum`: string;
  `model`: string;
}
```

## Naming Conventions

TypeSpec follows these recommended naming conventions:

### Namespaces

- Use PascalCase (each word capitalized, no separators)
- Use descriptive names that reflect the domain

```typespec
namespace PetStore {

}
namespace PaymentProcessing {

}
```

### Models

- Use PascalCase
- Use singular nouns
- Be specific and descriptive

```typespec
model User {}
model PaymentMethod {}
model ShippingAddress {}
```

### Properties

- Use camelCase (first word lowercase, subsequent words capitalized)
- Use descriptive names that indicate the purpose or content

```typespec
model User {
  userId: string;
  firstName: string;
  emailAddress: string;
}
```

### Operations

- Use camelCase
- Use verb or verb phrases that describe the action

```typespec
op getUserById(id: string): User;
op createPayment(payment: Payment): PaymentReceipt;
op listOrders(): Order[];
```

### Enums

- Use PascalCase for enum names
- Use PascalCase for enum members

```typespec
enum OrderStatus {
  Pending,
  Processing,
  Shipped,
  Delivered,
  Cancelled,
}
```

### Interfaces

- Use PascalCase
- Consider prefixing with "I" (though this is optional)
- Use nouns or adjectives

```typespec
interface Users {
  getUser(id: string): User;
  createUser(user: User): User;
}

interface ISearchable {
  search(query: string): SearchResult[];
}
```

## Friendly Names

TypeSpec provides the `@friendlyName` decorator to specify a different name for display purposes while maintaining the original identifier in the code:

```typespec
@friendlyName("CustomerDetails")
model Customer {
  id: string;
  name: string;
}
```

## Encoded Names

For cases where the name in the API needs to differ from the TypeSpec identifier, use the `@encodedName` decorator:

```typespec
model User {
  id: string;

  @encodedName("full-name")
  fullName: string;
}
```

## Best Practices

- **Be consistent**: Follow the same naming conventions throughout your API definition.
- **Be descriptive**: Use names that clearly indicate the purpose or content.
- **Avoid abbreviations**: Unless they are widely understood in your domain.
- **Keep names concise**: Avoid overly long identifiers when possible.
- **Use domain terminology**: Align identifiers with terminology from your domain.
- **Consider API consumers**: Choose names that will make sense to developers who will use your API.

By following these naming conventions and best practices, you can create TypeSpec definitions that are more readable, maintainable, and user-friendly.
