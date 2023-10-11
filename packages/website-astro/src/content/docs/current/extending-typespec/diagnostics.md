---
title: Diagnostics
---

TypeSpec compiler report errors and warnings in the spec using the diagnostic API.

## Best practices

- ❌ Do not use `throw` to report errors. Any exception thrown like this will be presented as a bug in your library to the user.
- ✅ Use diagnostic API to report expected errors and warnings.
  - ✅ Use `reportDiagnostic` in a decorator, `$onValidate` or `$onEmit`
  - ❌ Do not use `reportDiagnostic` in an accessor(A function meant to be consumed in another library or emitter). See [collect diagnostics section](#collect-diagnostics)

## Diagnostic specification

- Each diagnostic MUST have a `code`. The full code is the the library name followed by the declared code. (`<lib-name>/<local-code>`)
- Each diagnostic MUST have a `severity`. It can be `error`, `warning`. Errors cannot be suppressed
- Each diagnostics MUST have at least one message. Using `default` as the `messageId` will allow it to be the default selected.
- Each diagnostics message MAY have parameters to interpolate information into the message

## Usage

### Declare the diagnostics you are reporting

```ts
// in lib.js
export const { reportDiagnostic, createDiagnostic, createStateSymbol } = createTypeSpecLibrary({
  name: "@typespec/my-lib",
  diagnostics: {
    // Basic diagnostic with a fixed message
    "no-array": {
      severity: "error",
      messages: {
        default: `Array is not allowed in my-lib models.`,
      },
    },

    // Parameterized message
    "duplicate-route": {
      severity: "error",
      messages: {
        default: paramMessage`Route '${"path"}' is being referenced in 2 different operations.`,
      },
    },

    // Multiple messages
    "duplicate-name": {
      severity: "warning",
      messages: {
        default: paramMessage`Duplicate type name: '${"value"}'.`,
        parameter: paramMessage`Duplicate parameter key: '${"value"}'.`,
      },
    },
  },
} as const);
```

This will represent 3 different diagnostics with full name of

- `@typespec/my-lib/no-array`
- `@typespec/my-lib/duplicate-route`
- `@typespec/my-lib/duplicate-name`

### Report diagnostics

```ts
import { reportDiagnostic } from "./lib.js";

// Basic diagnostic with a fixed message
reportDiagnostic(program, {
  code: "no-array",
  target: diagnosticTarget,
});

// Parameterized message
reportDiagnostic(program, {
  code: "duplicate-route",
  format: {path: "/foo"}
  target: diagnosticTarget,
});

// Multiple messages
reportDiagnostic(program, {
  code: "duplicate-name",
  messageId: "parmaeter",
  format: {value: "$select"},
  target: diagnosticTarget,
});
```

### Collect diagnostics

When trying to report diagnostic in an accessor a good pattern is not to report the diagnostic to the program directly but return a tuple to let the user decide what to do.
This prevent duplicate diagnostics emitter if the accessor is called multiple times.

```ts
import { createDiagnosticCollector, Diagnostic } from "@typespec/compiler";

function getRoutes(): [Route, readonly Diagnostic] {
  const diagnostics = createDiagnosticCollector();
  diagnostics.add(
    createDiagnostic(program, {
      code: "no-array",
      target: diagnosticTarget,
    })
  );
  const result = diagnostic.pipe(getParameters()); // to pipe diagnostics returned by `getParameters`
  return diagnostics.wrap(routes);
}
```

or manually

```ts
import { Diagnostic } from "@typespec/compiler";

function getRoutes(): [Route, readonly Diagnostic] {
  const diagnostics = [];
  diagnostics.push(
    createDiagnostic(program, {
      code: "no-array",
      target: diagnosticTarget,
    })
  );
  return [routes, diagnostics];
}
```
