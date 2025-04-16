---
changeKind: feature
packages:
  - "@typespec/emitter-framework"
---

Adds the `TspContextProvider` and `useTsp()` hook for providing and accessing TypeSpec context and the Typekit APIs (e.g. `$`). Adds a new `Output` component that accepts a TypeSpec `Program` and automatically wraps children components with the `TspContenxtProvider`.