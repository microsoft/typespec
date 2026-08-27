---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Run the `onGraphFinish` validator of a decorator applied to a type created after the type graph was checked, a clone a mutator produced during `$onValidate` for example. Those validators used to be registered but never run.
