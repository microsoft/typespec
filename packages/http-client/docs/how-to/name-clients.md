# Custom name policy for clients

We can specify a custom name policy for clients by passing a `clientNamePolicy` option to `$(program).client.list()` .
For example if we want the top level client to get a `Client` suffix. But subclients don't, we can do something like this:

```ts
import { EmitContext } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { Client, ClientNamePolicy } from "@typespec/http-client";
import "@typespec/http-client/typekit";

export async function $onEmit(context: EmitContext) {
  const tk = $(context.program);
  const clients = tk.client.list({ clientNamePolicy: customNamePolicy });

  for (const client of clients) {
    console.log(`Client Name: ${client.name}`);
  }
}

const customNamePolicy: ClientNamePolicy = (client: Client) => {
  if (!client.parent && !client.name.endsWith("Client")) {
    return `${client.name}Client`;
  }

  return client.name;
};
```
