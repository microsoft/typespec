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

Should generate a type for type with name `Foo` in the `src/models/models.ts` file along with a serializer named `fooToTransport` and a deserializer named `fooToApplication` in `src/models/serializers.ts`.
The generated model should have property names using camelCasing. Serializer should return these properties with the same name defined in the spec while the deserializer
should return these properties with the same name as the generated model (camelCase)

```ts src/models/models.ts interface Foo
export interface Foo {
  elementName: string;
  age: number;
}
```

```ts src/models/serializers.ts function fooToTransport
export function fooToTransport(item: Foo) {
  return {
    element_name: item.elementName,
    age: item.age,
  };
}
```

```ts src/models/serializers.ts function fooToApplication
export function fooToApplication(item: any) {
  return {
    elementName: item.element_name,
    age: item.age,
  };
}
```
