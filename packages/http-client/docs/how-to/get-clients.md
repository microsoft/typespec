# How to get all clients

By default, clients will be named after the container (Interface or Namespace) that represent it. However the list client typekit allows providing a name policy to customize.
For example if we want to add a suffix "Client" on the top level clients, but not on sub clients we can do something like this:

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
  // Only suffix if the client is top level (no parent) and if it doesn't already
  // include the suffix.
  if (!client.parent && !client.name.endsWith("Client")) {
    return `${client.name}Client`;
  }

  return client.name;
};
```
