# How to find the closes service to a client

For example in this spec, the sub client Bar doesn't define a @service explicitly but its parent Foo does.

```ts
@service(#{title: "The Service"})
namespace Foo {
   namespace Bar {
       op get(): string;
   }

}

```

We can use `$(program).client.getService(client)` to get the closest service to the client.

```ts
import { EmitContext } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import "@typespec/http-client/typekit";

export async function $onEmit(context: EmitContext) {
  const tk = $(context.program);
  const clients = tk.client.list();

  for (const client of clients) {
    const service = tk.client.getService(client);
    console.log(`Client: ${client.name}, Service: ${service?.title}`);
  }
}
```

This would output

```
Client: Foo, Service: "The Service"
Client: Bar, Service: "The Service"
```
