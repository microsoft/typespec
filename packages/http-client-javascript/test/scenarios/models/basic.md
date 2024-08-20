# Should generate a model from the global namespace

## TypeSpec

```tsp
model Widget {
  id: string;
  weight: int32;
  color: "red" | "blue";
}
```

## TypeScript

Should generate a model with name `Widget`

```ts models.ts interface Widget
export interface Widget {
  id: string;
  weight: number;
  color: "red" | "blue";
}
```

# Should generate a model from a namespace

```tsp
namespace Test {
  model TestWidget {
    id: string;
    weight: int32;
    color: "red" | "blue";
  }
}
```

## TypeScript

```ts models.ts interface TestWidget
export interface TestWidget {
  id: string;
  weight: number;
  color: "red" | "blue";
}
```

# Should generate a model from a nested namespace

```tsp
namespace Test {
  namespace Foo {
    model TestFooWidget {
      id: string;
      weight: int32;
      color: "red" | "blue";
    }
  }
}
```

## TypeScript

```ts models.ts interface TestFooWidget
export interface TestFooWidget {
  id: string;
  weight: number;
  color: "red" | "blue";
}
```

# Should generate a models with the same name in different namespaces

```tsp
namespace Test {
  namespace Foo {
    model Widget {
      id: string;
      kind: "1";
      weight: int32;
      color: "red" | "blue";
    }
  }

  model Widget {
    id: string;
    kind: "2";
    weight: int32;
    color: "red" | "blue";
  }
}
```

## TypeScript

```ts models.ts interface Widget
export interface Widget {
  id: string;
  kind: "1";
  weight: number;
  color: "red" | "blue";
}
```

The framework utomatically resolves the name conflict.

```ts models.ts interface Widget_2
export interface Widget_2 {
  id: string;
  kind: "2";
  weight: number;
  color: "red" | "blue";
}
```
