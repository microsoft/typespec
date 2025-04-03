---
changeKind: breaking
packages:
  - "@typespec/http-server-csharp"
---
### Change in Array Scaffolding from TypeSpec to C#

The default behavior for scaffolding arrays remains unchanged: arrays will continue to be scaffolded as `T[]` by default. However, for arrays decorated with the `@uniqueItems` decorator, they will now be scaffolded as `ISet<T>`, with `HashSet<T>` as the default implementation.

Additionally, a new emitter option, `collection-type`, has been introduced to provide flexibility in how collections are generated:
- **`collection-type`**:
  - **`array` (default)**: Generates arrays (`T[]`).
  - **`enumerable`**: Generates `IEnumerable<T>` for collections, with `List<T>` used as the default implementation when needed.

#### Unique Items
For arrays decorated with the `@uniqueItems` decorator, they will be scaffolded as `ISet<T>`, regardless of the `collection-type` option, with `HashSet<T>` as the default implementation.

#### Byte Arrays
The `bytes` type will always be treated as an array of bytes (`byte[]`) in C#, regardless of the `collection-type` option selected.
