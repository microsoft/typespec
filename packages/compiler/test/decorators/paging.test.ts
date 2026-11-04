import { describe, expect, it } from "vitest";
import { ignoreDiagnostics } from "../../src/index.js";
import type { PagingOperation } from "../../src/lib/paging.js";
import { getPagingOperation } from "../../src/lib/paging.js";
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
    ): {
      @pageItems items: string[];
      ${name === "continuationToken" ? "@continuationToken next?: string;" : ""}
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
      ): {
        @pageItems items: string[];
        ${name === "continuationToken" ? "@continuationToken next?: string;" : ""}
      };
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
      ): {
        @pageItems items: string[];
        ${name === "continuationToken" ? "@continuationToken next?: string;" : ""}
      };
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

describe("@continuationToken requires a response token for a request token", () => {
  it.each(["", "@nextLink next?: string;"])(
    "rejects a request token without a response token (%s)",
    async (response) => {
      const [{ token }, diagnostics] = await Tester.compileAndDiagnose(t.code`
        @list op list(@continuationToken ${t.modelProperty("token")}?: string): {
          @pageItems items: string[];
          ${response}
        };
      `);

      expectDiagnostics(diagnostics, {
        code: "missing-paging-continuation-token",
        severity: "error",
        message:
          "Paged operation 'list' has a @continuationToken parameter but no @continuationToken property in its return type.",
      });
      expect(diagnostics[0].target).toBe(token);
    },
  );

  it("finds request tokens in nested inherited properties", async () => {
    const [{ token }, diagnostics] = await Tester.compileAndDiagnose(t.code`
      model Options {
        @continuationToken ${t.modelProperty("token")}?: string;
      }
      model DerivedOptions extends Options {}
      @list op list(options: { paging: DerivedOptions }): {
        @pageItems items: string[];
        @nextLink next?: string;
      };
    `);

    expectDiagnostics(diagnostics, { code: "missing-paging-continuation-token" });
    expect(diagnostics[0].target).toBe(token);
  });

  it.each(["", "@nextLink next?: string;"])(
    "accepts paired tokens with nested inherited union responses (%s)",
    async (response) => {
      const diagnostics = await Tester.diagnose(`
        model Page {
          @pageItems items: string[];
          @continuationToken token?: string | null;
          ${response}
        }
        model DerivedPage extends Page {}
        @list op list(@continuationToken token?: string | null):
          { result: DerivedPage } | { error: string };
      `);

      expectDiagnosticEmpty(diagnostics);
    },
  );

  it("accepts next-link pagination with an undecorated request token", async () => {
    const diagnostics = await Tester.diagnose(`
      @list op list(token?: string): {
        @pageItems items: string[];
        @nextLink next?: string;
      };
    `);

    expectDiagnosticEmpty(diagnostics);
  });

  it("returns the diagnostic and metadata without requiring @list or reporting diagnostics", async () => {
    const { list, token, program } = await Tester.compile(t.code`
      op ${t.op("list")}(@continuationToken ${t.modelProperty("token")}?: string): {
        @pageItems items: string[];
        @nextLink next?: string;
      };
    `);

    const [paging, diagnostics] = getPagingOperation(program, list);

    expectDiagnostics(diagnostics, { code: "missing-paging-continuation-token" });
    expect(diagnostics[0].target).toBe(token);
    expect(paging?.input.continuationToken?.property).toBe(token);
    expect(paging?.output.nextLink).toBeDefined();
    expectDiagnosticEmpty(program.diagnostics);
  });

  it("preserves missing-page-items diagnostics and undefined metadata", async () => {
    const { list, program } = await Tester.compile(t.code`
      op ${t.op("list")}(@continuationToken token?: string): {
        @nextLink next?: string;
      };
    `);

    const [paging, diagnostics] = getPagingOperation(program, list);

    expect(paging).toBeUndefined();
    expectDiagnostics(diagnostics, { code: "missing-paging-items" });
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
      ): {
        @pageItems items: string[];
        @continuationToken next?: string | null;
      };
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
