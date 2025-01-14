---
id: type-relations
title: Type Relations
---

## Type hierarchy

```mermaid
graph RL
    record["Record<Element>"] --> unknown
    customModel["Custom model with properties"] --> record["Record<T>"]
    array["Array<Element>"] --> unknown
    tuple["Tuple"] --> array
    numeric --> unknown
    subgraph numerics[For numeric types, a narrower type can be assigned to a wider one]
      integer --> numeric
        int8 --> integer
        int16 --> integer
        int32 --> integer
        safeint --> integer
        int64 --> integer
        uint8 --> integer
        uint16 --> integer
        uint32 --> integer
        uint64 --> integer
      float --> numeric
        float32 --> float
        float64 -->  float
      decimal --> numeric
        decimal128 --> decimal
    end
    string --> unknown
    boolean --> unknown
    null --> unknown
    bytes --> unknown
    plainDate --> unknown
    plainTime --> unknown
    zoneDateTime --> unknown
    duration --> unknown
```

## Model with properties

When determining if type `S` can be assigned to type `T`, if `T` is a model with properties, it checks whether all those properties are present in `S` and if their types can be assigned to the type of the corresponding property in `T`.

For instance,

```typespec
model T {
  foo: string;
  bar: int32;
}

// Valid

model S { // When properties types are the exact same
  foo: string;
  bar: int32;
}
model S { // When the properties types are literal assignable to the target type
  foo: "abc";
  bar: 123;
}
model S {
  foo: string;
  bar: int8; // int8 is assignable to int16
}
model S {
  foo: string;
  bar: int32;
  otherProp: boolean; // Additional properties are valid.
}

// Invalid
model S { // Missing property bar
  foo: string;
}
model S {
  foo: string;
  bar: int64; // int64 is NOT assignable to int32
}
```

## `Record<T>`

A record is a model indexed with a string with a value of T. It represents a model where all properties (string keys) are assignable to the type T. You can assign a model expression where all the properties are of type T or another model that `is` also a `Record<T>`.

```typespec
// Represent an object where all the values are int32.
alias T = Record<int32>;

// Valid
alias S = {
  foo: 123;
  bar: 345;
};
alias S = {
  foo: int8;
  bar: int32;
};
model S is Record<int32>;
model S is Record<int32> {
  foo: 123;
}

// Invalid
alias S = {
  foo: "abc";
  bar: 456;
};
alias S = {
  foo: int64;
  bar: int32;
};
model S {
  foo: 123;
  bar: 456;
}
```

#### Why isn't the last case assignable to `Record<int32>`?

In this scenario,

```typespec
alias T = Record<int32>;
model S {
  foo: 123;
  bar: 456;
}
```

The reason why `model S` is not assignable, but the model expression `{ foo: 123; bar: 456; }` is, is because model S could be extended with additional properties that might not be compatible.

For instance, if you add a new model,

```typespec
model Foo is S {
  otherProp: string;
}
```

Here, `Foo` is assignable to `S` following the [model with property logic](#model-with-properties), and if `S` was assignable to `Record<int32>`, `Foo` would also be passable. However, this is now invalid as `otherProp` is not an `int32` property.
