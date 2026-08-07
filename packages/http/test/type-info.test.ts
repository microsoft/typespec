import { t } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { $provideTypeInfo } from "../src/type-info.js";
import { Tester } from "./test-host.js";

describe("http: $provideTypeInfo", () => {
  it("surfaces the verb, URI template and response status codes for an operation", async () => {
    const { program, read } = await Tester.compile(t.code`
      @route("/pets/{id}") @get op ${t.op("read")}(@path id: string): void;
    `);

    expect($provideTypeInfo({ program, target: read })).toEqual({
      content: "`HTTP Route`: `GET /pets/{id}`\n\n`Responses`: `204`",
    });
  });

  it("returns undefined for non-operation types", async () => {
    const { program, Pet } = await Tester.compile(t.code`
      model ${t.model("Pet")} {}
    `);

    expect($provideTypeInfo({ program, target: Pet })).toBeUndefined();
  });

  it("formats a status code range", async () => {
    const { program, read } = await Tester.compile(t.code`
      @error model Error {
        @statusCode @minValue(400) @maxValue(499) code: int32;
      }
      @route("/pets") @get op ${t.op("read")}(): void | Error;
    `);

    expect($provideTypeInfo({ program, target: read })?.content).toContain(
      "`Responses`: `204`, `400-499`",
    );
  });

  it("formats a default (`*`) status code", async () => {
    const { program, read } = await Tester.compile(t.code`
      @error model Error { message: string; }
      @route("/pets") @get op ${t.op("read")}(): void | Error;
    `);

    expect($provideTypeInfo({ program, target: read })?.content).toContain(
      "`Responses`: `204`, `*`",
    );
  });

  // Guards against the hook being silently dropped: this exercises the real registration path
  // (binder + `type-info-provider` opt-in from this package's own `tspconfig.yaml`) rather than
  // calling `$provideTypeInfo` directly.
  it("is registered by the compiler so `program.getTypeInfo` returns the route", async () => {
    const { program, read } = await Tester.compile(t.code`
      @route("/pets/{id}") @get op ${t.op("read")}(@path id: string): void;
    `);

    expect(program.getTypeInfo(read)).toEqual({
      content: "`HTTP Route`: `GET /pets/{id}`\n\n`Responses`: `204`",
    });
  });
});
