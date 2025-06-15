import { ignoreDiagnostics } from "@typespec/compiler";
import { BasicTestRunner } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { beforeEach, expect, it } from "vitest";
import { resolveClientInitialization } from "../src/client-initialization-resolution.js";
import { resolveClients } from "../src/client-resolution.js";
import { createTypespecHttpClientTestRunner } from "./test-host.js";

let runner: BasicTestRunner;

beforeEach(async () => {
  runner = await createTypespecHttpClientTestRunner();
});

it("implicit initialization resolution with no server", async () => {
  await runner.compile(`
    @service(#{
      title: "Single Root Client Service",
    })
    namespace Client {
      op getItems(): unknown[];
    }
  `);

  const client = ignoreDiagnostics(resolveClients(runner.program))[0];
  expect(client).toBeDefined();

  const clientInitialization = ignoreDiagnostics(
    resolveClientInitialization(runner.program, client),
  );
  expect(clientInitialization).toBeDefined();
  const endpoints = clientInitialization.endpoints;
  expect(endpoints).toHaveLength(1);
  expect(endpoints![0].url).toBe("{endpoint}");
  expect(endpoints![0].parameters).toHaveLength(0);
});

it("implicit initialization resolution with server", async () => {
  await runner.compile(`
    @service(#{
      title: "Single Root Client Service",
    })
    @server("https://api.example.com")
    namespace Client {
      op getItems(): unknown[];
    }
  `);

  const client = ignoreDiagnostics(resolveClients(runner.program))[0];
  expect(client).toBeDefined();

  const clientInitialization = ignoreDiagnostics(
    resolveClientInitialization(runner.program, client),
  );
  expect(clientInitialization).toBeDefined();
  const servers = clientInitialization.endpoints;
  expect(servers).toHaveLength(1);
  expect(servers![0].url).toBe("https://api.example.com");
  expect(servers![0].parameters).toHaveLength(0);
});

it("implicit initialization resolution with parametrized server", async () => {
  await runner.compile(`
    @service(#{
      title: "Single Root Client Service",
    })
    @server("{endpoint}", "", {endpoint: string})
    namespace Client {
      op getItems(): unknown[];
    }
  `);

  const client = ignoreDiagnostics(resolveClients(runner.program))[0];
  expect(client).toBeDefined();

  const clientInitialization = ignoreDiagnostics(
    resolveClientInitialization(runner.program, client),
  );
  expect(clientInitialization).toBeDefined();
  const servers = clientInitialization.endpoints;
  expect(servers).toHaveLength(1);
  expect(servers![0].url).toBe("{endpoint}");
  expect(servers![0].parameters).toHaveLength(1);

  const endpointParam = servers![0].parameters.get("endpoint");
  expect(endpointParam).toBeDefined();
  expect(endpointParam!.type).toBe($(runner.program).builtin.string);
  expect(endpointParam!.defaultValue).toBeUndefined();
  expect(endpointParam!.optional).toBe(false);
});

it("implicit initialization resolution with parametrized server with default", async () => {
  await runner.compile(`
    @service(#{
      title: "Single Root Client Service",
    })
    @server("{endpoint}", "", {endpoint: string = "https://api.example.com"})
    namespace Client {
      op getItems(): unknown[];
    }
  `);

  const client = ignoreDiagnostics(resolveClients(runner.program))[0];
  expect(client).toBeDefined();

  const clientInitialization = ignoreDiagnostics(
    resolveClientInitialization(runner.program, client),
  );
  expect(clientInitialization).toBeDefined();
  const servers = clientInitialization.endpoints;
  expect(servers).toHaveLength(1);
  expect(servers![0].url).toBe("{endpoint}");
  expect(servers![0].parameters).toHaveLength(1);
  const endpointParam = servers![0].parameters.get("endpoint");
  expect(endpointParam).toBeDefined();
  expect(endpointParam!.type).toBe($(runner.program).builtin.string);
  expect(endpointParam!.defaultValue).toBeDefined();
  expect((endpointParam!.defaultValue! as any).value).toBe("https://api.example.com");
  expect(endpointParam!.optional).toBe(false);
});

it("implicit initialization resolution with multiple parameters", async () => {
  await runner.compile(`
    @service(#{
      title: "Single Root Client Service",
    })
    @server("https://example.com/{resourceId}/{actionId}", "", {resourceId: int32, actionId: string})
    namespace Client {
      op getItems(): unknown[];
    }
  `);

  const client = ignoreDiagnostics(resolveClients(runner.program))[0];
  expect(client).toBeDefined();

  const clientInitialization = ignoreDiagnostics(
    resolveClientInitialization(runner.program, client),
  );
  expect(clientInitialization).toBeDefined();
  const endpoints = clientInitialization.endpoints;
  expect(endpoints).toHaveLength(1);
  expect(endpoints![0].url).toBe("https://example.com/{resourceId}/{actionId}");
  expect(endpoints![0].parameters).toHaveLength(2);
  const resourceIdParam = endpoints![0].parameters.get("resourceId");
  expect(resourceIdParam).toBeDefined();
  expect(resourceIdParam!.type).toBe($(runner.program).builtin.int32);
  expect(resourceIdParam!.defaultValue).toBeUndefined();
  expect(resourceIdParam!.optional).toBe(false);
  const actionIdParam = endpoints![0].parameters.get("actionId");
  expect(actionIdParam).toBeDefined();
  expect(actionIdParam!.type).toBe($(runner.program).builtin.string);
  expect(actionIdParam!.defaultValue).toBeUndefined();
  expect(actionIdParam!.optional).toBe(false);
});
