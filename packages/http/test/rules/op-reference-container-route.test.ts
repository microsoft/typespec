import { LinterRuleTester, createLinterRuleTester } from "@typespec/compiler/testing";
import { beforeEach, describe, it } from "vitest";
import { opReferenceContainerRouteRule } from "../../src/rules/op-reference-container-route.js";
import { createHttpTestRunner } from "../test-host.js";

describe("operation reference route container rule", () => {
  let ruleTester: LinterRuleTester;
  beforeEach(async () => {
    const runner = await createHttpTestRunner();
    ruleTester = createLinterRuleTester(runner, opReferenceContainerRouteRule, "@typespec/http");
  });

  it("emit a diagnostic when referenced op has a route prefix on its parent container", async () => {
    // cspell:ignore IFoo
    await ruleTester
      .expect(
        `
        @route("/foo")
        namespace Foo {
          @route("/test")
          op get(): string;
        }

        @route("/ifoo")
        interface IFoo {
          op get(): string;
        }

        @route("/bar")
        namespace Bar {
          interface IBar {
            op get(): string;
          }
        }

        namespace Test {
          @route("/get1") op get1 is Foo.get;
          @route("/get2") op get2 is IFoo.get;
          @route("/get3") op get3 is Bar.IBar.get;
          @route("/get4") op get4 is get3; // Follow reference chain to find parent container
        }
      `,
      )
      .toEmitDiagnostics([
        {
          code: "@typespec/http/op-reference-container-route",
          message:
            'Operation get1 references an operation which has a @route prefix on its namespace or interface: "/foo".  This operation will not carry forward the route prefix so the final route may be different than the referenced operation.',
        },
        {
          code: "@typespec/http/op-reference-container-route",
          message:
            'Operation get2 references an operation which has a @route prefix on its namespace or interface: "/ifoo".  This operation will not carry forward the route prefix so the final route may be different than the referenced operation.',
        },
        {
          code: "@typespec/http/op-reference-container-route",
          message:
            'Operation get3 references an operation which has a @route prefix on its namespace or interface: "/bar".  This operation will not carry forward the route prefix so the final route may be different than the referenced operation.',
        },
        {
          code: "@typespec/http/op-reference-container-route",
          message:
            'Operation get4 references an operation which has a @route prefix on its namespace or interface: "/bar".  This operation will not carry forward the route prefix so the final route may be different than the referenced operation.',
        },
      ]);
  });

  it("does not emit for references inside of the same container", async () => {
    await ruleTester
      .expect(
        `
        @route("/foo")
        namespace Foo {
          @route("/test")
          op get(): string;
        }

        namespace Bar {
          @route("/get1") op get1 is Foo.get;
        }

        namespace Foo {
          @route("/get2") op get2 is Foo.get;
        }
      `,
      )
      .toEmitDiagnostics([
        {
          code: "@typespec/http/op-reference-container-route",
          message:
            'Operation get1 references an operation which has a @route prefix on its namespace or interface: "/foo".  This operation will not carry forward the route prefix so the final route may be different than the referenced operation.',
        },
      ]);
  });
});
