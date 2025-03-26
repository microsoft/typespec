# Should Generate a Type, Serializer, and Deserializer for a Simple Model

## TypeSpec

This TypeSpec block defines a simple model, Foo, containing two properties: name (a string) and age (an integer). The foo operation returns an instance of Foo, ensuring that the generated TypeScript code includes the correct type definitions and transformation functions.

```tsp
model Foo {
  name: string;
  age: int32;
}
op foo(): Foo;
```

## TypeScript

### Interface Definition (Foo)

The test expects a TypeScript interface Foo to be generated in src/models/models.ts, preserving the original properties from the TypeSpec definition.

```ts src/models/models.ts interface Foo
export interface Foo {
  name: string;
  age: number;
}
```

### Serializer (jsonFooToTransportTransform)

This function should correctly transform a Foo instance into a transport-friendly format, ensuring all properties are properly mapped.

```ts src/models/internal/serializers.ts function jsonFooToTransportTransform
export function jsonFooToTransportTransform(input_?: Foo | null): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    name: input_.name,
    age: input_.age,
  }!;
}
```

### Deserializer (jsonFooToApplicationTransform)

This function should correctly reconstruct a Foo instance from a transport-friendly representation, ensuring all properties are properly mapped back.

```ts src/models/internal/serializers.ts function jsonFooToApplicationTransform
export function jsonFooToApplicationTransform(input_?: any): Foo {
  if (!input_) {
    return input_ as any;
  }
  return {
    name: input_.name,
    age: input_.age,
  }!;
}
```

# Should Call Nested Serializers and Deserializers for Model Properties

## TypeSpec

This TypeSpec block defines two models, Foo and Bar, where Foo includes a nested reference to Bar. The foo operation returns either a Foo or a Bar, testing how the serialization and deserialization logic handles model properties that reference other models.

```tsp
model Bar {
  address: string;
}

model Foo {
  name: string;
  age: int32;
  bar: Bar;
}
op foo(): Foo | Bar;
```

## TypeScript

### Serializer for Foo (jsonFooToTransportTransform)

This function should transform Foo into a transport-friendly format while ensuring that the bar property is serialized using the jsonBarToTransportTransform function.

```ts src/models/internal/serializers.ts function jsonFooToTransportTransform
export function jsonFooToTransportTransform(input_?: Foo | null): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    name: input_.name,
    age: input_.age,
    bar: jsonBarToTransportTransform(input_.bar),
  }!;
}
```

### Serializer for Bar (jsonBarToTransportTransform)

This function should transform a Bar instance into its transport format, correctly mapping its properties.

```ts src/models/internal/serializers.ts function jsonBarToTransportTransform
export function jsonBarToTransportTransform(input_?: Bar | null): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    address: input_.address,
  }!;
}
```
