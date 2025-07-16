import { ignoreDiagnostics, Operation } from "@typespec/compiler";
import { BasicTestRunner } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { resolveClients } from "../../src/client-resolution.js";
import {
  resolveClientAuthentication,
  resolveClientOperationAuthentication,
} from "../../src/utils/auth-resolution.js";
import { createTypespecHttpClientTestRunner } from "../test-host.js";

let runner: BasicTestRunner;
describe("Auth Resolution Tests", () => {
  beforeEach(async () => {
    runner = await createTypespecHttpClientTestRunner();
  });
  it("operations with no auth", async () => {
    const { getItems } = (await runner.compile(`
      @service namespace ImplicitClient {
        @test op getItems(): unknown[];
      }
    `)) as { getItems: Operation };
    const client = ignoreDiagnostics(resolveClients(runner.program))[0];
    const auth = resolveClientAuthentication(runner.program, client);
    expect(auth).toBeUndefined();

    const operationAuth = resolveClientOperationAuthentication(runner.program, getItems);
    expect(operationAuth).toBeUndefined();
  });
  it("operations inherits client auth", async () => {
    const { one, two } = (await runner.compile(`
      @useAuth(BasicAuth)
      @service
      namespace MyService;

      @test @get op one(): void;
      @test @post op two(): void;`)) as { one: Operation; two: Operation };

    const client = ignoreDiagnostics(resolveClients(runner.program))[0];
    const auth = resolveClientAuthentication(runner.program, client);
    expect(auth).toBeDefined();
    expect(auth!.options).toHaveLength(1);
    expect(auth!.options[0].schemes).toHaveLength(1);
    expect(auth!.options[0].schemes[0].id).toBe("BasicAuth");

    const oneAuth = resolveClientOperationAuthentication(runner.program, one);
    expect(oneAuth).toBeDefined();
    expect(oneAuth!.options).toHaveLength(1);
    expect(oneAuth!.options[0].schemes).toHaveLength(1);
    expect(oneAuth!.options[0].schemes[0].id).toBe("BasicAuth");

    const twoAuth = resolveClientOperationAuthentication(runner.program, two);
    expect(twoAuth).toBeDefined();
    expect(twoAuth!.options).toHaveLength(1);
    expect(twoAuth!.options[0].schemes).toHaveLength(1);
    expect(twoAuth!.options[0].schemes[0].id).toBe("BasicAuth");
  });
  it("operation overriding authentication", async () => {
    const { one, two } = (await runner.compile(`
      @useAuth(BasicAuth)
      @service
      namespace MyService;

      @useAuth(ApiKeyAuth<ApiKeyLocation.query, "api_key">)
      @test @get op one(): void;
      @test @post op two(): void;`)) as { one: Operation; two: Operation };

    const client = ignoreDiagnostics(resolveClients(runner.program))[0];
    const auth = resolveClientAuthentication(runner.program, client);
    expect(auth).toBeDefined();
    expect(auth!.options).toHaveLength(1);
    expect(auth!.options[0].schemes).toHaveLength(1);
    expect(auth!.options[0].schemes[0].id).toBe("BasicAuth");

    const oneAuth = resolveClientOperationAuthentication(runner.program, one);
    expect(oneAuth).toBeDefined();
    expect(oneAuth!.options).toHaveLength(1);
    expect(oneAuth!.options[0].schemes).toHaveLength(1);
    expect(oneAuth!.options[0].schemes[0].id).toBe("ApiKeyAuth");

    const twoAuth = resolveClientOperationAuthentication(runner.program, two);
    expect(twoAuth).toBeDefined();
    expect(twoAuth!.options).toHaveLength(1);
    expect(twoAuth!.options[0].schemes).toHaveLength(1);
    expect(twoAuth!.options[0].schemes[0].id).toBe("BasicAuth");
  });

  it("Implicit client with no authentication", async () => {
    await runner.compile(`
      @service namespace ImplicitClient {
        op getItems(): unknown[];
      }
    `);

    const clients = ignoreDiagnostics(resolveClients(runner.program));
    expect(clients).toHaveLength(1);
    const client = clients[0];
    const auth = resolveClientAuthentication(runner.program, client);

    expect(auth).toBeUndefined();
  });

  it("Implicit client inherits authentication from service", async () => {
    await runner.compile(`
      @useAuth(BasicAuth)
      @service namespace ImplicitClient {
        op getItems(): unknown[];
      }
    `);

    const clients = ignoreDiagnostics(resolveClients(runner.program));
    expect(clients).toHaveLength(1);
    const client = clients[0];
    const auth = resolveClientAuthentication(runner.program, client);

    expect(auth).toBeDefined();
    expect(auth!.options).toHaveLength(1);
    expect(auth!.options[0].schemes).toHaveLength(1);
    expect(auth!.options[0].schemes[0].id).toBe("BasicAuth");
  });

  it("Explicit client inherits authentication from service", async () => {
    await runner.compile(`
      @useAuth(BasicAuth)
      @service namespace NonClient {
        @client
        namespace ExplicitClient {
          op getItems(): unknown[];
        }
      }
    `);

    const clients = ignoreDiagnostics(resolveClients(runner.program));
    expect(clients).toHaveLength(1);
    const client = clients[0];
    const auth = resolveClientAuthentication(runner.program, client);

    expect(auth).toBeDefined();
    expect(auth!.options).toHaveLength(1);
    expect(auth!.options[0].schemes).toHaveLength(1);
    expect(auth!.options[0].schemes[0].id).toBe("BasicAuth");
  });

  it("Explicit client overrides service authentication", async () => {
    await runner.compile(`
      @useAuth(BasicAuth)
      @service namespace NonClient {
        @client
        @useAuth(NoAuth)
        namespace ExplicitClient {
          op getItems(): unknown[];
        }
      }
    `);
    const clients = ignoreDiagnostics(resolveClients(runner.program));
    expect(clients).toHaveLength(1);
    const client = clients[0];
    const auth = resolveClientAuthentication(runner.program, client);

    expect(auth).toBeDefined();
    expect(auth!.options).toHaveLength(1);
    expect(auth!.options[0].schemes).toHaveLength(1);
    expect(auth!.options[0].schemes[0].id).toBe("NoAuth");
  });

  it("Implicit subclient overrides service authentication", async () => {
    await runner.compile(`
      @useAuth(BasicAuth)
      @service namespace NonClient {
        @useAuth(NoAuth)
        namespace ExplicitClient {
          op getItems(): unknown[];
        }
      }
    `);
    const clients = ignoreDiagnostics(resolveClients(runner.program));
    expect(clients).toHaveLength(1);
    const rootClient = clients[0];
    const rootAuth = resolveClientAuthentication(runner.program, rootClient);

    expect(rootAuth).toBeDefined();
    expect(rootAuth!.options).toHaveLength(1);
    expect(rootAuth!.options[0].schemes).toHaveLength(1);
    expect(rootAuth!.options[0].schemes[0].id).toBe("BasicAuth");

    const subClient = rootClient.subClients[0];
    const subAuth = resolveClientAuthentication(runner.program, subClient);
    expect(subAuth).toBeDefined();
    expect(subAuth!.options).toHaveLength(1);
    expect(subAuth!.options[0].schemes).toHaveLength(1);
    expect(subAuth!.options[0].schemes[0].id).toBe("NoAuth");
  });
});
