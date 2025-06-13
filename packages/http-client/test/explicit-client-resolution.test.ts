import { ignoreDiagnostics } from "@typespec/compiler";
import { BasicTestRunner } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { resolveClients } from "../src/client-resolution.js";
import { createTypespecHttpClientTestRunner } from "./test-host.js";

let runner: BasicTestRunner;
describe("Explicit Client Resolution", () => {
  beforeEach(async () => {
    runner = await createTypespecHttpClientTestRunner();
  });

  it("ExplicitService_SingleRootClient", async () => {
    // Description:
    // A spec with exactly one top-level `@service` namespace and explicit @client.
    // Expect: that namespace becomes the sole root client.

    await runner.compile(`
      @service(#{
        title: "Single Root Client Service",
      })
      @client
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

  it("should use explicit client name", async () => {
    // Description:
    // A spec with exactly one top-level `@service` namespace and explicit @client.
    // Expect: that namespace becomes the sole root client.

    await runner.compile(`
      @service(#{
        title: "Single Root Client Service",
      })
      @client(#{name: "CustomClientName"})
      namespace SingleRoot {
        op getItems(): unknown[];
      }
    `);

    const clients = ignoreDiagnostics(resolveClients(runner.program));
    expect(clients).toHaveLength(1);
    const rootClient = clients[0];
    expect(rootClient).toBeDefined();
    expect(rootClient.name).toBe("CustomClientName");
  });

  it("ExplicitService_Client_Nested_Root", async () => {
    // Description:
    // A spec with exactly one top-level `@service` namespace with a child namespace and explicit @client.
    // Expect: The @client decorated namespace becomes the client.

    await runner.compile(`
      @service(#{
        title: "Single Root Client Service",
      })
      namespace NonClient {
        @client
        namespace Items {
           op getItems(): unknown[];
        }
      }
    `);

    const clients = ignoreDiagnostics(resolveClients(runner.program));
    expect(clients).toHaveLength(1);
    const rootClient = clients[0];
    expect(rootClient).toBeDefined();
    expect(rootClient.name).toBe("Items");
  });

  it("should create two root clients", async () => {
    // Description:
    // A spec with exactly one top-level `@service` namespace with a child namespace and explicit @client.
    // Expect: The @client decorated namespace becomes the client.

    await runner.compile(`
      @service(#{
        title: "Single Root Client Service",
      })
      namespace NonClient {
        @client
        @route("/items")
        namespace Items {
           op getItems(): unknown[];
        }

        @client
        @route("/services")
        namespace Services {
           op getServices(): unknown[];
        }
      }
    `);

    const clients = ignoreDiagnostics(resolveClients(runner.program));
    expect(clients).toHaveLength(2);
    const rootClient = clients[0];
    expect(rootClient).toBeDefined();
    expect(rootClient.name).toBe("Items");

    const secondClient = clients[1];
    expect(secondClient).toBeDefined();
    expect(secondClient.name).toBe("Services");
  });

  it("should resolve client and sub clients", async () => {
    // Description: A spec with one `@client` namespace and multiple implicit sub clients.
    // Expect: one root client + each operationGroup as a sub-client.

    await runner.compile(`
      @service(#{
        title: "Single Root Client Service",
      })
      @client
      namespace Client {
        namespace Items {
          op getItems(): unknown[];
        }
      }
    `);

    const clients = ignoreDiagnostics(resolveClients(runner.program));
    expect(clients).toHaveLength(1);
    const rootClient = clients[0];
    expect(rootClient).toBeDefined();
    expect(rootClient.name).toBe("Client");

    expect(rootClient.subClients).toHaveLength(1);
    const subClient = rootClient.subClients[0];
    expect(subClient).toBeDefined();
    expect(subClient.name).toBe("Items");
    expect(subClient.parent).toBe(rootClient);
  });

  it("should promote a nested @client to a top level client", async () => {
    // Description: A spec with a nested `@client` namespace.
    // Expect: the nested `@client` becomes a top-level client.

    await runner.compile(`
      @service(#{
        title: "Single Root Client Service",
      })
      namespace NonClient {
        @client
        namespace Items {
          op getItems(): unknown[];
          @client
          @route("/services")
          namespace Services {
            op getSubItems(): unknown[];
          }
        }
      }
    `);

    const clients = ignoreDiagnostics(resolveClients(runner.program));
    expect(clients).toHaveLength(2);
    const rootClient = clients[0];
    expect(rootClient).toBeDefined();
    expect(rootClient.name).toBe("Items");
    expect(rootClient.subClients).toHaveLength(0);
    expect(rootClient.parent).toBeUndefined();

    const secondClient = clients[1];
    expect(secondClient).toBeDefined();
    expect(secondClient.name).toBe("Services");
    expect(secondClient.subClients).toHaveLength(0);
    expect(secondClient.parent).toBeUndefined();
  });
});
