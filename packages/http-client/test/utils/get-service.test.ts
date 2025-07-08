import { ignoreDiagnostics, Namespace } from "@typespec/compiler";
import { BasicTestRunner } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { resolveClients } from "../../src/client-resolution.js";
import { Client } from "../../src/interfaces.js";
import { getService } from "../../src/utils/client-server-helpers.js";
import { createTypespecHttpClientTestRunner } from "../test-host.js";

let runner: BasicTestRunner;
describe("client-server-helpers::getService", () => {
  beforeEach(async () => {
    runner = await createTypespecHttpClientTestRunner();
  });

  it("should return undefined for a client with no service", async () => {
    // This should be unreachable in practice, because client resolution needs a service to resolve.
    const { MyService } = (await runner.compile(`
      @test namespace MyService {
        op getItems(): unknown[];
      }
    `)) as { MyService: Namespace };

    const client: Client = {
      kind: "client",
      type: MyService,
      name: "MyService",
      subClients: [],
      parent: undefined,
    };
    const service = getService(runner.program, client);
    expect(service).toBeUndefined();
  });

  it("simple client with service", async () => {
    const { MyService } = (await runner.compile(`
      @service @test namespace MyService {
        op getItems(): unknown[];
      }
    `)) as { MyService: Namespace };

    const client = ignoreDiagnostics(resolveClients(runner.program))[0];
    const service = getService(runner.program, client);
    expect(service).toBeDefined();
    expect(service!.type).toBe(MyService);
  });

  it("simple subclient nested within service", async () => {
    const { MyService } = (await runner.compile(`
      @service @test namespace MyService {
        namespace SubClient {
        op getItems(): unknown[];
        }
      }
    `)) as { MyService: Namespace };

    const client = ignoreDiagnostics(resolveClients(runner.program))[0];
    const subClient = client.subClients[0];
    expect(subClient).toBeDefined();
    const service = getService(runner.program, subClient);
    expect(service).toBeDefined();
    expect(service!.type).toBe(MyService);
  });

  it("explicit client nested within service", async () => {
    const { MyService } = (await runner.compile(`
      @service @test namespace MyService {
        @client namespace SubClient {
        op getItems(): unknown[];
        }
      }
    `)) as { MyService: Namespace };

    const clients = ignoreDiagnostics(resolveClients(runner.program));
    expect(clients).toHaveLength(1);
    const client = clients[0];
    const service = getService(runner.program, client);
    expect(service).toBeDefined();
    expect(service!.type).toBe(MyService);
  });
});
