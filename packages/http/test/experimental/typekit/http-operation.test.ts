import { expectDiagnostics, t } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { assert, describe, expect, it } from "vitest";
import { Tester } from "./../../test-host.js";

// Activate  Http TypeKit augmentation
import "../../../src/experimental/typekit/index.js";

describe("httpOperation:getResponses", () => {
  it("should get responses", async () => {
    const { getFoo, program } = await Tester.compile(t.code`
      model ${t.model("Foo")} {
        @visibility(Lifecycle.Create)
         id: int32;
         age: int32;
         name: string;
      }

      @error
      model ${t.model("Error")} {
        message: string;
        code: int32
      }

      @route("/foo")
      @get
      op ${t.op("getFoo")}(): Foo | Error;
    `);

    const httpOperation = $(program).httpOperation.get(getFoo);
    const responses = $(program).httpOperation.flattenResponses(httpOperation);
    expect(responses).toHaveLength(2);
    expect(responses[0].statusCode).toBe(200);
    expect(responses[0].contentType).toBe("application/json");
    expect(responses[1].statusCode).toBe("*");
    expect(responses[1].contentType).toBe("application/json");
  });

  it("should get responses with multiple status codes", async () => {
    const { getFoo, program } = await Tester.compile(t.code`
      model ${t.model("Foo")} {
        @visibility(Lifecycle.Create)
         id: int32;
         age: int32;
         name: string;
      }

      @route("/foo")
      @get
      op ${t.op("getFoo")}(): Foo | void;
    `);

    const httpOperation = $(program).httpOperation.get(getFoo);
    const responses = $(program).httpOperation.flattenResponses(httpOperation);
    expect(responses).toHaveLength(2);
    expect(responses[0].statusCode).toBe(200);
    expect(responses[0].contentType).toBe("application/json");
    expect(responses[1].statusCode).toBe(204);
    expect(responses[1].contentType).toBe(undefined);
  });

  it("should get responses with multiple status codes and contentTypes", async () => {
    const { getFoo, program } = await Tester.compile(t.code`
      model ${t.model("Foo")} {
        @visibility(Lifecycle.Create)
         id: int32;
         age: int32;
         name: string;
      }

      @error
      model ${t.model("Error")} {
        message: string;
        code: int32
      }

      @route("/foo")
      @get
      op ${t.op("getFoo")}(): Foo | {...Foo, @header contentType: "text/plain"} | Error;
    `);

    const httpOperation = $(program).httpOperation.get(getFoo);
    const responses = $(program).httpOperation.flattenResponses(httpOperation);
    expect(responses).toHaveLength(3);
    expect(responses[0].statusCode).toBe(200);
    expect(responses[0].contentType).toBe("application/json");
    expect(responses[1].statusCode).toBe(200);
    expect(responses[1].contentType).toBe("text/plain");
    expect(responses[2].statusCode).toBe("*");
    expect(responses[2].contentType).toBe("application/json");
  });
});

it("should get diagnostics from httpOperation.get", async () => {
  const [{ getFoo, program }, _] = await Tester.compileAndDiagnose(t.code`
    @route("/foo/{missing-param}")
    @get
    op ${t.op("getFoo")}(): void;
  `);

  assert.ok(getFoo.kind === "Operation");

  const [httpOperation, diagnostics] = $(program).httpOperation.get.withDiagnostics(getFoo);

  expect(httpOperation).toBeDefined();
  expectDiagnostics(diagnostics, {
    code: "@typespec/http/missing-uri-param",
  });
});
