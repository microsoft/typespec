---
id: values
title: Values
---

# Values

TypeSpec can define values in addition to types. Values are useful in an API description to define default values for types or provide example values. They are also useful when passing data to decorators, and for template parameters that are ultimately passed to decorators or used as default values.

Values cannot be used as types, and types cannot be used as values, they are completely separate. However, string, number, boolean, and null literals can be either a type or a value depending on context (see also [scalar literals](#scalar-literals)). Additionally, union and enum member references may produce a type or a value depending on context (see also [enum member &amp; union variant references](#enum-member--union-variant-references)).

## Value kinds

There are four kinds of values: objects, arrays, scalars. and null. These values can be created with object literals, array literals, scalar literals and initializers, and the null literal respectively. Additionally, values can result from referencing enum members and union variants.

### Object values

Object values use the syntax `#{}` and can define any number of properties. For example:

```typespec
const point = #{ x: 0, y: 0 };
```

The object value's properties must refer to other values. It is an error to reference a type.

```typespec
const example = #{
  prop1: #{ nested: true }; // ok
  prop2: { nested: true }; // error: values can't reference a type
  prop3: string; // error: values can't reference a type
}
```

### Array values

Array values use the syntax `#[]` and can define any number of items. For example:

```typespec
const points = #[#{ x: 0, y: 0 }, #{ x: 1, y: 1 }];
```

As with object values, array values cannot contain types.

If an array type defines a minimum and maximum size using the `@minValue` and `@maxValue` decorators, the compiler will validate that the array value has the appropriate number of items. For example:

```typespec
/** Can have at most 2 tags */
@maxItems(2)
model Tags is Array<string>;

const exampleTags1: Tags = #["TypeSpec", "JSON"]; // ok
const exampleTags2: Tags = #["TypeSpec", "JSON", "OpenAPI"]; // error
```

### Scalar values

There are two ways to create scalar values: with a literal syntax like `"string value"`, and with a scalar initializer like `utcDateTime.fromISO("2020-12-01T12:00:00Z")`.

#### Scalar literals

The literal syntax for strings, numerics, booleans and null can evaluate to either a type or a value depending on the surrounding context of the literal. When the literal is in _type context_ (a model property type, operation return type, alias definition, etc.) the literal becomes a literal type. When the literal is in _value context_ (a default value, property of an object value, const definition, etc.), the literal becomes a value. When the literal is in an _ambiguous context_ (e.g. an argument to a template or decorator that can accept either a type or a value) the literal becomes a value. The `typeof` operator can be used to convert the literal to a type in such ambiguous contexts.

```typespec
extern dec setNumberValue(target: unknown, color: valueof numeric);
extern dec setNumberType(target: unknown, color: numeric);
extern dec setNumberTypeOrValue(target: unknown, color: numeric | (valueof numeric));

@setNumberValue(123) // Passes the scalar value `numeric(123)`.
@setNumberType(123) // Passes the numeric literal type 123.
@setNumberTypeOrValue(123) // passes the scalar value `numeric(123)`.
model A {}
```

#### Scalar initializers

Scalar initializers create scalar values by calling an initializer with one or more values. Scalar initializers for types extended from `numeric`, `string`, and `boolean` are called by adding parenthesis after the scalar reference:

```typespec
const n = int8(100);
const s = string("hello");
```

Any scalar can additionally be declared with named initializers that take one or more value parameters. For example, `utcDateTime` provides a `fromISO` initializer that takes an ISO string. Named scalars can be declared like so:

```typespec
scalar ipv4 extends string {
  init fromInt(value: uint32);
}

const ip = ipv4.fromInt(2341230);
```

#### Null values

Null values are created with the `null` literal.

```typespec
const value: string | null = null;
```

The `null` value, like the `null` type, doesn't have any special behavior in the TypeSpec language. It is just the value `null` like that in JSON.

## Const declarations

Const declarations allow storing values in a variable for later reference. Const declarations have an optional type annotation. When the type annotation is absent, the type is inferred from the value by constructing an exact type from the initializer.

```typespec
const stringValue: string = "hello";
//      ^-- type: string

const oneValue = 1;
//      ^-- type: 1

const objectValue = #{ x: 0, y: 0 };
//      ^-- type: { x: 0, y: 0 }
```

## The `typeof` operator

The `typeof` operator returns the declared or inferred type of a value reference. Note that the actual value being stored by the referenced variable may be more specific than the declared type of the value. For example, if a const is declared with a union type, the value will only ever store one specific variant at a time, but typeof will give you the declared union type.

```typespec
const stringValue: string = "hello";
// typeof stringValue returns `string`.

const oneValue = 1;
// typeof stringValue returns `1`

const stringOrOneValue: string | 1 = 1;
// typeof stringOrOneValue returns `string | 1`
```

## Validation

TypeSpec will validate values against built-in validation decorators like `@minLength` and `@maxValue`.

```typespec
@maxLength(3)
scalar shortString extends string;

const s1: shortString = "abc"; // ok
const s2: shortString = "abcd"; // error:

model Entity {
  a: shortString;
}

const e1: Entity = #{ a: "abcd" } // error
```

## Enum member &amp; union variant references

References to enum members and union variants can be either types or values and follow the same rules as scalar literals. When an enum member reference is in _type context_, the reference becomes an enum member type. When in _value context_ or _ambiguous context_ the reference becomes the enum member's value.

```typespec
extern dec setColorValue(target: unknown, color: valueof string);
extern dec setColorMember(target: unknown, color: Reflection.EnumMember);

enum Color {
  red,
  green,
  blue,
}

@setColorValue(Color.red) // same as passing the literal "red"
@setColorMember(Color.red) // passes the enum member Color.red
model A {}
```

When a union variant reference is in _type context_, the reference becomes the type of the union variant. When in _value context_ or _ambiguous context_ the reference becomes the value of the union variant. It is an error to refer to a union variant whose type is not a literal type.

```typespec
extern dec setColorValue(target: unknown, color: valueof string);
extern dec setColorType(target: unknown, color: string);

union Color {
  red: "red",
  green: "green",
  blue: "blue",
  other: string,
}

@setColorValue(Color.red) // passes the scalar value `string("red")`
@setColorValue(Color.other) // error, trying to pass a type as a value.
@setColorType(Color.red) // passes the string literal type `"red"`
model A {}
```
