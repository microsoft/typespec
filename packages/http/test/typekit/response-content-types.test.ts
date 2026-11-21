import { Tester } from "#test/test-host.js";
import { t } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { expect, it } from "vitest";

import "../../src/experimental/typekit/index.js";

it("flattens every declared content type in a response header union", async () => {
  const { read, program } = await Tester.compile(t.code`
    model Doc { title: string; }

    @get op ${t.op("read")}(): {
      @header contentType: "application/openapi+json" | "application/json" | "application/problem+json";
      @body body: Doc;
    };
  `);

  const tk = $(program);
  const responses = tk.httpOperation.flattenResponses(tk.httpOperation.get(read));
  expect(responses.map((response) => response.contentType)).toEqual([
    "application/openapi+json",
    "application/json",
    "application/problem+json",
  ]);
  expect(responses.map((response) => response.statusCode)).toEqual([200, 200, 200]);
});

it("preserves the payload return type when content types share a body", async () => {
  const { read, Doc, program } = await Tester.compile(t.code`
    model ${t.model("Doc")} { title: string; }

    @get op ${t.op("read")}(): {
      @header contentType: "application/openapi+json" | "application/json";
      @body body: Doc;
    };
  `);

  const tk = $(program);
  expect(tk.httpOperation.getReturnType(tk.httpOperation.get(read))).toBe(Doc);
});

it("preserves default response content types when no header is declared", async () => {
  const { plain, empty, program } = await Tester.compile(t.code`
    @route("/plain") @get op ${t.op("plain")}(): string;
    @route("/empty") @get op ${t.op("empty")}(): void;
  `);
  const tk = $(program);
  expect(
    tk.httpOperation
      .flattenResponses(tk.httpOperation.get(plain))
      .map((response) => response.contentType),
  ).toEqual(["application/json"]);
  expect(
    tk.httpOperation
      .flattenResponses(tk.httpOperation.get(empty))
      .map((response) => response.contentType),
  ).toEqual([undefined]);
});
