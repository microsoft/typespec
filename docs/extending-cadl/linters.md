---
id: linters
title: Linters
---

# Linters

## Linter vs `onValidate`

Cadl library can probide a `$onValidate` hook which can be used to validate the cadl program is valid in the eye of your library.

A linter on the other hand might be a validation that is more optional, the program is correct but there could be some improvements. For example requiring documentation on every type. This is not something that is needed to represent the cadl program but without it the end user experience might suffer.

## Writing a linter

There is no built-in concept of linter into Cadl, there is however a library `@cadl-lang/lint` that lets a library define its linting rules and hooks on to the `onValidate`.

### 1. Install the `@cadl-lang/lint` package

```bash
npm install @cadl-lang/lint
```

### 2. Define the rules

```ts
import { createRule } from "@cadl-lang/lint";
import { reportDiagnostic } from "../lib.js";

export const modelDocRule = createRule({
  name: "no-model-doc",
  create({ program }) {
    return {
      model: (model) => {
        if (!getDoc(program, model)) {
          reportDiagnostic(program, {
            code: "no-model-doc",
            target: model,
          });
        }
      },
    };
  },
});
```

### Register the rules

<!-- cspell:disable-next-line -->

`$lib` refer to the value of `createCadlLibrary` [See](./basics.md#4-create-libts)

```ts
import { $lib } from "../lib.js";
import { modelDocRule } from "./rules/model-doc.js";

// Get the instance of the linter for your library
const linter = getLinter($lib);

linter.registerRule(modelDocRule);
```

Or multiple rules at once

```ts
linter.registerRule([modelDocRule, interfaceDocRule]);
```

When registering a rule, its name will be prefixed by the library named defined in `$lib`.

### Enable the rules

Rules are by default just registered but not enabled. This allows a library to provide a set of linting rules for other libraries to use or a user to enable.

```ts
// Note: the rule id here needs to be the fully qualified rule name prefixed with `<libraryname>/`
linter.enableRule("my-library/no-model-doc");
```

Alternatively rules can be automatically enabled when registered.

```ts
// With single registration
linter.registerRule(modelDocRule, { enable: true });

// With multi registration
linter.registerRule([modelDocRule, interfaceDocRule], { enable: true });
```

### Register the linter hook

The lint library still depends on `$onValidate` to run. For that each library providing a linter should call `linter.lintOnValidate(program);` to ensure that the linter will be run.

```ts
export function $onValidate(program: Program) {
  linter.autoEnableMyRules(); // Optional if you want to automatically enable your rules
  linter.enableRules(["<library-name>/<rule-name>"]); // Alternatively enable rules explicitly. Must be the rule fully qualified name.
  linter.lintOnValidate(program);
}
```

This will not run the linter right here, it will just add a new callback to the onValidate list giving time for all linters to register their rules.
