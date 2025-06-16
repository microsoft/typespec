# How to get the Client for a Namespace or Interface

To get the resolved Client from a namespace or interface the Client Library provides a typekit `$(program).client.get(container)`

```ts
import { EmitContext, Namespace, Interface } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import "@typespec/http-client/typekit";

export async function emitClient(
  context: EmitContext,
  namespaceOrInterface: Namespace | Interface,
) {
  const tk = $(context.program);

  const client = tk.client.get(namespaceOrInterface);

  console.log(`Client Name: ${client?.name}`);
  console.log(`Operations:`);
  for (const operation of client?.operations ?? []) {
    console.log(`  - ${operation.name}`);
  }
}
```
