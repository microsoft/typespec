# How to find the Client that owns an Operation

When working with an `Operation` sometimes we want to know which client it belongs to. The client library provides a typekit for this `$(progam).operaion.getClient(operation)`

```ts
import { EmitContext, Operation } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import "@typespec/http-client/typekit";

export async function emitOperation(context: EmitContext, operation: Operation) {
  const tk = $(context.program);

  const belongsToClient = tk.operation.getClient(operation);
  console.log(`Operation Name: ${operation.name}`);
  console.log(`Belongs to: ${belongsToClient?.name}`);
}
```
