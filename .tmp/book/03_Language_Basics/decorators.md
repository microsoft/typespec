# Decorators

Decorators in TypeSpec are special annotations that can be applied to models, operations, and other definitions to add metadata or modify their behavior. They provide a powerful way to enhance the functionality of your TypeSpec code without altering the underlying logic.

## Using Decorators

To use a decorator, you simply prefix your model, operation, or other definition with the decorator's name, preceded by the `@` symbol. For example:

```typespec
@doc("This model represents a pet.")
model Pet {
  name: string;
  age: uint8;
}
```

In this example, the `@doc` decorator adds documentation metadata to the `Pet` model, which can be useful for generating API documentation.

## Commonly Used Decorators

TypeSpec provides several built-in decorators that you can use to enhance your definitions. Some commonly used decorators include:

- **@service**: Used to define a service endpoint.
- **@server**: Specifies the server where the service is hosted.
- **@doc**: Adds documentation to models and operations.
- **@readonly**: Marks a property as read-only.

### Example of Using Multiple Decorators

You can apply multiple decorators to a single definition. For example:

```typespec
@service(#{ title: "Pet Store" })
@server("https://example.com")
model Pet {
  name: string;
  age: uint8;
}
```

In this example, the `Pet` model is enhanced with both the `@service` and `@server` decorators, indicating that it is part of the "Pet Store" service hosted at the specified URL.

## Creating Custom Decorators

You can also create your own custom decorators in TypeSpec. To define a custom decorator, you need to create a function that takes the appropriate parameters and applies the desired behavior. For example:

```typescript
export function myCustomDecorator(target: any) {
  // Custom logic to modify the target
}
```

Once defined, you can use your custom decorator in the same way as built-in decorators:

```typespec
@myCustomDecorator
model CustomModel {
  property: string;
}
```

## Summary

Decorators are a powerful feature in TypeSpec that allow you to add metadata and modify the behavior of your definitions. By using both built-in and custom decorators, you can enhance the functionality of your TypeSpec code and improve the overall structure of your API.

As you work with TypeSpec, remember to leverage decorators to provide additional context and functionality to your models and operations.
