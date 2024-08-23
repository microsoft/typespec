# Should generate the correct properties and handle deserialization for models with different client than wire names

## TypeSpec

```tsp
model Foo {
  element_name: string;
  age: int32;
}
```

## TypeScript

Should generate a type for type with name `Foo` in the `models.ts` file along with a serializer named `fooSerializer` and a deserializer named `fooDeserializer` in `serializers.ts`.
The generated model should have property names using camelCasing. Serializer should return these properties with the same name defined in the spec while the deserializer
should return these properties with the same name as the generated model (camelCase)

```ts models.ts interface Foo
export interface Foo {
  elementName: string;
  age: number;
}
```

```ts serializers.ts function fooSerializer
export function fooSerializer(item: Foo) {
  return {
    element_name: item.elementName,
    age: item.age,
  };
}
```

```ts serializers.ts function fooDeserializer
export function fooDeserializer(item: any) {
  return {
    elementName: item.element_name,
    age: item.age,
  };
}
```
