---
id: create-decorators
title: Creating Cadl Decorators
---

# Creating Cadl decorators

Cadl decorator are implemented as JavaScript function. Declarating a decorator can be done in 1 or 2 part:

1. [(Optional) Declare the decorator signature in cadl](#declaring-a-decorator-signature)
2. [Implement the decorator in Javascript](#implement-the-decorator-in-js)

## Declaring a decorator signature

This part is optional but provides great value:

- Type checking for the parameters
- IDE IntelliSense

A decorator signature can be declared using the `dec` keyword. As we are implementing the decorator in JS (only choice right now), we must apply the `extern` modifier as well.

```cadl
extern dec logType(target: Cadl.Reflection.Type, name: Cadl.Reflection.StringLiteral);
```

## Decorator target

The first parameter of the decorator represents the cadl type(s) that the decorator can be applied on.

You can specify multiple potential target type using an `union expression`

```cadl
using Cadl.Reflection;

extern dec track(target: Model | Enum);
```

### Optional parameters

A decorator parameter can be marked optional using `?`

```cadl
extern dec track(target: Model | Enum, name?: StringLiteral);
```

### Rest parameters

A decorator's last parameter can be prefixed with `...` to collect all the remaining arguments. The type of that parameter must be an `array expression`

```cadl
extern dec track(target: Model | Enum, ...names: StringLiteral[]);
```

## Implement the decorator in JS

Decorators can be implemented in JavaScript by prefixing the function name with `$`. A decorator function must have the following parameters:

- `1`: `context` of type `DecoratorContext`
- `2`: `target` The Cadl type target. (`Namespace`, `Interface`, etc.)
- `3+`: Any arguments of the decorators.

```ts
// model.ts
import type { DecoratorContext, Type } from "@cadl-lang/compiler";

export function $logType(context: DecoratorContext, target: Type, name: string) {
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

```cadl
// main.cadl
import "./model.js";

@logType("Dog type")
model Dog {
  @logType("Name type")
  name: string;
}
```

### Decorator parameter marshalling

For certain Cadl types(Literal types) the decorator do not receive the actual type but a marshalled value. This is to simplify the most common cases.

| Cadl Type        | Marshalled value in JS |
| ---------------- | ---------------------- |
| `StringLiteral`  | `string`               |
| `NumericLiteral` | `number`               |
| `BooleanLiteral` | `boolean`              |

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
import type { DecoratorContext, Type } from "@cadl-lang/compiler";
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
import type { DecoratorContext, Type } from "@cadl-lang/compiler";
import type { reportDiagnostic } from "./lib.js";

export function $customName(context: DecoratorContext, target: Type, name: string) {
  reportDiagnostic({
    code: "custom-name-invalid",
    target: context.decoratorTarget, // Get location of @customName decorator in cadl document.
  });
  reportDiagnostic({
    code: "bad-name",
    target: context.getArgumentTarget(0), // Get location of {name} argument in cadl document.
  });
}
```

## Declaration - implementation link

Decorator signatures are linked to the implementation of the same name in the same namespace

```cadl
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
setCadlNamespace("MyLib", $tableName);
```

## Troubleshooting

### Extern declation must have an implementation in JS file

Potential issues:

- JS function is not prefixed with `$`. For a decorator called `@decorate` the JS function must be called `$decoratate`
- JS function is not in the same namespace as the the `extern dec`
- Error is only showing in the IDE? Restart the Cadl server or the IDE.

You can use `--trace bind.js.decorator` to log debug information about decorator loading in JS file that should help pinning down which of those is the issue.
