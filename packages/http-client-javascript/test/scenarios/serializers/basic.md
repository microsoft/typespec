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
export function fooSerializer(input: Foo) {}
```
