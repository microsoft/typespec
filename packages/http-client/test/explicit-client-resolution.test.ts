import { ignoreDiagnostics } from "@typespec/compiler";
import { BasicTestRunner } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { resolveClients } from "../src/client-resolution.js";
import { createTypespecHttpClientTestRunner } from "./test-host.js";

describe("Explicit Client Resolution", () => {
  let runner: BasicTestRunner;
  beforeEach(async () => {
    runner = await createTypespecHttpClientTestRunner();
  });
  it("single explicit client", async () => {
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

  it("should use custom client name", async () => {
    // Description:
    // A spec with exactly one top-level `@service` namespace and explicit @client. It sets a custom name.
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

  it("should use custom client name when in scope", async () => {
    // Description:
    // A spec with exactly one top-level `@service` namespace and explicit @client. It sets a custom name.
    // Expect: that namespace becomes the sole root client.

    await runner.compile(`
      @service(#{
        title: "Single Root Client Service",
      })
      @client(#{name: "CustomClientName", emitterScope: "myEmitter"})
      namespace SingleRoot {
        op getItems(): unknown[];
      }
    `);

    const clients = ignoreDiagnostics(
      resolveClients(runner.program, { emitterScope: "myEmitter" }),
    );
    expect(clients).toHaveLength(1);
    const rootClient = clients[0];
    expect(rootClient).toBeDefined();
    expect(rootClient.name).toBe("CustomClientName");
  });

  it("should not use custom client name if not in scope", async () => {
    // Description:
    // A spec with exactly one top-level `@service` namespace and explicit @client. It sets a custom name.
    // Expect: that namespace becomes the sole root client.

    await runner.compile(`
      @service(#{
        title: "Single Root Client Service",
      })
      @client(#{name: "CustomClientName", emitterScope: "notme"})
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

  it("should not use custom client name if in different scope", async () => {
    // Description:
    // A spec with exactly one top-level `@service` namespace and explicit @client. It sets a custom name.
    // Expect: that namespace becomes the sole root client.

    await runner.compile(`
      @service(#{
        title: "Single Root Client Service",
      })
      @client(#{name: "CustomClientName", emitterScope: "notme"})
      namespace SingleRoot {
        op getItems(): unknown[];
      }
    `);

    const clients = ignoreDiagnostics(
      resolveClients(runner.program, { emitterScope: "myEmitter" }),
    );
    expect(clients).toHaveLength(1);
    const rootClient = clients[0];
    expect(rootClient).toBeDefined();
    expect(rootClient.name).toBe("SingleRoot");
  });

  it("explicit nested client becomes top level client", async () => {
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

  it("nested explicit clients are resolved as top level clients", async () => {
    // Description:
    // Explicit client is nested within another explicit client.
    // Expect: Both explicit clients are resolved as top-level clients.

    await runner.compile(`
      @service(#{
        title: "Single Root Client Service",
      })
      namespace NonClient;
        @client
        @route("/items")
        namespace Items {
           op getItems(): unknown[];
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

  it("should resolve implicit sub clients in explicit client", async () => {
    // Description: A spec with one `@client` namespace and multiple implicit sub clients.
    // Expect: one root client with implicitly resolved sub clients.

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

  it("all explicit clients @client become top level clients", async () => {
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
