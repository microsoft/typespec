# Should generate the correct properties and handle deserialization for models with utcDateTime type

Defaults to rfc7231 encoding

## TypeSpec

```tsp
model Foo {
  created_on: utcDateTime;
}
```

## TypeScript

Should generate a type for type with name `Foo` in the `src/models/models.ts` file along with a serializer named `fooSerializer` and a deserializer named `fooDeserializer` in `src/models/serializers.ts`.
The generated model should have a property `createdOn` of type `Date`, the generated serializer `fooSerializer` should convert a Date into a string.

```ts src/models/models.ts interface Foo
export interface Foo {
  createdOn: Date;
}
```

```ts src/models/serializers.ts function fooSerializer
export function fooSerializer(item: Foo) {
  return {
    created_on: item.createdOn.toISOString(),
  };
}
```

```ts src/models/serializers.ts function fooDeserializer
export function fooDeserializer(item: any) {
  return {
    createdOn: new Date(item.created_on),
  };
}
```

# Should generate the correct properties and handle deserialization for models with utcDateTime type with rfc7231 encoding

## TypeSpec

```tsp
model Foo {
  @encode("rfc7231")
  created_on: utcDateTime;
}
```

## TypeScript

Should generate a type for type with name `Foo` in the `src/models/models.ts` file along with a serializer named `fooSerializer` and a deserializer named `fooDeserializer` in `src/models/serializers.ts`.
The generated model should have a property `createdOn` of type `Date`, the generated serializer `fooSerializer` should convert a Date into a string using `toUTCString()`

```ts src/models/serializers.ts function fooSerializer
export function fooSerializer(item: Foo) {
  return {
    created_on: item.createdOn.toUTCString(),
  };
}
```
