import { ignoreDiagnostics } from "@typespec/compiler";
import { BasicTestRunner } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { getClientOperations, resolveClients } from "../src/client-resolution.js";
import { Client } from "../src/interfaces.js";
import { createTypespecHttpClientTestRunner } from "./test-host.js";

let runner: BasicTestRunner;

describe("Implicit Client Resolution", () => {
  beforeEach(async () => {
    runner = await createTypespecHttpClientTestRunner();
  });

  it("single client with implicit client resolution", async () => {
    // Description:
    // A spec with exactly one top-level `@service` namespace and no explicit @client/@operationGroup.
    // Expect: that namespace becomes the sole root client.

    await runner.compile(`
      @service(#{
        title: "Single Root Client Service",
      })
      namespace SingleRoot {
        op getItems(): unknown[];
      }
    `);

    const clients = ignoreDiagnostics(resolveClients(runner.program));
    expect(clients).toHaveLength(1);
    const rootClient = clients[0];
    expect(rootClient).toBeDefined();
    expect(rootClient.name).toBe("SingleRoot");
  });

  it("implicit client resolution with multiple top level clients", async () => {
    // Description:
    // Two sibling top-level `@service` namespaces.
    // Expect: Both are resolved as top level clients.

    await runner.compile(`
      @service(#{
        title: "First Service",
      })
      namespace FirstService {
        op getItems(): unknown[];
      }

      @service(#{
        title: "Second Service",
      })
      namespace SecondService {
        op getItems(): unknown[];
      }
    `);

    const clients = ignoreDiagnostics(resolveClients(runner.program));
    expect(clients).toHaveLength(2);
    const rootClient = clients[0];
    expect(rootClient).toBeDefined();
    expect(rootClient.name).toBe("FirstService");

    const secondClient = clients[1];
    expect(secondClient).toBeDefined();
    expect(secondClient.name).toBe("SecondService");
  });

  it("implicit client resolution with no clients reports diagnostics", async () => {
    // Description:
    // Two sibling top-level namespaces without any `@service`, `@client`, or `@operationGroup` decorators.
    // Expect: no clients are created, and a diagnostic is reported.

    await runner.compile(`
      namespace FirstService {
        op getItems(): unknown[];
      }

      namespace SecondService {
        op getItems(): unknown[];
      }
    `);

    const [clients, diagnostics] = resolveClients(runner.program);
    expect(clients).toHaveLength(0);
    expect(diagnostics).toHaveLength(1);

    const diagnostic = diagnostics[0];
    expect(diagnostic).toBeDefined();
    expect(diagnostic.code).toBe("@typespec/http-client-library/no-client-defined");
  });

  it("implicit client resolution with nested sub clients", async () => {
    // Description:
    // A `@service` namespace containing nested child namespaces (multiple levels).
    // Expect: each nesting level becomes a sub-client, preserving the hierarchy.

    await runner.compile(`
      @service(#{
        title: "Root Service",
      })
      namespace RootService {
        op getItems(): unknown[];

        namespace SubService {
          @route("sub")
          op getSubItems(): unknown[];
        }
      }
    `);

    const clients = ignoreDiagnostics(resolveClients(runner.program));
    expect(clients).toHaveLength(1);
    const rootClient = clients[0];
    expect(rootClient).toBeDefined();
    expect(rootClient.name).toBe("RootService");
    expect(rootClient.subClients).toHaveLength(1);
    expect(rootClient.subClients[0].name).toBe("SubService");
    const operations = getClientOperations(runner.program, rootClient.subClients[0]);
    expect(operations).toHaveLength(1);
    expect(operations[0].name).toBe("getSubItems");
  });

  it("implicit client resolution with nested sub clients applies name policy", async () => {
    // Description:
    // A `@service` namespace containing nested child namespaces (multiple levels).
    // Expect: each nesting level becomes a sub-client, preserving the hierarchy.

    await runner.compile(`
      @service(#{
        title: "Root Service",
      })
      namespace RootService {
        op getItems(): unknown[];

        namespace SubService {
          @route("sub")
          op getSubItems(): unknown[];
        }
      }
    `);

    // Custom namer function to format client names.
    // Top level client gets a suffix "Client"
    // Sub-clients don't get a suffix.
    function clientNamePolicy(client: Client) {
      if (client.parent === undefined && !client.name.endsWith("Client")) {
        return `${client.name}Client`;
      }
      return client.name;
    }

    const clients = ignoreDiagnostics(resolveClients(runner.program, { clientNamePolicy }));
    expect(clients).toHaveLength(1);
    const rootClient = clients[0];
    expect(rootClient).toBeDefined();
    expect(rootClient.name).toBe("RootServiceClient");
    expect(rootClient.subClients).toHaveLength(1);
    expect(rootClient.subClients[0].name).toBe("SubService");
    const operations = getClientOperations(runner.program, rootClient.subClients[0]);
    expect(operations).toHaveLength(1);
    expect(operations[0].name).toBe("getSubItems");
  });

  it("implicit client resolution with direct operations included", async () => {
    // Description:
    // Operations declared directly inside a service or sub-client without any decorator.
    // Expect: they become methods on that client.
    await runner.compile(`
      @service(#{
        title: "Direct Operations Service",
      })
      namespace DirectOperationsService {
        op getItems(): unknown[];
        op getItemById(@path id: string): unknown;
      }
    `);

    const clients = ignoreDiagnostics(resolveClients(runner.program));
    expect(clients).toHaveLength(1);
    const rootClient = clients[0];
    expect(rootClient).toBeDefined();
    expect(rootClient.name).toBe("DirectOperationsService");
    const operations = getClientOperations(runner.program, rootClient);
    expect(operations).toHaveLength(2);
    expect(operations[0].name).toBe("getItems");
    expect(operations[1].name).toBe("getItemById");
  });

  it("prunes clients with no methods or children", async () => {
    // Description:
    // A detected client or sub-client that ends up with neither methods nor children.
    // Expect: it is discarded (ignored).
    await runner.compile(`
      @service(#{
        title: "Direct Operations Service",
      })
      namespace DirectOperationsService {
      }
    `);

    const clients = ignoreDiagnostics(resolveClients(runner.program));
    expect(clients).toHaveLength(0);
  });
});
