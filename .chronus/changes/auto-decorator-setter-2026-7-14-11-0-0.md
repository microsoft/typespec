---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Add `setAutoDecorator` API to programmatically apply an `auto` decorator to a target, mirroring what the synthesized `auto dec` implementation does when the decorator is written in source. This lets emitters and mutators mark synthetic types without reaching into the program state map directly.

```ts
import { setAutoDecorator } from "@typespec/compiler";

setAutoDecorator(program, "MyLib.myFlag", target);
```
