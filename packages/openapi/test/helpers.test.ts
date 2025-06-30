import type { Operation } from "@typespec/compiler";
import { BasicTestRunner, createTestRunner } from "@typespec/compiler/testing";
import { strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { resolveOperationId } from "../src/helpers.js";

describe("openapi: helpers", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createTestRunner();
  });

  describe("resolveOperationId", () => {
    async function testResolveOperationId(code: string) {
      const { foo } = (await runner.compile(code)) as { foo: Operation };
      return resolveOperationId(runner.program, foo);
    }

    it("return operation name if operation is defined at the root", async () => {
      const id = await testResolveOperationId(`@test op foo(): string;`);
      strictEqual(id, "foo");
    });

    it("return operation name if operation is defined under service namespace", async () => {
      const id = await testResolveOperationId(`
        @service(#{title: "Abc"})
        namespace MyService;

        @test op foo(): string;
      `);
      strictEqual(id, "foo");
    });

    it("return group name and operation name if operation is defined under interface", async () => {
      const id = await testResolveOperationId(`
        interface Bar {
          @test op foo(): string;
        }
      `);
      strictEqual(id, "Bar_foo");
    });

    it("return group name and operation name if operation is defined under namespace that is not the service namespace", async () => {
      const id = await testResolveOperationId(`
        @service(#{title: "Abc"})
        namespace MyService;

        namespace Bar {
          @test op foo(): string;
        }
      `);
      strictEqual(id, "Bar_foo");
    });
  });
});
