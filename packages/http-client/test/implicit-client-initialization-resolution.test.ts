import { ignoreDiagnostics, StringLiteral } from "@typespec/compiler";
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
  expect(clientInitialization.parameters).toHaveLength(1);
  expect(clientInitialization.parameters[0].name).toBe("endpoint");
  expect(clientInitialization.parameters[0].type).toBe($(runner.program).builtin.string);
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
  expect(clientInitialization.parameters).toHaveLength(1);
  expect(clientInitialization.parameters[0].name).toBe("endpoint");
  expect(clientInitialization.parameters[0].type).toBe($(runner.program).builtin.string);
  expect(clientInitialization.parameters[0].defaultValue).toBeDefined();
  expect(clientInitialization.parameters[0].optional).toBe(true);
  expect((clientInitialization.parameters[0].defaultValue!.type as StringLiteral).value).toBe(
    "https://api.example.com",
  );
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
  expect(clientInitialization.parameters).toHaveLength(2);
  expect(clientInitialization.parameters[0].name).toBe("endpoint");
  expect(clientInitialization.parameters[0].type).toBe($(runner.program).builtin.string);
  expect(clientInitialization.parameters[0].defaultValue).toBeDefined();
  expect((clientInitialization.parameters[0].defaultValue!.type as StringLiteral).value).toBe(
    "{endpoint}",
  );
  expect(clientInitialization.parameters[0].optional).toBe(true);

  const endpointParam = clientInitialization.parameters[1];
  expect(endpointParam.name).toBe("endpoint");
  expect(endpointParam.type).toBe($(runner.program).builtin.string);
  expect(endpointParam.optional).toBe(false);
  expect(endpointParam.defaultValue).toBeUndefined();
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
  expect(clientInitialization.parameters).toHaveLength(2);
  expect(clientInitialization.parameters[0].name).toBe("endpoint");
  expect(clientInitialization.parameters[0].type).toBe($(runner.program).builtin.string);
  expect(clientInitialization.parameters[0].defaultValue).toBeDefined();
  expect((clientInitialization.parameters[0].defaultValue!.type as StringLiteral).value).toBe(
    "{endpoint}",
  );
  expect(clientInitialization.parameters[0].optional).toBe(true);

  const endpointParam = clientInitialization.parameters[1];
  expect(endpointParam.name).toBe("endpoint");
  expect(endpointParam.type).toBe($(runner.program).builtin.string);
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
  expect(clientInitialization.parameters).toHaveLength(3);
  expect(clientInitialization.parameters[0].name).toBe("endpoint");
  expect(clientInitialization.parameters[0].type).toBe($(runner.program).builtin.string);
  expect(clientInitialization.parameters[0].defaultValue).toBeDefined();
  expect((clientInitialization.parameters[0].defaultValue!.type as StringLiteral).value).toBe(
    "https://example.com/{resourceId}/{actionId}",
  );
  expect(clientInitialization.parameters[0].optional).toBe(true);
  expect(clientInitialization.parameters[1].name).toBe("resourceId");
  expect(clientInitialization.parameters[1].type).toBe($(runner.program).builtin.int32);
  expect(clientInitialization.parameters[2].name).toBe("actionId");
  expect(clientInitialization.parameters[2].type).toBe($(runner.program).builtin.string);
});
