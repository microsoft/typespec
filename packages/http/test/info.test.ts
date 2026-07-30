import { t } from "@typespec/compiler/testing";
import { deepStrictEqual } from "assert";
import { describe, it } from "vitest";
import { $onInfo } from "../src/info.js";
import { Tester } from "./test-host.js";

describe("http: $onInfo", () => {
  it("surfaces the verb, URI template and response status codes for an operation", async () => {
    const { program, read } = await Tester.compile(t.code`
      @route("/pets/{id}") @get op ${t.op("read")}(@path id: string): void;
    `);

    deepStrictEqual($onInfo({ program, target: read }), {
      content: "`HTTP Route`: `GET /pets/{id}`\n\n`Responses`: `204`",
    });
  });

  it("returns undefined for non-operation types", async () => {
    const { program, Pet } = await Tester.compile(t.code`
      model ${t.model("Pet")} {}
    `);

    deepStrictEqual($onInfo({ program, target: Pet }), undefined);
  });
});
