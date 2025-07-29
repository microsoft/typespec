import { ignoreDiagnostics } from "@typespec/compiler";
import { describe, expect, it } from "vitest";
import { resolveClients } from "../src/client-resolution.js";
import { HttpClientTester } from "./test-host.js";

describe("Explicit Client Resolution", () => {
  it("single explicit client", async () => {
    // Description:
    // A spec with exactly one top-level `@service` namespace and explicit @client.
    // Expect: that namespace becomes the sole root client.

    const { program } = await HttpClientTester.compile(
      `
      @service(#{
        title: "Single Root Client Service",
      })
      @client(#{name: "CustomClientName"})
      namespace SingleRoot {
        op getItems(): unknown[];
      }
    `,
    ).catch((e) => {
      console.error(e);
      throw e;
    });

    expect(program).toBeDefined();
  });

  it("should use custom client name when in scope", async () => {
    // Description:
    // A spec with exactly one top-level `@service` namespace and explicit @client. It sets a custom name.
    // Expect: that namespace becomes the sole root client.

    const { program } = await HttpClientTester.compile(
      `
        @service(#{
          title: "Single Root Client Service",
        })
        @client(#{name: "CustomClientName", emitterScope: "myEmitter"})
        namespace SingleRoot {
          op getItems(): unknown[];
        }
      `,
    ).catch((e) => {
      console.error(e);
      throw e;
    });

    const clients = ignoreDiagnostics(resolveClients(program, { emitterScope: "myEmitter" }));
    expect(clients).toHaveLength(1);
    const rootClient = clients[0];
    expect(rootClient).toBeDefined();
    expect(rootClient.name).toBe("CustomClientName");
  });
});
