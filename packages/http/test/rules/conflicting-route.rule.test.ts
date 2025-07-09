import { createLinterRuleTester, LinterRuleTester } from "@typespec/compiler/testing";
import { beforeEach, it } from "vitest";
import { conflictingRouteRule } from "../../src/rules/conflicting-route.rule.js";
import { Tester } from "../test-host.js";

let ruleTester: LinterRuleTester;

beforeEach(async () => {
  const runner = await Tester.createInstance();
  ruleTester = createLinterRuleTester(runner, conflictingRouteRule, "@typespec/http");
});

it("should detect parameter vs literal conflicts", async () => {
  const message = [
    "Operations have conflicting routes. These operations could match the same URLs:",
    "  - op2 => `/foo/fixed`",
    "  - op1 => `/foo/{prop}`",
  ].join("\n");
  await ruleTester
    .expect(
      `
          @route("/foo/{prop}") op op1(prop: string): void;
          @route("/foo/fixed") op op2(): void;
        `,
    )
    .toEmitDiagnostics([
      { code: "@typespec/http/conflicting-route", message },
      { code: "@typespec/http/conflicting-route", message },
    ]);
});

it("detect conflict with path expansion", async () => {
  await ruleTester
    .expect(
      `
          @route("/foo{/prop}") op op1(prop: string): void;
          @route("/foo/fixed") op op2(): void;
        `,
    )
    .toEmitDiagnostics([
      { code: "@typespec/http/conflicting-route" },
      { code: "@typespec/http/conflicting-route" },
    ]);
});

it("should detect operations with different parameter names but same structure", async () => {
  await ruleTester
    .expect(
      `
          @route("/providers/Microsoft.Contoso/res/{fooName}/bars/{barName}") 
          op getBar1(fooName: string, barName: string): void;
          
          @route("/providers/Microsoft.Contoso/res/{name}/bars/{id}") 
          op getBar2(name: string, id: string): void;
        `,
    )
    .toEmitDiagnostics([
      { code: "@typespec/http/conflicting-route" },
      { code: "@typespec/http/conflicting-route" },
    ]);
});

it("should not flag operations with different HTTP verbs", async () => {
  await ruleTester
    .expect(
      `
        @get @route("/providers/Microsoft.Contoso/res/{fooName}") 
        op getFoo(fooName: string): void;
        
        @post @route("/providers/Microsoft.Contoso/res/{name}") 
        op createFoo(name: string): void;
      `,
    )
    .toBeValid();
});

it("should not flag operations with different path structures", async () => {
  await ruleTester
    .expect(
      `
        @route("/providers/Microsoft.Contoso/res/{fooName}") 
        op getFoo(fooName: string): void;
        
        @route("/providers/Microsoft.Contoso/bars/{barName}") 
        op getBar(barName: string): void;
      `,
    )
    .toBeValid();
});

it("should not flag operations with different literal segments", async () => {
  await ruleTester
    .expect(
      `
        @route("/foo/bar") op op1(): void;
        @route("/foo/baz") op op2(): void;
      `,
    )
    .toBeValid();
});

it("should not flag operations with the exact same path if they have @sharedRoute", async () => {
  await ruleTester
    .expect(
      `
        @sharedRoute
        @route("/foo/bar") op op1(): void;

        @sharedRoute
        @route("/foo/bar") op op2(): void;
      `,
    )
    .toBeValid();
});

it("should not flag operations with different number of segments", async () => {
  await ruleTester
    .expect(
      `
        @route("/foo/{id}") 
        op op1(id: string): void;
        
        @route("/foo/{id}/bar") 
        op op2(id: string): void;
      `,
    )
    .toBeValid();
});

it("query parameters shouldn't affect", async () => {
  await ruleTester
    .expect(
      `
        @route("/widgets/{widgetName}/analytics/current") 
        op op1(widgetName: string, @query version?: string): void;
        
        @route("/widgets/{widgetName}") 
        op op2(widgetName: string, @query version?: string): void;
      `,
    )
    .toBeValid();
});

it("should handle three-way conflicts", async () => {
  const message = [
    "Operations have conflicting routes. These operations could match the same URLs:",
    "  - op2 => `/api/{name}`",
    "  - op1 => `/api/{version}`",
    "  - op3 => `/api/v1`",
  ].join("\n");
  await ruleTester
    .expect(
      `
          @route("/api/{version}") 
          op op1(version: string): void;
          
          @route("/api/{name}") 
          op op2(name: string): void;
          
          @route("/api/v1") 
          op op3(): void;
        `,
    )
    .toEmitDiagnostics([
      { code: "@typespec/http/conflicting-route", message },
      { code: "@typespec/http/conflicting-route", message },
      { code: "@typespec/http/conflicting-route", message },
    ]);
});
