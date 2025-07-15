import { t } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { describe, expect, it } from "vitest";
import "../../src/experimental/typekit/index.js";
import { Tester } from "./../test-host.js";

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
    const tk = $(program);

    const httpOperation = tk.httpOperation.get(getFoo);
    const responses = tk.httpOperation.flattenResponses(httpOperation);
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
    const tk = $(program);

    const httpOperation = tk.httpOperation.get(getFoo);
    const responses = tk.httpOperation.flattenResponses(httpOperation);
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
    const tk = $(program);

    const httpOperation = tk.httpOperation.get(getFoo);
    const responses = tk.httpOperation.flattenResponses(httpOperation);
    expect(responses).toHaveLength(3);
    expect(responses[0].statusCode).toBe(200);
    expect(responses[0].contentType).toBe("application/json");
    expect(responses[1].statusCode).toBe(200);
    expect(responses[1].contentType).toBe("text/plain");
    expect(responses[2].statusCode).toBe("*");
    expect(responses[2].contentType).toBe("application/json");
  });
});
