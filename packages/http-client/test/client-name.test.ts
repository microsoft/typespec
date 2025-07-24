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
  it("should have the original model name", async () => {
    await runner.compile(`
      @service(#{
        title: "Single Root Client Service",
      })
      namespace Test;
      op getFoo(): Foo;
      @test model Foo {
      }
    `);

    const clients = ignoreDiagnostics(resolveClients(runner.program));
    expect(clients).toHaveLength(1);
    const rootClient = clients[0];
    expect(rootClient).toBeDefined();
    const operations = [...rootClient.type.operations.values()];
    expect(operations).toHaveLength(1);
    expect(operations![0].name).toBe("getFoo");
    expect((operations![0].returnType as any).name).toBe("Foo");
  });

  it("should override the model name", async () => {
    await runner.compile(`
      @service(#{
        title: "Single Root Client Service",
      })
      namespace Test;

      op getFoo(): Foo;
      @clientName("CustomFoo")
      model Foo {
      }
    `);

    const clients = ignoreDiagnostics(resolveClients(runner.program));
    expect(clients).toHaveLength(1);
    const rootClient = clients[0];
    expect(rootClient).toBeDefined();
    const operations = [...rootClient.type.operations.values()];
    expect(operations).toHaveLength(1);
    expect(operations![0].name).toBe("getFoo");
    expect((operations![0].returnType as any).name).toBe("CustomFoo");
  });

  it("should override the model name when in scope", async () => {
    await runner.compile(`
      @service(#{
        title: "Single Root Client Service",
      })
      namespace Test;

      op getFoo(): Foo;
      @clientName("CustomFoo", #{emitterScope: "myEmitter"})
      model Foo {
      }
    `);

    const clients = ignoreDiagnostics(
      resolveClients(runner.program, { emitterScope: "myEmitter" }),
    );
    expect(clients).toHaveLength(1);
    const rootClient = clients[0];
    expect(rootClient).toBeDefined();
    const operations = [...rootClient.type.operations.values()];
    expect(operations).toHaveLength(1);
    expect(operations![0].name).toBe("getFoo");
    expect((operations![0].returnType as any).name).toBe("CustomFoo");
  });

  it("should not override the model name when not in scope", async () => {
    await runner.compile(`
      @service(#{
        title: "Single Root Client Service",
      })
      namespace Test;

      op getFoo(): Foo;
      @clientName("CustomFoo", #{emitterScope: "notMyEmitter"})
      model Foo {
      }
    `);

    const clients = ignoreDiagnostics(
      resolveClients(runner.program, { emitterScope: "myEmitter" }),
    );
    expect(clients).toHaveLength(1);
    const rootClient = clients[0];
    expect(rootClient).toBeDefined();
    const operations = [...rootClient.type.operations.values()];
    expect(operations).toHaveLength(1);
    expect(operations![0].name).toBe("getFoo");
    expect((operations![0].returnType as any).name).toBe("Foo");
  });
});
