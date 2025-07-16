# How to get Client initialization Information

Oftentimes a client needs input to be instantiated, the client library exposes a typekit to query a client for its initialization parameters `$(program).client.getInitialization()`

It returns an object containing the Authentication options and the defined endpoints for the client.

```ts
import { EmitContext } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import "@typespec/http-client/typekit";

export async function $onEmit(context: EmitContext) {
  const tk = $(context.program);
  const clients = tk.client.list();

  for (const client of clients) {
    console.log(`Client Name: ${client.name}`);

    const initialization = tk.client.getInitialization(client);

    // It gives us information about the authentication needed
    const authOptions = initialization?.authentication;

    console.log(`  The following authentication options are available one must be provided:`);
    for (const auth of authOptions?.options ?? []) {
      console.log(
        `      All of the following  Authentication Scheme need to be provided: ${auth.schemes.map((s) => s.id).join(", ")}`,
      );
    }

    // Also about the endpoint configuration
    const endpoints = initialization?.endpoints;

    for (const endpoint of endpoints ?? []) {
      const templateParameters = [...endpoint.parameters.values()];
      console.log(
        `  Endpoint: ${endpoint.url} with the following parameters: ${templateParameters.map((p) => p.name).join(", ")}`,
      );
    }
  }
}
```
