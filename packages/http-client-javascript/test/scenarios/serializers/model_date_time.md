# Should generate the correct properties and handle deserialization for models with utcDateTime type

Defaults to rfc7231 encoding

## TypeSpec

```tsp
model Foo {
  created_on: utcDateTime;
}
```

## TypeScript

Should generate a type for type with name `Foo` in the `src/models/models.ts` file along with a serializer named `fooToTransport` and a deserializer named `fooToApplication` in `src/models/serializers.ts`.
The generated model should have a property `createdOn` of type `Date`, the generated serializer `fooToTransport` should convert a Date into a string.

```ts src/models/models.ts interface Foo
export interface Foo {
  createdOn: Date;
}
```

```ts src/models/serializers.ts function fooToTransport
export function fooToTransport(item: Foo) {
  return {
    created_on: dateRfc3339Serializer(item.createdOn),
  };
}
```

```ts src/models/serializers.ts function fooToApplication
export function fooToApplication(item: any) {
  return {
    createdOn: dateDeserializer(item.created_on),
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

Should generate a type for type with name `Foo` in the `src/models/models.ts` file along with a serializer named `fooToTransport` and a deserializer named `fooToApplication` in `src/models/serializers.ts`.
The generated model should have a property `createdOn` of type `Date`, the generated serializer `fooToTransport` should convert a Date into a string using `toUTCString()`

```ts src/models/serializers.ts function fooToTransport
export function fooToTransport(item: Foo) {
  return {
    created_on: dateRfc3339Serializer(item.createdOn),
  };
}
```
