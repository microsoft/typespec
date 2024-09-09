---
title: Examples
---

# Examples

TypeSpec provide 2 decorators `@example` and `@opExample` to provide some examples for the types and operations.
With those decorators the examples must be provided as TypeSpec values that should be assignable to the type or operation parameter/return types.

### Type Examples

To give an example for a type you can use the `@example` decorator. The decorator first argument is the example value it MUST be assignable to the type it is targetting.
Additionally a title and/or description can be provided in the options.

### Simple primitive types

```tsp
@example(#{ name: "Max", age: 3 })
model Pet {
  name: string;
  age: int32;
}
```

### Scalar types

For scalar types the value must be defined with the scalar constructor.
This allows emitters to render the example in the correct protocol following the encoding of those scalar and the values set by `@encode`.

```tsp
@example(#{
  id: "item-1",
  createdAt: plainDate.fromISO("2020-01-01T00:00:00Z"),
  timeout: duration.fromISO("PT1M"),
})
model Item {
  id: string;
  createdAt: utcDateTime;
  @encode("seconds", int32) timeout: duration;
}
```

### Provide title or description

```tsp
@example(#{ name: "Max", age: 3 }, #{ title: "Pet example", description: "Simple pet example" })
model Pet {
  name: string;
  age: int32;
}
```

### Multiple examples

```tsp
@example(#{ name: "Max", age: 3 }, #{ title: "Minimal examples", description: "Minimal examples" })
@example(
  #{ name: "Rex", age: 8, bark: true },
  #{ title: "With optional properties", description: "Example where the pet barks" }
)
model Pet {
  name: string;
  age: int32;
  bark?: boolean;
}
```

## Operation examples

Operation example are provided with the `@opExample` decorator. Similar to the `@example` decorator the first argument is the example value however it takes both the `parameters` and `returnType` example.
The values passed to `parameters` MUST be assignable to the operation parameters and the value passed to `returnType` MUST be assignable to the operation return type.
Additionally a title and/or description can be provided in the options.

:::note
Operation example will not validate additional properties as the applicable parameters might depend on the protocol and applied visibility.
:::

### Simple operation parameters

```tsp
@example(#{ parameters: #{ name: "Max", age: 3 } })
op write(name: string, age: int32): void;
```

### Simple operation return types

```tsp
@example(#{ returnType: #{ name: "Max", age: 3 } })
op read(): {
  name: string;
  age: int32;
};
```

### Specify title and/or description

```tsp
@example(
  #{ parameters: #{ name: "Max", age: 3 } },
  #{ title: "Simple write example", description: "Write a pet" }
)
op write(name: string, age: int32): void;
```
