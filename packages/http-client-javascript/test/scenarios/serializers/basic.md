# Should generate a model and its serializer

## TypeSpec

```tsp
model Foo {
  name: string;
  age: int32;
}
```

## TypeScript

Should generate a type for type with name `Foo`

```ts models.ts interface Foo
export interface Foo {
  name: string;
  age: number;
}
```

should generate a serializer for the model

```ts serializers.ts function fooSerializer
export function fooSerializer(input: Foo) {
  return {
    name: input.name,
    age: input.age,
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

Should generate one serializer per model and use the serializer function for a model property

```ts serializers.ts function fooSerializer
export function fooSerializer(input: Foo) {
  return {
    name: input.name,
    age: input.age,
    bar: barSerializer(input.bar),
  };
}
```

```ts serializers.ts function barSerializer
export function barSerializer(input: Bar) {
  return {
    address: input.address,
  };
}
```
