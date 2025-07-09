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
  await ruleTester
    .expect(
      `
          @route("/foo/{prop}") op op1(prop: string): void;
          @route("/foo/fixed") op op2(): void;
        `,
    )
    .toEmitDiagnostics([
      {
        code: "@typespec/http/conflicting-route",
        message:
          /Operations have conflicting routes\. These operations could match the same URLs: (op1, op2|op2, op1) \(routes: (\/foo\/\{prop\}, \/foo\/fixed|\/foo\/fixed, \/foo\/\{prop\})\)/,
      },
      {
        code: "@typespec/http/conflicting-route",
        message:
          /Operations have conflicting routes\. These operations could match the same URLs: (op1, op2|op2, op1) \(routes: (\/foo\/\{prop\}, \/foo\/fixed|\/foo\/fixed, \/foo\/\{prop\})\)/,
      },
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
          @route("/providers/Microsoft.Contoso/foos/{fooName}/bars/{barName}") 
          op getBar1(fooName: string, barName: string): void;
          
          @route("/providers/Microsoft.Contoso/foos/{name}/bars/{id}") 
          op getBar2(name: string, id: string): void;
        `,
    )
    .toEmitDiagnostics([
      {
        code: "@typespec/http/conflicting-route",
        message:
          /Operations have conflicting routes\. These operations could match the same URLs: (getBar1, getBar2|getBar2, getBar1)/,
      },
      {
        code: "@typespec/http/conflicting-route",
        message:
          /Operations have conflicting routes\. These operations could match the same URLs: (getBar1, getBar2|getBar2, getBar1)/,
      },
    ]);
});

it("should not flag operations with different HTTP verbs", async () => {
  await ruleTester
    .expect(
      `
        @get @route("/providers/Microsoft.Contoso/foos/{fooName}") 
        op getFoo(fooName: string): void;
        
        @post @route("/providers/Microsoft.Contoso/foos/{name}") 
        op createFoo(name: string): void;
      `,
    )
    .toBeValid();
});

it("should not flag operations with different path structures", async () => {
  await ruleTester
    .expect(
      `
        @route("/providers/Microsoft.Contoso/foos/{fooName}") 
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

it("should handle three-way conflicts", async () => {
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
      {
        code: "@typespec/http/conflicting-route",
        message:
          /Operations have conflicting routes\. These operations could match the same URLs: .*(op1|op2|op3).*(op1|op2|op3).*(op1|op2|op3)/,
      },
      {
        code: "@typespec/http/conflicting-route",
        message:
          /Operations have conflicting routes\. These operations could match the same URLs: .*(op1|op2|op3).*(op1|op2|op3).*(op1|op2|op3)/,
      },
      {
        code: "@typespec/http/conflicting-route",
        message:
          /Operations have conflicting routes\. These operations could match the same URLs: .*(op1|op2|op3).*(op1|op2|op3).*(op1|op2|op3)/,
      },
    ]);
});
