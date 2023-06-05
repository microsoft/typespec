---
id: create-decorators
title: Creating TypeSpec Decorators
---

# Creating TypeSpec decorators

TypeSpec decorator are implemented as JavaScript function. Declarating a decorator can be done in 1 or 2 part:

1. [(Optional) Declare the decorator signature in typespec](#declaring-a-decorator-signature)
2. [Implement the decorator in Javascript](#implement-the-decorator-in-js)

## Declaring a decorator signature

This part is optional but provides great value:

- Type checking for the parameters
- IDE IntelliSense

A decorator signature can be declared using the `dec` keyword. As we are implementing the decorator in JS (only choice right now), we must apply the `extern` modifier as well.

```typespec
extern dec logType(target: unknown, name: string);
```

## Decorator target

The first parameter of the decorator represents the typespec type(s) that the decorator can be applied on.

You can specify multiple potential target type using an `union expression`

```typespec
using TypeSpec.Reflection;

extern dec track(target: Model | Enum);
```

### Optional parameters

A decorator parameter can be marked optional using `?`

```typespec
extern dec track(target: Model | Enum, name?: valueof string);
```

### Rest parameters

A decorator's last parameter can be prefixed with `...` to collect all the remaining arguments. The type of that parameter must be an `array expression`

```typespec
extern dec track(target: Model | Enum, ...names: valueof string[]);
```

## Ask for a value type

It is common that decorators parameter will expect a value(e.g. a string or a number). However just using `: string` as the type will also allow a user of the decorator to pass `string` itself or a custom scalar extending string as well as union of strings.
Instead the decorator can use `valueof <T>` to specify that it is expecting a value of that kind.

| Example           | Description      |
| ----------------- | ---------------- |
| `valueof string`  | Expect a string  |
| `valueof float64` | Expect a float   |
| `valueof int32`   | Expect a number  |
| `valueof boolean` | Expect a boolean |

```tsp
extern dec tag(target: unknown, value: valueof string);

// bad
@tag(string)

// good
@tag("This is the tag name")
```

## Implement the decorator in JS

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

or in pure JS

```ts
// model.js
export function $logType(context, target, name) {
  console.log(name + ": " + targetType.kind);
}
```

The decorator can then be consumed this way

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

For certain TypeSpec types(Literal types) the decorator do not receive the actual type but a marshalled value if the decorator parmaeter type is a `valueof`. This is to simplify the most common cases.

| TypeSpec Type     | Marshalled value in JS |
| ----------------- | ---------------------- |
| `valueof string`  | `string`               |
| `valueof numeric` | `number`               |
| `valueof boolean` | `boolean`              |

for all the other types they are not transformed.

```ts
export function $tag(
  context: DecoratorContext,
  target: Type,
  stringArg: string, // Here instead of receiving a `StringLiteral` the string value is being sent.
  modelArg: Model // Model has no special handling so we receive the Model type
) {}
```

### Adding metadata with decorators

Decorators can be used to register some metadata. For this you can use the `context.program.stateMap` or `context.program.stateSet` to insert data that will be tied to the current execution.

❌ Do not save the data in a global variable.

```ts
import type { DecoratorContext, Type } from "@typespec/compiler";
import type { createStateSymbol } from "./lib.js";

// Create a unique key
const key = createStateSymbol("customName");
export function $customName(context: DecoratorContext, target: Type, name: string) {
  // Keep a mapping between the target and a value.
  context.program.stateMap(key).set(target, name);

  // Keep an index of a type.
  context.program.stateSet(key).add(target);
}
```

### Reporting diagnostic on decorator or arguments

Decorator context provide the `decoratorTarget` and `getArgumentTarget` helpers

```ts
import type { DecoratorContext, Type } from "@typespec/compiler";
import type { reportDiagnostic } from "./lib.js";

export function $customName(context: DecoratorContext, target: Type, name: string) {
  reportDiagnostic({
    code: "custom-name-invalid",
    target: context.decoratorTarget, // Get location of @customName decorator in typespec document.
  });
  reportDiagnostic({
    code: "bad-name",
    target: context.getArgumentTarget(0), // Get location of {name} argument in typespec document.
  });
}
```

## Declaration - implementation link

Decorator signatures are linked to the implementation of the same name in the same namespace

```typespec
import "./lib.js";
extern dec customName(target: Type, name: StringLiteral);

namespace MyLib {
  extern dec tableName(target: Type, name: StringLiteral);
}
```

is linked the the following in `lib.js`

```ts
export function $customName(context: DecoratorContext, name: string) {}

export function $tableName(context: DecoratorContext, name: string) {}
setTypeSpecNamespace("MyLib", $tableName);
```

## Troubleshooting

### Extern declation must have an implementation in JS file

Potential issues:

- JS function is not prefixed with `$`. For a decorator called `@decorate` the JS function must be called `$decoratate`
- JS function is not in the same namespace as the the `extern dec`
- Error is only showing in the IDE? Restart the TypeSpec server or the IDE.

You can use `--trace bind.js.decorator` to log debug information about decorator loading in JS file that should help pinning down which of those is the issue.
