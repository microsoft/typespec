---
id: implement-functions
title: Functions
---

TypeSpec functions, like [Decorators](./create-decorators.md), are implemented using JavaScript functions. To provide
a function in your library, you must:

1. [Declare the function signature in TypeSpec](#declare-the-function-signature).
2. [Implement the function in JavaScript](#implement-the-function-in-javascript).

## Declare the function signature

Unlike decorators, declaring a function's signature in TypeSpec is mandatory. A function signature is declared using the
`fn` keyword. Functions are implemented in JavaScript and therefore the signature also requires the `extern` keyword.

```tsp
extern fn myFn();
```

A function signature can specify a list of parameters and optionally a return type constraint.

```tsp
/**
 * Concatenates to strings, equivalent to `l + r` in JavaScript, where `l` and `r` are strings.
 *
 * @param l String to be appended first to the result string.
 * @param r String to be appended second to the result string.
 * @returns the result of concatenating `l` and `r`.
 */
extern fn concat(l: valueof string, r: valueof string): valueof string;
```

Type constraints for parameters work exactly the same as constraints for [Decorator](../language-basics/decorators.md).

### Optional parameters

You can mark a function parameter as optional using `?`:

```tsp
/**
 * Renames a model, if `name` is provided and different from the input model's name.
 *
 * @param m the input Model to rename
 * @param name if set, the name of the output model
 * @returns `m` if `name` is not set or `m`'s name is equal to `name`, otherwise a new Model instance with the given
 *          name that is otherwise identical to `m`.
 */
extern fn rename(m: Reflection.Model, name?: valueof string): Reflection.Model;
```

### Rest parameters

Functions may also specify "rest" parameters. The rest parameter collects all remaining arguments passed to the function,
and is declared using `...`. The type of a rest parameter _must_ be an array.

```tsp
/**
 * Joins a list of strings, equivalent to `rest.join(sep)` in JavaScript.
 *
 * @param sep the separator string used to join the list.
 * @param rest the list of strings to join
 * @returns the list of strings joined by the separator
 */
extern fn join(sep: valueof string, ...rest: valueof string[]): valueof string;
```

### Return type constraints

Functions may optionally specify a return type constraint. The return type constraint is checked when the function is
called, and whatever the function returns must be assignable to the constraint.

#### Void functions

The `void` return type is treated specially. A JS implementation for a TypeSpec function that returns `void` may return
_either_ `undefined`, or an instance of the `void` intrinsic type, for compatibility with JavaScript void functions.
Regardless of what the implementation returns, the TypeSpec function call will _always_ evaluate to `void`.

```tsp
namespace Example;

extern fn myFn(): void;

// Calling myFn() is guaranteed to evaluate to the `void` intrinsic type.
```

## Implement the function in JavaScript

Functions must be implemented in a JavaScript library by exporting the functions the library implements using the
`$functions` variable.

```ts
// lib.ts
import { FunctionContext } from "@typespec/compiler";

export const $functions = {
  // Namespace
  "MyOrg.MyLib": {
    concat,
  },
};

function concat(context: FunctionContext, l: string, r: string): string {
  return l + r;
}
```

The function implementation must be imported from TypeSpec to bind to the declaration in the signature:

```tsp
// lib.tsp
import "./lib.js";

namespace MyOrg.MyLib;

extern fn concat(l: valueof string, r: valueof string): valueof string;
```

The first argument passed to a JS function implementation is always the function's _context_, which has type
`FunctionContext`. The context provides information about where the function call was located in TypeSpec source, and
can be used to call other functions or invoke decorators from within the function implementation.

### Function parameter marshalling

When function arguments are _Types_, the type is passed to the function as-is. When a function argument is a _value_,
the function implementation receives a JavaScript value with a type that is appropriate for representing that value.

| TypeSpec value type | Marshalled type in JS             |
| ------------------- | --------------------------------- |
| `string`            | `string`                          |
| `boolean`           | `boolean`                         |
| `numeric`           | `Numeric` or `number` (see below) |
| `null`              | `null`                            |
| enum member         | `EnumValue`                       |

When marshalling numeric values, either the `Numeric` wrapper type is used, or a `number` is passed directly, depending on whether the value can be represented as a JavaScript number without precision loss. In particular, the types `numeric`, `integer`, `decimal`, `float`, `int64`, `uint64`, and `decimal128` are marshalled as a `Numeric` type. All other numeric types are marshalled as `number`.

When marshalling custom scalar subtypes, the marshalling behavior of the known supertype is used. For example, a `scalar customScalar extends numeric` will marshal as a `Numeric`, regardless of any value constraints that might be present.

### Reporting diagnostics on function calls or arguments

The function context provides the `functionCallTarget` and `getArgumentTarget` helpers.

```ts
import type { FunctionContext, Type } from "typespec/compiler";
import { reportDiagnostic } from "./lib.js";

export function renamed(ctx: FunctionContext, model: Model, name: string): Model {
  // To report a diagnostic on the function call
  reportDiagnostic({
    code: "my-diagnostic-code",
    target: ctx.functionCallTarget,
  });
  // To report an error on a specific argument (for example the `model`), use the argument target.
  // Note: targeting the `model` itself will put the diagnostic on the type's _declaration_, but using
  // getArgumentTarget will put it on the _function argument_, which is probably what you want.
  reportDiagnostic({
    code: "my-other-code",
    target: ctx.getArgumentTarget(0),
  });
}
```
