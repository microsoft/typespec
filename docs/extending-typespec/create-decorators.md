---
id: create-decorators
title: Decorators
---

# Decorators

TypeSpec decorators are implemented as JavaScript functions. The process of creating a decorator can be divided into two parts:

1. [Declare the decorator signature in TypeSpec](#declare-the-decorator-signature) (optional but recommended)
2. [Implement the decorator in JavaScript](#implement-the-decorator-in-javascript)

## Declare the decorator signature

While this step is optional, it offers significant benefits:

- It enables type checking for the parameters
- It provides IDE IntelliSense

You can declare a decorator signature using the `dec` keyword. Since we're implementing the decorator in JavaScript (the only option currently), we need to use the `extern` modifier as well.

```typespec
extern dec logType(target: unknown, name: string);
```

## Specifying the decorator target

The first parameter of the decorator represents the TypeSpec type(s) that the decorator can be applied to.

You can specify multiple potential target types using a `union expression`.

```typespec
using TypeSpec.Reflection;

extern dec track(target: Model | Enum);
```

## Optional parameters

You can mark a decorator parameter as optional using `?`.

```typespec
extern dec track(target: Model | Enum, name?: valueof string);
```

## Rest parameters

You can prefix the last parameter of a decorator with `...` to collect all the remaining arguments. The type of this parameter must be an `array expression`.

```typespec
extern dec track(target: Model | Enum, ...names: valueof string[]);
```

## Value parameters

A decorator parameter can receive [values](../language-basics/values.md) by using the `valueof` operator. For example the parameter `valueof string` expects a string value. Values are provided to the decorator implementation according the [decorator parameter marshalling](#decorator-parameter-marshalling) rules.

```tsp
extern dec tag(target: unknown, value: valueof string);

// error: string is not a value
@tag(string)

// ok, a string literal can be a value
@tag("widgets")

// ok, passing a value from a const
const tagName: string = "widgets";
@tag(tagName)
```

## JavaScript decorator implementation

Decorators can be implemented in JavaScript in 2 ways:

1. Prefixing the function name with `$`. e.g `export function $doc(target, name) {...}` **Great to get started/play with decorators**
2. Exporting all decorators for your library using `$decorators` variable. **Recommended**

```ts
export const $decorators = {
  // Namespace
  "MyOrg.MyLib": {
    doc: docDecoratorFn,
  },
};
```

A decorator implementation takes the following parameters:

- `1`: `context` of type `DecoratorContext`
- `2`: `target` The TypeSpec type target. (`Namespace`, `Interface`, etc.)
- `3+`: Any arguments of the decorators.

```ts
// model.ts
import type { DecoratorContext, Type } from "@typespec/compiler";

export function $logType(context: DecoratorContext, target: Type, name: string) {
  console.log(name + ": " + targetType.kind);
}
```

Or in JavaScript:

```ts
// model.js
export function $logType(context, target, name) {
  console.log(name + ": " + targetType.kind);
}
```

The decorator can then be used like this:

```typespec
// main.tsp
import "./model.js";

@logType("Dog type")
model Dog {
  @logType("Name type")
  name: string;
}
```

### Decorator parameter marshalling

When decorators are passed types, the type is passed as-is. When a decorator is passed a TypeSpec value, the decorator receives a JavaScript value with a type that is appropriate for representing that value.

:::note
This behavior depends on the value of the `valueMarshalling` [package flag](../extending-typespec/basics.md#f-set-package-flags). This section describes the behavior when `valueMarshalling` is set to `"new"`. In a future release this will become the default value marshalling so it is strongly recommended to set this flag. But for now, the default value marshalling is `"legacy"` which is described in the next section. In a future release the `valueMarshalling` flag will need to be set to `"legacy"` to keep the previous marshalling behavior, but the flag will eventually be removed entirely.
:::

| TypeSpec value type | Marshalled type in JS             |
| ------------------- | --------------------------------- |
| `string`            | `string`                          |
| `boolean`           | `boolean`                         |
| `numeric`           | `Numeric` or `number` (see below) |
| `null`              | `null`                            |
| enum member         | `EnumMemberValue`                 |

When marshalling numeric values, either the `Numeric` wrapper type is used, or a `number` is passed directly, depending on whether the value can be represented as a JavaScript number without precision loss. In particular, the types `numeric`, `integer`, `decimal`, `float`, `int64`, `uint64`, and `decimal128` are marshalled as a `Numeric` type. All other numeric types are marshalled as `number`.

When marshalling custom scalar subtypes, the marshalling behavior of the known supertype is used. For example, a `scalar customScalar extends numeric` will marshal as a `Numeric`, regardless of any value constraints that might be present.

#### Legacy value marshalling

With legacy value marshalling, TypeSpec strings, numbers, and booleans values are always marshalled as JS values. All other values are marshalled as their corresponding type. For example, `null` is marshalled as `NullType`.

| TypeSpec Value Type | Marshalled value in JS |
| ------------------- | ---------------------- |
| `string`            | `string`               |
| `numeric`           | `number`               |
| `boolean`           | `boolean`              |

Note that with legacy marshalling, because JavaScript numbers have limited range and precision, it is possible to define values in TypeSpec that cannot be accurately represented in JavaScript.

#### String templates and marshalling

If a decorator parameter type is `valueof string`, a string template passed to it will also be marshalled as a string.
The TypeSpec type system will already validate the string template can be serialized as a string.

```tsp
extern dec doc(target: unknown, name: valueof string);
alias world = "world!";
@doc("Hello ${world} ") // receive: "Hello world!"
@doc("Hello ${123} ") // receive: "Hello 123"
@doc("Hello ${true} ") // receive: "Hello true"
model Bar {}
@doc("Hello ${Bar} ") // not called error
     ^ String template cannot be serialized as a string.
```

#### Typescript type Reference

| TypeSpec Parameter Type      | TypeScript types                             |
| ---------------------------- | -------------------------------------------- |
| `valueof string`             | `string`                                     |
| `valueof numeric`            | `number`                                     |
| `valueof boolean`            | `boolean`                                    |
| `string`                     | `StringLiteral \| TemplateLiteral \| Scalar` |
| `Reflection.StringLiteral`   | `StringLiteral`                              |
| `Reflection.TemplateLiteral` | `TemplateLiteral`                            |

### Adding metadata with decorators

Decorators can be used to register some metadata. For this, you can use the `context.program.stateMap` or `context.program.stateSet` to insert data that will be tied to the current execution.

❌ Do not save the data in a global variable.

```ts file=decorators.ts
import type { DecoratorContext, Type } from "@typespec/compiler";
import type { StateKeys } from "./lib.js";

// Create a unique key
const key = StateKeys.customName;
export function $customName(context: DecoratorContext, target: Type, name: string) {
  // Keep a mapping between the target and a value.
  context.program.stateMap(key).set(target, name);

  // Keep an index of a type.
  context.program.stateSet(key).add(target);
}
```

```ts file=lib.ts
export const $lib = createTypeSpecLibrary({
  // ...
  state: {
    customName: { description: "State for the @customName decorator" },
  },
});

export const StateKeys = $lib.stateKeys;
```

### Reporting diagnostic on decorator or arguments

The decorator context provides the `decoratorTarget` and `getArgumentTarget` helpers.

```ts
import type { DecoratorContext, Type } from "@typespec/compiler";
import type { reportDiagnostic } from "./lib.js";

export function $customName(context: DecoratorContext, target: Type, name: string) {
  reportDiagnostic({
    code: "custom-name-invalid",
    target: context.decoratorTarget, // Get location of @customName decorator in TypeSpec document.
  });
  reportDiagnostic({
    code: "bad-name",
    target: context.getArgumentTarget(0), // Get location of {name} argument in TypeSpec document.
  });
}
```

## Linking declaration and implementation

Decorator signatures are linked to the implementation of the same name in the same namespace.

```typespec
import "./lib.js";
extern dec customName(target: Type, name: StringLiteral);

namespace MyLib {
  extern dec tableName(target: Type, name: StringLiteral);
}
```

This is linked to the following in `lib.js`:

```ts
export function $customName(context: DecoratorContext, name: string) {}

export function $tableName(context: DecoratorContext, name: string) {}
setTypeSpecNamespace("MyLib", $tableName);
```

## Troubleshooting

### Extern declaration must have an implementation in JS file

Potential issues:

- The JS function is not prefixed with `$`. For a decorator called `@decorate`, the JS function must be called `$decorate`.
- The JS function is not in the same namespace as the `extern dec`.
- Is the error only showing in the IDE? Try restarting the TypeSpec server or the IDE.

You can use `--trace bind.js.decorator` to log debug information about decorator loading in the JS file, which should help identify the issue.
