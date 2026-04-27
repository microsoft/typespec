import { describe, expect, it } from "vitest";
import { ignoreDiagnostics } from "../../src/index.js";
import { getPagingOperation, PagingOperation } from "../../src/lib/paging.js";
import { expectDiagnosticEmpty, expectDiagnostics } from "../../src/testing/expect.js";
import { t } from "../../src/testing/index.js";
import { Tester } from "../tester.js";

it("emit conflict diagnostic if annotating property with different paging property marker", async () => {
  const diagnostics = await Tester.diagnose(`
    @list op list(): {
      @pageItems items: string[];
      @nextLink @prevLink next: string;
    };
  `);

  expectDiagnostics(diagnostics, {
    code: "incompatible-paging-props",
    message: `Paging property has multiple types: 'nextLink, prevLink'`,
  });
});

it("emit error if missing pageItems property", async () => {
  const diagnostics = await Tester.diagnose(`
    @list op list(): {
      items: string[];
      @nextLink next: string;
    };
  `);

  expectDiagnostics(diagnostics, {
    code: "missing-paging-items",
    message: `Paged operation 'list' return type must have a property annotated with @pageItems.`,
  });
});

it("identifies inherited paging properties", async () => {
  const diagnostics = await Tester.diagnose(`
    model ListTestResult {
      @pageItems
      values: string[];
    }
    model ExtendedListTestResult extends ListTestResult {}

    @list op testOp(): ExtendedListTestResult;
  `);

  expectDiagnosticEmpty(diagnostics);
});

it("@list decorator handle recursive models without infinite loop", async () => {
  const diagnostics = await Tester.diagnose(`
      model MyPage {
        selfRef?: MyPage;
        @pageItems items: string[];
        @nextLink next: string;
      }

      @list op foo(): MyPage;
    `);
  expectDiagnosticEmpty(diagnostics);
});

describe("emit conflict diagnostic if multiple properties are annotated with the same property marker", () => {
  it.each([
    ["offset", "int32"],
    ["pageSize", "int32"],
    ["pageIndex", "int32"],
    ["continuationToken", "string"],
  ])("@%s", async (name, type) => {
    const diagnostics = await Tester.diagnose(`
    @list op list(
      @${name} prop1: ${type};
      @${name} prop2: ${type};
    ): { @pageItems items: string[] };
  `);

    expectDiagnostics(diagnostics, [
      {
        code: "duplicate-paging-prop",
        message: `Duplicate property paging '${name}' for operation list.`,
      },
      {
        code: "duplicate-paging-prop",
        message: `Duplicate property paging '${name}' for operation list.`,
      },
    ]);
  });

  it.each([
    ["nextLink", "string"],
    ["prevLink", "string"],
    ["firstLink", "string"],
    ["lastLink", "string"],
    ["continuationToken", "string"],
    ["pageItems", "string[]"],
  ])("@%s", async (name, type) => {
    const diagnostics = await Tester.diagnose(`
    @list op list(): {
      @${name} next: ${type};
      @${name} nextToo: ${type};
      ${name !== "pageItems" ? "@pageItems items: string[];" : ""}
    };
  `);

    expectDiagnostics(diagnostics, [
      {
        code: "duplicate-paging-prop",
        message: `Duplicate property paging '${name}' for operation list.`,
      },
      {
        code: "duplicate-paging-prop",
        message: `Duplicate property paging '${name}' for operation list.`,
      },
    ]);
  });
});

describe("collect paging properties", () => {
  it.each([
    ["offset", "int32"],
    ["pageSize", "int32"],
    ["pageIndex", "int32"],
    ["continuationToken", "string"],
  ])("@%s", async (name, type) => {
    const { list, prop, program } = await Tester.compile(t.code`
      @list op ${t.op("list")}(
        @${name} ${t.modelProperty("prop")}: ${type};
      ): { @pageItems items: string[] };
    `);

    const paging = ignoreDiagnostics(getPagingOperation(program, list));
    expect(paging?.input).toHaveProperty(name);
    expect(paging?.input[name as keyof PagingOperation["input"]]!.property).toBe(prop);
  });

  it.each([
    ["nextLink", "string"],
    ["prevLink", "string"],
    ["firstLink", "string"],
    ["lastLink", "string"],
    ["continuationToken", "string"],
    ["pageItems", "string[]"],
  ])("@%s", async (name, type) => {
    const { list, prop, program } = await Tester.compile(t.code`
        @list op ${t.op("list")}(): {
          @${name} ${t.modelProperty("prop")}: ${type};
          ${name !== "pageItems" ? "@pageItems items: string[];" : ""}
        };
      `);

    const paging = ignoreDiagnostics(getPagingOperation(program, list));
    expect(paging?.output).toHaveProperty(name);
    expect(paging?.output[name as keyof PagingOperation["output"]]!.property).toBe(prop);
  });
});

describe("collect nested paging properties", () => {
  it.each([
    ["offset", "int32"],
    ["pageSize", "int32"],
    ["pageIndex", "int32"],
    ["continuationToken", "string"],
  ])("@%s", async (name, type) => {
    const { list, prop, program } = await Tester.compile(t.code`
      @list op ${t.op("list")}(
        @${name} ${t.modelProperty("prop")}: ${type};
      ): { @pageItems items: string[] };
    `);

    const paging = ignoreDiagnostics(getPagingOperation(program, list));
    expect(paging?.input).toHaveProperty(name);
    expect(paging?.input[name as keyof PagingOperation["input"]]!.property).toBe(prop);
  });

  it.each([
    ["nextLink", "string"],
    ["prevLink", "string"],
    ["firstLink", "string"],
    ["lastLink", "string"],
    ["continuationToken", "string"],
  ])("@%s", async (name, type) => {
    const { list, prop, program } = await Tester.compile(t.code`
        @list op ${t.op("list")}(): {
          results : { @pageItems items: string[]; };
          pagination: { @${name} ${t.modelProperty("prop")}: ${type} };
        };
      `);

    const paging = ignoreDiagnostics(getPagingOperation(program, list));
    expect(paging?.output).toHaveProperty(name);
    expect(paging?.output[name as keyof PagingOperation["output"]]!.property).toBe(prop);
    const pathString = paging?.output[name as keyof PagingOperation["output"]]!.path.map(
      (p) => p.name,
    ).join(".");
    expect(pathString).toBe("pagination.prop");
  });

  it("nested @pageItem", async () => {
    const { list, program } = await Tester.compile(t.code`
        @list op ${t.op("list")}(): {
          results : { @pageItems items: string[]; };
        };
      `);

    const paging = ignoreDiagnostics(getPagingOperation(program, list));
    const pathString = paging?.output["pageItems"]!.path.map((p) => p.name).join(".");
    expect(pathString).toBe("results.items");
  });
});

describe("@continuationToken supports nullable and optional properties", () => {
  it("accepts nullable string type (string | null)", async () => {
    const diagnostics = await Tester.diagnose(`
      @list op list(): {
        @pageItems items: string[];
        @continuationToken token: string | null;
      };
    `);
    expectDiagnosticEmpty(diagnostics);
  });

  it("accepts optional string type", async () => {
    const diagnostics = await Tester.diagnose(`
      @list op list(): {
        @pageItems items: string[];
        @continuationToken token?: string;
      };
    `);
    expectDiagnosticEmpty(diagnostics);
  });

  it("accepts nullable optional string type", async () => {
    const diagnostics = await Tester.diagnose(`
      @list op list(): {
        @pageItems items: string[];
        @continuationToken token?: string | null;
      };
    `);
    expectDiagnosticEmpty(diagnostics);
  });

  it("accepts non-string types", async () => {
    const diagnostics = await Tester.diagnose(`
      @list op list(): {
        @pageItems items: string[];
        @continuationToken token: int32;
      };
    `);
    expectDiagnosticEmpty(diagnostics);
  });

  it("collects nullable continuation token in input", async () => {
    const { list, token, program } = await Tester.compile(t.code`
      @list op ${t.op("list")}(
        @continuationToken ${t.modelProperty("token")}: string | null
      ): { @pageItems items: string[] };
    `);

    const paging = ignoreDiagnostics(getPagingOperation(program, list));
    expect(paging?.input.continuationToken?.property).toBe(token);
  });

  it("collects nullable continuation token in output", async () => {
    const { list, token, program } = await Tester.compile(t.code`
      @list op ${t.op("list")}(): {
        @pageItems items: string[];
        @continuationToken ${t.modelProperty("token")}: string | null;
      };
    `);

    const paging = ignoreDiagnostics(getPagingOperation(program, list));
    expect(paging?.output.continuationToken?.property).toBe(token);
  });

  it("collects optional continuation token", async () => {
    const { list, token, program } = await Tester.compile(t.code`
      @list op ${t.op("list")}(): {
        @pageItems items: string[];
        @continuationToken ${t.modelProperty("token")}?: string;
      };
    `);

    const paging = ignoreDiagnostics(getPagingOperation(program, list));
    expect(paging?.output.continuationToken?.property).toBe(token);
  });
});
