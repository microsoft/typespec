import { ignoreDiagnostics } from "@typespec/compiler";
import { BasicTestRunner } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { resolveClients } from "../src/client-resolution.js";
import { ClientV2 } from "../src/interfaces.js";
import { createTypespecHttpClientTestRunner } from "./test-host.js";

let runner: BasicTestRunner;

describe("Implicit Client Resolution", () => {
  beforeEach(async () => {
    runner = await createTypespecHttpClientTestRunner();
  });

  it("ImplicitService_SingleRootClient", async () => {
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

  it("ImplicitService_MultipleTopLevelServices", async () => {
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

  it("ImplicitService_NoClients", async () => {
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

  it("ImplicitService_NestedNamespacesHierarchy", async () => {
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
    expect(rootClient.subClients[0].operations).toHaveLength(1);
    expect(rootClient.subClients[0].operations[0].name).toBe("getSubItems");
  });

  it("ImplicitService_NestedNamespacesHierarchy_WithNamer", async () => {
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
    function clientNamePolicy(client: ClientV2) {
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
    expect(rootClient.subClients[0].operations).toHaveLength(1);
    expect(rootClient.subClients[0].operations[0].name).toBe("getSubItems");
  });

  it("ImplicitService_DirectOperationsIncluded", async () => {
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
    expect(rootClient.operations).toHaveLength(2);
    expect(rootClient.operations[0].name).toBe("getItems");
    expect(rootClient.operations[1].name).toBe("getItemById");
  });

  it("ImplicitService_MoveToCreatesSubclient", async () => {
    // Description:
    // An operation outside the service namespace annotated with `@moveTo("Root")`.
    // Expect: it is pulled into its own sub-client under the root.
  });

  it("PruneEmptyClients_NoMethodsOrSubclients", async () => {
    // Description:
    // A detected client or sub-client that ends up with neither methods nor children.
    // Expect: it is discarded (ignored).
  });
});

describe("Explicit Client Resolution", () => {});
