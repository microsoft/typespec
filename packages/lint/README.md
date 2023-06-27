# TypeSpec Lint

**This package is deprecated. Linting functionality is built-in the compiler.**

## Migrate to built-in linter

See built-in linter [documentation](https://microsoft.github.io/typespec/extending-typespec/linters)

### 1. Migrate a rule

- `createRule` (`from "@typespec/lint"`) -> `createLinterRule` (`from "@typespec/compiler"`)
- Remove diagnostic for the linter rule(in `$lib.diagnostics`) and move messages directly in the `createLinterRule`
- Change `reportDiagnostic(context.program, {code: ..., messageId: ...})` to `context.reportDiagnostic({ messageId: ...})`
- Add `description` entry
- Linter rules cannot be `error`, `severity` must be changed to `warning`. If a rule is meant to be an error is should be part of `$onValidate`.

#### Example

**Before**

```ts
import { createRule } from "@typespec/lint";
import { paramMessage } from "@typespec/compiler";

export const casingRule = createRule({
  name: "casing",
  severity: "warning",
  create: (context) => {
    return {
      model: (model) => {
        if (!isPascalCaseNoAcronyms(model.name)) {
          reportDiagnostic(context.program, {
            code: "casing",
            format: { casing: "PascalCase" },
            target: model,
          });
        }
      },
    };
  },
});
```

**After**

```ts
import { createLinterRule, paramMessage } from "@typespec/compiler";

export const casingRule = createRule({
  name: "casing",
  severity: "warning",
  description: "Enforce TypeSpec recommended naming convention for types.",
  messages: {
    default: paramMessage`Must match expected casing '${"casing"}'`,
  },
  create: (context) => {
    return {
      model: (model) => {
        if (!isPascalCaseNoAcronyms(model.name)) {
          context.reportDiagnostic({
            format: { casing: "PascalCase" },
            target: model,
          });
        }
      },
    };
  },
});
```

### 2. Migrate rule registration

**Before**

```ts
const linter = getLinter($lib); // where $lib is the TypeSpecLibrary created with createTypeSpecLibrary
linter.registerRule(myRule);

// register multiple rules
linter.registerRules([rule1, rule2]);

// register and automatically enable rule
linter.registerRules([rule1, rule2], { enable: true });
```

**After**

```ts
export const $lib = createTypeSpecLibrary({
  name: "@typespec/my-linter",
  diagnostics: {},
  linter: {
    // Include all the rules your linter is defining here.
    rules: [myRule, rule1, rule2],
  },
});
```

### 3. Enable rule

With the new linter rules are enabled by the user in their config

In `tspconfig.yaml`

```yaml
linter:
  extends: # Extend `recommended` ruleset from @typespec/best-practices library
    - "@typespec/my-linter:recommended"

  enable: # Explicitly enable some rules
    "@typespec/my-linter:no-x": true

  disable: # Disable some rules defined in one of the ruleset extended.
    "@typespec/my-linter:no-y": "This rule cannot be applied in this project because X"
```
