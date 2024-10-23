import { expectDiagnostics } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { diagnoseOperations, getRoutesFor } from "./test-host.js";

describe("specify verb with each decorator", () => {
  it.each([
    ["@get", "get"],
    ["@post", "post"],
    ["@put", "put"],
    ["@patch", "patch"],
    ["@delete", "delete"],
    ["@head", "head"],
  ])("%s set verb to %s", async (dec, expected) => {
    const routes = await getRoutesFor(`${dec} op test(): string;`);
    expect(routes[0].verb).toBe(expected);
  });
});

describe("emit error when using 2 verb decorator together on the same node", () => {
  it.each([
    ["@get", "@post"],
    ["@post", "@put"],
  ])("%s", async (...decs) => {
    const diagnostics = await diagnoseOperations(`${decs.join(" ")} op test(): string;`);
    const diag = {
      code: "@typespec/http/http-verb-duplicate",
      message: "HTTP verb already applied to test",
    };
    expectDiagnostics(diagnostics, new Array(decs.length).fill(diag));
  });
});

it("allow overriding the verb specified in a base operation", async () => {
  const routes = await getRoutesFor(`
    @get op test<T>(): T;
    @head op ping is test<void>;  
    
  `);
  expect(routes[0].verb).toBe("head");
});
