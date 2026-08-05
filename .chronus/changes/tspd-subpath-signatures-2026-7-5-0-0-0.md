---
changeKind: fix
packages:
  - "@typespec/tspd"
---

`gen-extern-signature` now generates signatures for sub path exports. Each export with a `typespec` condition is compiled on its own, entities are attributed to the export that first reaches their source file, and the generated files are written under a directory matching the sub path with `$decorators` imported from that same sub path.

```ts
// generated-defs/streams/MyLib.Streams.ts-test.ts
import { $decorators } from "my-lib/streams";
import type { MyLibStreamsDecorators } from "./MyLib.Streams.js";

const _decs: MyLibStreamsDecorators = $decorators["MyLib.Streams"];
```
