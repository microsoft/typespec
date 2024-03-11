---
id: create-decorators
title: How to create TypeSpec decorators
---

# How to create TypeSpec decorators

TypeSpec decorators are implemented as JavaScript functions. The process of creating a decorator can be divided into two parts:

1. [(Optional) Declare the decorator signature in TypeSpec](#declare-the-decorator-signature)
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

### Optional parameters

You can mark a decorator parameter as optional using `?`.

```typespec
extern dec track(target: Model | Enum, name?: valueof string);
```

### Rest parameters

You can prefix the last parameter of a decorator with `...` to collect all the remaining arguments. The type of this parameter must be an `array expression`.

```typespec
extern dec track(target: Model | Enum, ...names: valueof string[]);
```

## Requesting a value type

It's common for decorator parameters to expect a value (e.g., a string or a number). However, using `: string` as the type would also allow a user of the decorator to pass `string` itself or a custom scalar extending string, as well as a union of strings. Instead, the decorator can use `valueof <T>` to specify that it expects a value of that kind.

| Example           | Description       |
| ----------------- | ----------------- |
| `valueof string`  | Expects a string  |
| `valueof float64` | Expects a float   |
| `valueof int32`   | Expects a number  |
| `valueof boolean` | Expects a boolean |

```tsp
extern dec tag(target: unknown, value: valueof string);

// bad
@tag(string)

// good
@tag("This is the tag name")
```

## Implement the decorator in JavaScript

Decorators can be implemented in JavaScript by prefixing the function name with `$`. A decorator function must have the following parameters:

- `1`: `context` of type `DecoratorContext`
- `2`: `target` The TypeSpec type target. (`Namespace`, `Interface`, etc.)
- `3+`: Any arguments of the decorators.

```ts
// model.ts
import type { DecoratorContext, Type } from "@typespec/compiler";

export function $logType(context: DecoratorContext, target: Type, name: valueof string) {
  console.log(name + ": " + targetType.kind);
}
```

Or in pure JavaScript:

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

For certain TypeSpec types (Literal types), the decorator does not receive the actual type but a marshalled value if the decorator parameter type is a `valueof`. This simplifies the most common cases.

| TypeSpec Type     | Marshalled value in JS |
| ----------------- | ---------------------- |
| `valueof string`  | `string`               |
| `valueof numeric` | `number`               |
| `valueof boolean` | `boolean`              |

For all other types, they are not transformed.

Example:

```ts
export function $tag(
  context: DecoratorContext,
  target: Type,
  stringArg: string, // Here instead of receiving a `StringLiteral`, the string value is being sent.
  modelArg: Model // Model has no special handling so we receive the Model type
) {}
```

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
