# skip:Should generate the correct properties and handle deserialization for models with utcDateTime type

Defaults to rfc7231 encoding

## TypeSpec

```tsp
model Foo {
  created_on: utcDateTime;
}

op foo(): Foo;
```

## TypeScript

Should generate a type for type with name `Foo` in the `src/models/models.ts` file along with a serializer named `jsonFooToTransportTransform` and a deserializer named `jsonFooToApplicationTransform` in `src/models/internal/serializers.ts`.
The generated model should have a property `createdOn` of type `Date`, the generated serializer `jsonFooToTransportTransform` should convert a Date into a string.

```ts src/models/models.ts interface Foo
export interface Foo {
  createdOn: Date;
}
```

```ts src/models/internal/serializers.ts function jsonFooToTransportTransform
export function jsonFooToTransportTransform(item: Foo): any {
  return {
    created_on: dateRfc3339Serializer(item.createdOn),
  };
}
```

```ts src/models/internal/serializers.ts function jsonFooToApplicationTransform
export function jsonFooToApplicationTransform(item: any): Foo {
  return {
    createdOn: dateDeserializer(item.created_on),
  };
}
```

# skip:Should generate the correct properties and handle deserialization for models with utcDateTime type with rfc7231 encoding

## TypeSpec

```tsp
model Foo {
  @encode("rfc7231")
  created_on: utcDateTime;
}
op foo(): Foo;
```

## TypeScript

Should generate a type for type with name `Foo` in the `src/models/models.ts` file along with a serializer named `jsonFooToTransportTransform` and a deserializer named `jsonFooToApplicationTransform` in `src/models/internal/serializers.ts`.
The generated model should have a property `createdOn` of type `Date`, the generated serializer `jsonFooToTransportTransform` should convert a Date into a string using `toUTCString()`

```ts src/models/internal/serializers.ts function jsonFooToTransportTransform
export function jsonFooToTransportTransform(item: Foo): any {
  return {
    created_on: dateRfc7231Serializer(item.createdOn),
  };
}
```
