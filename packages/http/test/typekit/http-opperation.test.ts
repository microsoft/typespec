import { Model, Operation } from "@typespec/compiler";
import { BasicTestRunner } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { strictEqual } from "assert";
import { beforeEach, describe, expect, it } from "vitest";
import "../../src/typekit/index.js";
import { createHttpTestRunner } from "./../test-host.js";

describe("http: overloads", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createHttpTestRunner();
  });

  it("should get httpOperation", async () => {
    const { getFoo, Foo, Error } = (await runner.compile(`
      @test model Foo {
        @visibility("create")
         id: int32;
         age: int32;
         name: string;
      }

      @error
      @test model Error {
        message: string;
        code: int32
      }

      @route("/foo")
      @get
      @test op getFoo(): Foo | Error;
    `)) as { getFoo: Operation; Foo: Model; Error: Model };

    const getHttpOperation = $.httpOperation.get(getFoo);

    strictEqual(getHttpOperation.path, "/foo");
    strictEqual(getHttpOperation.verb, "get");
    // Should have 2 status codes
    expect(getHttpOperation.responses).toHaveLength(2);
    expect(getHttpOperation.responses[0].statusCodes).toBe(200);
    expect(getHttpOperation.responses[1].statusCodes).toBe("*");

    const statusCode200Response = getHttpOperation.responses[0];
    const statusCodeDefaultResponse = getHttpOperation.responses[1];

    expect(statusCode200Response.type).toBe(Foo);
    expect(statusCodeDefaultResponse.type).toBe(Error);
  });
});
