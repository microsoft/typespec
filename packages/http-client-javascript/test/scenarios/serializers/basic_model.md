# Should generate a model and its serializer

## TypeSpec

```tsp
model Foo {
  name: string;
  age: int32;
}
```

## TypeScript

Should generate a type for type with name `Foo` in the `models.ts` file along with a serializer named `fooSerializer` and a deserializer named `fooDeserializer` in `serializers.ts`

```ts models.ts interface Foo
export interface Foo {
  name: string;
  age: number;
}
```

```ts serializers.ts function fooSerializer
export function fooSerializer(item: Foo) {
  return {
    name: item.name,
    age: item.age,
  };
}
```

```ts serializers.ts function fooDeserializer
export function fooDeserializer(item: any) {
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

```ts serializers.ts function fooSerializer
export function fooSerializer(item: Foo) {
  return {
    name: item.name,
    age: item.age,
    bar: barSerializer(item.bar),
  };
}
```

```ts serializers.ts function barSerializer
export function barSerializer(item: Bar) {
  return {
    address: item.address,
  };
}
```
