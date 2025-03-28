---
changeKind: breaking
packages:
  - "@typespec/http-server-csharp"
---
Change in Array Scaffolding from TypeSpec to C#

Previously, arrays (`[]`/`Array<T>`) in TypeSpec were always scaffolded as arrays (`[]`) in C#. With this change, arrays will now be scaffolded differently to better align with common C# practices:

- **Default Behavior**:  
  Arrays will be scaffolded to `IEnumerable<T>` in most cases, with `List<T>` used as the default implementation where an implementation is required.

- **Unique Items**:  
  For arrays decorated with the `@uniqueItems` decorator, they will be scaffolded to `ISet<T>`, with `HashSet<T>` as the default implementation.

- **Byte**:  
  `byte` type will continue to be treated as regular arrays (`[]`) in C#.
