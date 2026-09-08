---
changeKind: fix
packages:
  - "@typespec/tspd"
---

Document the generated auto decorator accessors, so libraries re-exporting them satisfy
api-extractor's `ae-undocumented` rule. `get*` and `set*` accessors carry the description of the
decorator they read or write; `is*` accessors get a generic one, since a decorator description
does not describe a boolean check.

```ts
/** Check if the `@TypeSpec.GraphQL.inputType` decorator was applied on the given target. */
export function isInputType(program: Program, target: Model): boolean {
  return hasAutoDecorator(program, "TypeSpec.GraphQL.inputType", target);
}

/** Mark a model as a GraphQL input type in the emitted schema. */
export function setInputType(program: Program, target: Model): void {
  setAutoDecorator(program, "TypeSpec.GraphQL.inputType", target);
}
```
