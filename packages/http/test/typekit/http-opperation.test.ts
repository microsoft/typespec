import { Model, Operation } from "@typespec/compiler";
import { BasicTestRunner } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { beforeEach, describe, expect, it } from "vitest";
import "../../src/typekit/index.js";
import { createHttpTestRunner } from "./../test-host.js";

let runner: BasicTestRunner;

beforeEach(async () => {
  runner = await createHttpTestRunner();
});

describe("httpOperation:getResponses", () => {
  it("should get responses", async () => {
    const { getFoo } = (await runner.compile(`
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

    const responses = $.httpOperation.getResponses(getFoo);
    expect(responses).toHaveLength(2);
    expect(responses[0].statusCode).toBe(200);
    expect(responses[0].contentType).toBe("application/json");
    expect(responses[1].statusCode).toBe("*");
    expect(responses[1].contentType).toBe("application/json");
  });

  it("should get responses with multiple status codes", async () => {
    const { getFoo } = (await runner.compile(`
      @test model Foo {
        @visibility("create")
         id: int32;
         age: int32;
         name: string;
      }

      @route("/foo")
      @get
      @test op getFoo(): Foo | void;
    `)) as { getFoo: Operation; Foo: Model; Error: Model };

    const responses = $.httpOperation.getResponses(getFoo);
    expect(responses).toHaveLength(2);
    expect(responses[0].statusCode).toBe(200);
    expect(responses[0].contentType).toBe("application/json");
    expect(responses[1].statusCode).toBe(204);
    expect(responses[1].contentType).toBe(undefined);
  });

  it("should get responses with multiple status codes and contentTypes", async () => {
    const { getFoo } = (await runner.compile(`
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
      @test op getFoo(): Foo | {...Foo, @header contentType: "text/plain"} | Error;
    `)) as { getFoo: Operation; Foo: Model; Error: Model };

    const responses = $.httpOperation.getResponses(getFoo);
    expect(responses).toHaveLength(3);
    expect(responses[0].statusCode).toBe(200);
    expect(responses[0].contentType).toBe("application/json");
    expect(responses[1].statusCode).toBe(200);
    expect(responses[1].contentType).toBe("text/plain");
    expect(responses[2].statusCode).toBe("*");
    expect(responses[2].contentType).toBe("application/json");
  });
});
