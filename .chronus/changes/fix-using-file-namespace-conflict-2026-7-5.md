---
changeKind: breaking
packages:
  - "@typespec/compiler"
---

`using` statements declared before a file-level(blockless) namespace are now resolved from the global namespace instead of the file namespace, matching C#.

```tsp
using TypeSpec.Http; // Now resolves the global `TypeSpec` namespace instead of `_Specs_.TypeSpec`
namespace _Specs_.TypeSpec.Foo;
```

A `using` declared after the file namespace, or inside a namespace block, is unchanged and still resolves relative to that namespace. Code relying on a relative name in a `using` written above the file namespace must now use the fully qualified name; a new `using-before-file-namespace` error with a quick fix suggests it.

```tsp
namespace MyOrg.Service;
using Models; // Still resolves to `MyOrg.Models`
```
