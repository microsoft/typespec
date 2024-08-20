# Should generate a type declaration for a basic enum

## TypeSpec

```tsp
enum Foo {
  one,
  two,
  three,
}
```

## TypeScript

Should generate a type for type with name `Foo`

```ts models.ts type Foo
export type Foo = "one" | "two" | "three";
```

# Should generate a type declaration for an enum with named values

## TypeSpec

```tsp
enum Foo {
  one: "ONE",
  two: "TWO",
  three: "THREE",
}
```

## TypeScript

Should generate a type for a type with name `Foo`

```ts models.ts type Foo
export type Foo = "ONE" | "TWO" | "THREE";
```
