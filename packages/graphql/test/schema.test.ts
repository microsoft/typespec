import { t } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { getSchema } from "../src/lib/schema.js";
import { Tester } from "./test-host.js";

describe("@schema", () => {
  it("Creates a schema with no name", async () => {
    const { program, TestNamespace } = await Tester.compile(t.code`
      @schema
      @test namespace ${t.namespace("TestNamespace")} {
        @query op health(): string;
      }
    `);

    const schema = getSchema(program, TestNamespace);

    expect(schema?.type).toBe(TestNamespace);
    expect(schema?.name).toBeUndefined();
  });

  it("Creates a schema with a specified name", async () => {
    const { program, TestNamespace } = await Tester.compile(t.code`
      @schema(#{name: "MySchema"})
      @test namespace ${t.namespace("TestNamespace")} {
        @query op health(): string;
      }
    `);

    const schema = getSchema(program, TestNamespace);

    expect(schema?.type).toBe(TestNamespace);
    expect(schema?.name).toBe("MySchema");
  });
});
