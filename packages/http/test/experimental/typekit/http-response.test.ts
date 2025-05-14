import { t } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { expect, it } from "vitest";
import { Tester } from "./../../test-host.js";

// Activate  Http TypeKit augmentation
import "../../../src/experimental/typekit/index.js";

it("should return true for an error response", async () => {
  const { getFoo, program } = await Tester.compile(t.code`
    model ${t.model("Foo")} {
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
  expect(tk.httpResponse.isErrorResponse(responses[0])).toBe(false);
  expect(tk.httpResponse.isErrorResponse(responses[1])).toBe(true);
});

it("should identify a single  and default status code", async () => {
  const { getFoo, program } = await Tester.compile(t.code`
    model ${t.model("Foo")} {
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
  const response = responses[0];
  const error = responses[1];
  expect(tk.httpResponse.statusCode.isSingle(response.statusCode)).toBe(true);
  expect(tk.httpResponse.statusCode.isDefault(error.statusCode)).toBe(true);
});

it("should identify a range status code", async () => {
  const { getFoo, program } = await Tester.compile(t.code`
    model ${t.model("Foo")} {
       id: int32;
       age: int32;
       name: string;
       @minValue(455) @maxValue(495) @statusCode @statusCode _: int32
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
  const response = responses[0];
  const error = responses[1];
  expect(tk.httpResponse.statusCode.isRange(response.statusCode)).toBe(true);
  expect(tk.httpResponse.statusCode.isDefault(error.statusCode)).toBe(true);
});
