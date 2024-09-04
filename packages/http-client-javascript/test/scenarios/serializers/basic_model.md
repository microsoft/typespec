# Should generate a model and its serializer

## TypeSpec

```tsp
model Foo {
  name: string;
  age: int32;
}
```

## TypeScript

Should generate a type for type with name `Foo` in the `src/models/models.ts` file along with a serializer named `fooToTransport` and a deserializer named `fooToApplication` in `src/models/serializers.ts`

```ts src/models/models.ts interface Foo
export interface Foo {
  name: string;
  age: number;
}
```

```ts src/models/serializers.ts function fooToTransport
export function fooToTransport(item: Foo) {
  return {
    name: item.name,
    age: item.age,
  };
}
```

```ts src/models/serializers.ts function fooToApplication
export function fooToApplication(item: any) {
  return {
    name: item.name,
    age: item.age,
  };
}
```

# Should generate a serializer for a model with nested models

## TypeSpec

```tsp
model Bar {
  address: string;
}

model Foo {
  name: string;
  age: int32;
  bar: Bar;
}
```

## TypeScript

When a property of model `Foo` has a type of another model `Bar`, `Foo` serializer/deserializer should call the serializer/deserializer generated for `Bar`

```ts src/models/serializers.ts function fooToTransport
export function fooToTransport(item: Foo) {
  return {
    name: item.name,
    age: item.age,
    bar: barToTransport(item.bar),
  };
}
```

```ts src/models/serializers.ts function barToTransport
export function barToTransport(item: Bar) {
  return {
    address: item.address,
  };
}
```
