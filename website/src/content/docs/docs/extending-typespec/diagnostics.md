---
title: Diagnostics
---

The TypeSpec compiler uses the diagnostic API to report errors and warnings in the specification.

## Best practices

- ❌ Avoid using `throw` to report errors. Any exceptions thrown in this manner will be perceived as bugs in your library by the user.
- ✅ Utilize the diagnostic API to report anticipated errors and warnings.
  - ✅ Employ `reportDiagnostic` in a decorator, `$onValidate` or `$onEmit`
  - ❌ Refrain from using `reportDiagnostic` in an accessor (a function intended to be used in another library or emitter). Refer to the [section on collecting diagnostics](#collect-diagnostics) for more information.

## Diagnostic requirements

- Each diagnostic MUST have a `code`. The complete code is the library name followed by the declared code. (`<lib-name>/<local-code>`)
- Each diagnostic MUST have a `severity`. It can be `error` or `warning`. Errors cannot be suppressed.
- Each diagnostic MUST have at least one message. Using `default` as the `messageId` will make it the default selection.
- Each diagnostic message MAY have parameters to interpolate information into the message.

## How to use

### Declare the diagnostics you plan to report

```ts
import { createTypeSpecLibrary } from "@typespec/compiler";

// in lib.js
export const $lib = createTypeSpecLibrary({
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

// Re-export the helper functions to be able to just call them directly.
export const { reportDiagnostic, createDiagnostic };
```

This will represent three different diagnostics with the full names of:

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
  messageId: "parameter",
  format: {value: "$select"},
  target: diagnosticTarget,
});
```

### Collect diagnostics

When attempting to report a diagnostic in an accessor, a good practice is not to report the diagnostic to the program directly, but return a tuple to let the user decide what to do.
This prevents duplicate diagnostics emitter if the accessor is called multiple times.

```ts
import { createDiagnosticCollector, Diagnostic } from "@typespec/compiler";

function getRoutes(): [Route, readonly Diagnostic] {
  const diagnostics = createDiagnosticCollector();
  diagnostics.add(
    createDiagnostic(program, {
      code: "no-array",
      target: diagnosticTarget,
    }),
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
    }),
  );
  return [routes, diagnostics];
}
```
