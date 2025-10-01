import { ApiTester } from "#test/test-host.js";
import { t } from "@typespec/compiler/testing";
import { ok, strictEqual } from "assert";
import { describe, expect, it } from "vitest";
import { OperationIdStrategy } from "../lib.js";
import { OperationIdResolver } from "./operation-id-resolver.js";

async function testResolveOperationId(code: string, strategy: OperationIdStrategy) {
  const { foo, program } = await ApiTester.import("@typespec/openapi").compile(code);
  ok(foo);
  strictEqual(foo.entityKind, "Type");
  strictEqual(foo.kind, "Operation");
  const resolver = new OperationIdResolver(program, strategy);
  return resolver.resolve(foo);
}

describe("parent-underscore strategy", () => {
  it("return operation name if operation is defined at the root", async () => {
    const id = await testResolveOperationId(`@test op foo(): string;`, "parent-underscore");
    expect(id).toEqual("foo");
  });

  it("return operation name if operation is defined under service namespace", async () => {
    const id = await testResolveOperationId(
      `
      @service namespace MyService;

      @test op foo(): string;
    `,
      "parent-underscore",
    );
    expect(id).toEqual("foo");
  });

  it("return interface and operation name", async () => {
    const id = await testResolveOperationId(
      `
        interface Bar {
          @test op foo(): string;
        }
      `,
      "parent-underscore",
    );
    expect(id).toEqual("Bar_foo");
  });

  it("return namespace and operation name", async () => {
    const id = await testResolveOperationId(
      `
        @service namespace MyService;

        namespace Bar {
          @test op foo(): string;
        }
      `,
      "parent-underscore",
    );
    expect(id).toEqual("Bar_foo");
  });

  it("return one level of namespace only and operation name", async () => {
    const id = await testResolveOperationId(
      `
        @service namespace MyService;

        namespace Baz {
          namespace Bar {
            @test op foo(): string;
          }
        }
      `,
      "parent-underscore",
    );
    expect(id).toEqual("Bar_foo");
  });

  it("deduplicates operation IDs", async () => {
    const { op1, op2, program } = await ApiTester.compile(t.code`
      @service namespace MyService;

      namespace One {
        op /*op1*/test(): string;
      }

      namespace Two {
        interface One {
          /*op2*/test(): string;
        }
      }
    `);
    const resolver = new OperationIdResolver(program, "parent-underscore");
    expect(resolver.resolve(op1 as any)).toEqual("One_test");
    expect(resolver.resolve(op2 as any)).toEqual("One_test_2");
  });
});

describe("fqn", () => {
  it("return operation name if operation is defined at the root", async () => {
    const id = await testResolveOperationId(`@test op foo(): string;`, "fqn");
    expect(id).toEqual("foo");
  });

  it("return operation name if operation is defined under service namespace", async () => {
    const id = await testResolveOperationId(
      `
      @service namespace MyService;

      @test op foo(): string;
    `,
      "fqn",
    );
    expect(id).toEqual("foo");
  });

  it("return interface name and operation name", async () => {
    const id = await testResolveOperationId(
      `
        interface Bar {
          @test op foo(): string;
        }
      `,
      "fqn",
    );
    expect(id).toEqual("Bar.foo");
  });

  it("return namespace and operation name", async () => {
    const id = await testResolveOperationId(
      `
        @service namespace MyService;

        namespace Bar {
          @test op foo(): string;
        }
      `,
      "fqn",
    );
    expect(id).toEqual("Bar.foo");
  });

  it("returns full path", async () => {
    const id = await testResolveOperationId(
      `
        @service namespace MyService;

        namespace Baz {
          namespace Bar {
            @test op foo(): string;
          }
        }
      `,
      "fqn",
    );
    expect(id).toEqual("Baz.Bar.foo");
  });
});

describe("none", () => {
  it("return operationId explicitly set", async () => {
    const id = await testResolveOperationId(
      `@test @OpenAPI.operationId("explicit_foo") op foo(): string;`,
      "none",
    );
    expect(id).toEqual("explicit_foo");
  });
  it("return undefined", async () => {
    const id = await testResolveOperationId(`@test op foo(): string;`, "none");
    expect(id).toEqual(undefined);
  });
});
