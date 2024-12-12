import { Model, Operation } from "@typespec/compiler";
import { BasicTestRunner } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/experimental/typekit";
import { beforeEach, expect, it } from "vitest";
import { createHttpTestRunner } from "./../../test-host.js";

let runner: BasicTestRunner;

beforeEach(async () => {
  runner = await createHttpTestRunner();
});

it("should return true for an error response", async () => {
  const { getFoo } = (await runner.compile(`
    @test model Foo {
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
  expect($.httpResponse.isErrorResponse(responses[0].responseContent)).toBe(false);
  expect($.httpResponse.isErrorResponse(responses[1].responseContent)).toBe(true);
});

it("should identify a single  and default status code", async () => {
  const { getFoo } = (await runner.compile(`
    @test model Foo {
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

  const response = $.httpOperation.getResponses(getFoo)[0];
  const error = $.httpOperation.getResponses(getFoo)[1];
  expect($.httpResponse.statusCode.isSingle(response.statusCode)).toBe(true);
  expect($.httpResponse.statusCode.isDefault(error.statusCode)).toBe(true);
})

it("should identify a range status code", async () => {
  const { getFoo } = (await runner.compile(`
    @test model Foo {
       id: int32;
       age: int32;
       name: string;
       @minValue(455) @maxValue(495) @statusCode @statusCode _: int32
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

  const response = $.httpOperation.getResponses(getFoo)[0];
  const error = $.httpOperation.getResponses(getFoo)[1];
  expect($.httpResponse.statusCode.isRange(response.statusCode)).toBe(true);
  expect($.httpResponse.statusCode.isDefault(error.statusCode)).toBe(true);
})

