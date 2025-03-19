# Should generate the correct properties and handle deserialization for models with different client than wire names

## TypeSpec

```tsp
model Foo {
  element_name: string;
  age: int32;
}
op foo(): Foo;
```

## TypeScript

Should generate a type for type with name `Foo` in the `src/models/models.ts` file along with a serializer named `jsonFooToTransportTransform` and a deserializer named `jsonFooToApplicationTransform` in `src/models/serializers.ts`.
The generated model should have property names using camelCasing. Serializer should return these properties with the same name defined in the spec while the deserializer
should return these properties with the same name as the generated model (camelCase)

```ts src/models/models.ts interface Foo
export interface Foo {
  elementName: string;
  age: number;
}
```

```ts src/models/serializers.ts function jsonFooToTransportTransform
export function jsonFooToTransportTransform(input_?: Foo | null): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    element_name: input_.elementName,
    age: input_.age,
  }!;
}
```

```ts src/models/serializers.ts function jsonFooToApplicationTransform
export function jsonFooToApplicationTransform(input_?: any): Foo {
  if (!input_) {
    return input_ as any;
  }
  return {
    elementName: input_.element_name,
    age: input_.age,
  }!;
}
```
