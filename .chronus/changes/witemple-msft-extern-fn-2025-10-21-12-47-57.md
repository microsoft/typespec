---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Added support for Functions, a new type graph entity and language feature. Functions enable library authors to provide input-output style transforms that operate on types and values. See [the Functions Documentation](https://typespec.io/docs/language-basics/functions/) for more information about the use and implementation of functions.

Added an `unknown` value that can be used to denote when a property or parameter _has_ a default value, but its value cannot be expressed in TypeSpec (for example, because it depends on the server instance where it is generated, or because the service author simply does not with to specify how the default value is generated). This adds a new kind of `Value` to the language that represents a value that is not known.
