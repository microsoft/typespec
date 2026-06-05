---
changeKind: internal
packages:
  - "@typespec/json-schema"
---

Add the explicit `<Type, boolean>` generic to the `useStateMap` call backing `@uniqueItems`, matching the convention used by every other state-backed decorator in the compiler. This makes `getUniqueItems` return `boolean | undefined` rather than `unknown | undefined` and lets downstream emitters consume the value without a cast.
