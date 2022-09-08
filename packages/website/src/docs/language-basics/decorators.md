---
id: decorators
title: Decorators
---

# Decorators

Decorators enable a developer to attach metadata to types in a Cadl program. They can also be used to calculate types based on their inputs. Decorators are the backbone of Cadl's extensibility and give it the flexibility to describe many different kinds of APIs and associated metadata like documentation, constraints, samples, and the like.

Many Cadl constructs can be decorated, including [namespaces]({%doc "namespaces"%}), [operations]({%doc "operations"%}) and their parameters, and [models]({%doc "models"%}) and their members.

Decorators are defined using JavaScript functions that are exported from a standard ECMAScript module. When you import a JavaScript file, Cadl will look for any exported functions, and make them available as decorators inside the Cadl syntax. When a decorated declaration is evaluated by Cadl, it will invoke the decorator function, passing along a reference to the current compilation, an object representing the type it is attached to, and any arguments the user provided to the decorator.

## Using decorators

Decorators are referenced using the `@` prefix and must be specified before the entity they are decorating. Arguments can be provided by using parentheses in a manner similar to many programming languages, e.g. `@dec(1, "hi", { a: string })`.

The following shows an example of declaring and then using a decorator:

```cadl
@foo("Sample")
model Dog {
  @bar(false)
  name: string;
}
```

The parentheses can be omitted when no arguments are provided.

```cadl
@bar
model Dog {}
```

## Declaring decorators

Decorators can be declared in JavaScript by prefixing the function name with `$`. A decorator function must have the following parameters:

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

### Adding metadata with decorators

Decorators can be used to register some metadata. For this you can use the `context.program.stateMap` or `context.program.stateSet` to insert data that will be tied to the current execution.

Bad patterns:

- ❌ Do not save the data in a global variable.

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
