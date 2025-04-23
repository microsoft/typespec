# Creating Custom Decorators

While TypeSpec provides many built-in decorators and library-specific decorators, you can also create your own custom decorators to extend the language with domain-specific functionality, validation rules, or code generation directives.

## Why Create Custom Decorators?

Custom decorators enable you to:

1. **Capture domain-specific concepts** in your API definition
2. **Enforce organization-specific standards** and patterns
3. **Automate repetitive metadata** application
4. **Create higher-level abstractions** on top of existing decorators
5. **Add custom validation rules** specific to your domain
6. **Provide hints to custom emitters** for code generation

## Basic Decorator Definition

Custom decorators are defined using the `extern dec` syntax, followed by the decorator name, parameters, and target type:

```typespec
// A decorator that can be applied to models
extern dec customModelDecorator(target: Model): void;

// A decorator that can be applied to properties with a string parameter
extern dec customPropertyDecorator(target: ModelProperty, value: string): void;

// A decorator that can be applied to operations with optional parameters
extern dec customOperationDecorator(target: Operation, value?: string): void;
```

The `extern` keyword indicates that the implementation is provided elsewhere (typically in JavaScript code), while the declaration in TypeSpec defines the signature and target types.

## Decorator Target Types

TypeSpec provides several target types for decorators:

```typespec
// Common decorator target types
extern dec modelDecorator(target: Model): void;
extern dec propertyDecorator(target: ModelProperty): void;
extern dec operationDecorator(target: Operation): void;
extern dec parameterDecorator(target: Parameter): void;
extern dec interfaceDecorator(target: Interface): void;
extern dec namespaceDecorator(target: Namespace): void;
extern dec enumDecorator(target: Enum): void;
extern dec enumMemberDecorator(target: EnumMember): void;
extern dec unionDecorator(target: Union): void;
extern dec unionVariantDecorator(target: UnionVariant): void;
```

You can also create more generic decorators that work across multiple target types:

```typespec
// A decorator that works on both models and interfaces
extern dec documentedTypeDecorator(target: Model | Interface, value: string): void;
```

## Decorator Parameters

Decorators can accept various parameter types:

```typespec
// String parameter
extern dec stringValueDecorator(target: Model, value: string): void;

// Numeric parameter
extern dec numericValueDecorator(target: Model, value: numeric): void;

// Boolean parameter
extern dec flagDecorator(target: Model, enabled: boolean): void;

// Object parameter
extern dec metadataDecorator(target: Model, metadata: {
  name: string;
  version: string;
  description?: string;
}): void;

// Array parameter
extern dec tagsDecorator(target: Model, tags: string[]): void;

// Optional parameters
extern dec configDecorator(target: Model, primary?: string, options?: string[]): void;
```

## Named Parameters

Decorators can use named parameters for clearer invocation:

```typespec
// Decorator with named parameters
extern dec configureModel(
  target: Model,
  prefix: string,
  suffix?: string,
  options?: {
    caseSensitive?: boolean;
    visibility?: string;
  }
): void;
```

This allows for more readable invocations:

```typespec
@configureModel(prefix: "Api", suffix: "Model", options: { caseSensitive: true })
model User {
  // ...
}
```

## Decorator Implementation

While the TypeSpec definition declares the decorator's signature, the actual implementation is written in JavaScript or TypeScript. This implementation typically involves:

1. Processing the decorator's parameters
2. Validating the target and parameters
3. Adding metadata to the target
4. Performing any additional logic

TypeSpec provides an API for working with the language model, allowing decorator implementations to:

- Read and write metadata on types
- Validate constraints
- Generate diagnostics
- Influence code generation

## Decorator Libraries

Related decorators are often grouped into libraries that can be imported and used together:

```typespec
// Define a custom decorator library
namespace MyCompany.Decorators {
  extern dec resourceType(target: Model, type: string): void;
  extern dec resourceAction(target: Operation, action: string): void;
  extern dec resourceKey(target: ModelProperty): void;
}
```

These can then be used in TypeSpec code:

```typespec
import "./my-company-decorators.js";
using MyCompany.Decorators;

@resourceType("user")
model User {
  @resourceKey
  id: string;

  name: string;
}

interface Users {
  @resourceAction("list")
  list(): User[];

  @resourceAction("get")
  get(id: string): User;
}
```

## Decorator Composition

Custom decorators can build upon built-in or other custom decorators:

```typespec
// Define a composite decorator
namespace MyCompany.Decorators {
  extern dec apiResource(target: Model, resourceName: string): void;
  // Implementation might apply multiple decorators like @resource, @key, etc.
}
```

This allows for higher-level abstractions that encapsulate common patterns:

```typespec
@apiResource("user")
model User {
  id: string;
  name: string;
  email: string;
}
```

## Decorator Options Pattern

For complex decorators with many options, an options object pattern is recommended:

```typespec
namespace MyCompany.Decorators {
  model ResourceOptions {
    name: string;
    pluralName?: string;
    versioned?: boolean;
    audited?: boolean;
    softDelete?: boolean;
  }

  extern dec resource(target: Model, options: ResourceOptions): void;
}
```

Usage:

```typespec
@resource({
  name: "user",
  pluralName: "users",
  versioned: true,
  audited: true,
})
model User {
  // ...
}
```

## Custom Constraint Decorators

You can create custom constraint decorators for domain-specific validation:

```typespec
namespace MyCompany.Validations {
  extern dec uuid(target: ModelProperty): void;
  extern dec emailAddress(target: ModelProperty): void;
  extern dec phoneNumber(target: ModelProperty, format?: string): void;
  extern dec countryCode(target: ModelProperty): void;
  extern dec postalCode(target: ModelProperty, country?: string): void;
}
```

These can then be applied to properties:

```typespec
model Contact {
  @uuid
  id: string;

  @emailAddress
  email: string;

  @phoneNumber("international")
  phone: string;

  @countryCode
  country: string;

  @postalCode
  zipCode: string;
}
```

## Custom Documentation Decorators

You can create custom documentation decorators for organizational standards:

```typespec
namespace MyCompany.Documentation {
  extern dec owner(target: Model | Interface | Operation, teamName: string): void;
  extern dec sla(target: Operation, responseTime: string): void;
  extern dec internal(target: Model | Interface | Operation): void;
  extern dec externalDocumentation(target: Model | Interface | Operation, url: string): void;
}
```

Usage:

```typespec
@owner("Identity Team")
@internal
model User {
  // ...
}

@route("/users")
interface Users {
  @sla("99.9% within 300ms")
  @externalDocumentation("https://wiki.example.com/api/users/get")
  get(id: string): User;
}
```

## Best Practices for Custom Decorators

1. **Be specific about targets**: Clearly define what types your decorator can be applied to.
2. **Validate parameters**: Ensure decorator parameters are validated properly in the implementation.
3. **Provide meaningful errors**: When validation fails, provide clear error messages.
4. **Document decorators**: Include documentation for each decorator explaining its purpose, parameters, and usage.
5. **Follow naming conventions**: Use consistent naming patterns for related decorators.
6. **Group related decorators**: Organize related decorators into logical namespaces.
7. **Consider reusability**: Design decorators to be reusable across different projects.
8. **Test thoroughly**: Create test cases that verify your decorators work as expected.
9. **Consider backward compatibility**: When evolving decorators, maintain compatibility with existing code.
10. **Layer appropriately**: Create higher-level decorators that build on lower-level ones for complex patterns.

## Example: Complete Custom Decorator Library

Here's an example of a custom decorator library for an e-commerce domain:

```typespec
namespace ECommerce.Decorators {
  // Resource type decorators
  extern dec product(target: Model): void;
  extern dec category(target: Model): void;
  extern dec order(target: Model): void;
  extern dec customer(target: Model): void;

  // Property constraints
  extern dec price(target: ModelProperty): void;
  extern dec currency(target: ModelProperty): void;
  extern dec sku(target: ModelProperty): void;

  // Permissions
  model Permission {
    admin?: boolean;
    customer?: boolean;
    seller?: boolean;
    support?: boolean;
  }

  extern dec permissions(target: Operation, permissions: Permission): void;

  // Caching
  extern dec cacheable(target: Operation, durationSeconds: int32): void;
}
```

Usage:

```typespec
using ECommerce.Decorators;

@product
model Product {
  @key
  id: string;

  name: string;
  description: string;

  @sku
  productCode: string;

  @price
  basePrice: decimal;

  @currency
  priceCurrency: string;

  categoryId: string;
}

@route("/products")
interface Products {
  @get
  @cacheable(300) // Cache for 5 minutes
  @permissions({
    customer: true,
    seller: true,
    admin: true,
  })
  list(): Product[];

  @get
  @route("/{id}")
  @cacheable(60) // Cache for 1 minute
  @permissions({
    customer: true,
    seller: true,
    admin: true,
  })
  get(id: string): Product;

  @post
  @permissions({
    seller: true,
    admin: true,
  })
  create(@body product: Product): Product;

  @put
  @route("/{id}")
  @permissions({
    seller: true,
    admin: true,
  })
  update(id: string, @body product: Product): Product;
}
```

By creating custom decorators, you can extend TypeSpec with domain-specific concepts, organizational standards, and specialized behaviors that make your API definitions more precise, consistent, and expressive.
