import { createLinterRuleTester, LinterRuleTester } from "@typespec/compiler/testing";
import { beforeEach, describe, it } from "vitest";
import { noContentTypeOptionalityMismatchRule } from "../../src/rules/no-content-type-optionality-mismatch.js";
import { Tester } from "../test-host.js";

let ruleTester: LinterRuleTester;
beforeEach(async () => {
  const runner = await Tester.createInstance();
  ruleTester = createLinterRuleTester(
    runner,
    noContentTypeOptionalityMismatchRule,
    "@typespec/http",
  );
});

describe("emit diagnostics", () => {
  it("emits when content-type is required but @body is optional", async () => {
    await ruleTester
      .expect(
        `
        op foo(
          @header("content-type")
          contentType: "application/json",
          @body
          body?: string,
        ): void;
      `,
      )
      .toEmitDiagnostics([
        {
          code: "@typespec/http/no-content-type-optionality-mismatch",
          message:
            "The optionality of the Content-type header must match the optionality of the associated request body.",
        },
      ]);
  });

  it("emits when content-type is optional but @body is required", async () => {
    await ruleTester
      .expect(
        `
        op foo(
          @header("content-type")
          contentType?: "application/json",
          @body
          body: string,
        ): void;
      `,
      )
      .toEmitDiagnostics([
        {
          code: "@typespec/http/no-content-type-optionality-mismatch",
          message:
            "The optionality of the Content-type header must match the optionality of the associated request body.",
        },
      ]);
  });

  it("emits when content-type is required but @bodyRoot is optional", async () => {
    await ruleTester
      .expect(
        `
        model Bar {
          baz: string;
        }
        op foo(
          @header("content-type")
          contentType: "application/json",
          @bodyRoot
          body?: Bar,
        ): void;
      `,
      )
      .toEmitDiagnostics([
        {
          code: "@typespec/http/no-content-type-optionality-mismatch",
          message:
            "The optionality of the Content-type header must match the optionality of the associated request body.",
        },
      ]);
  });

  it("emits when content-type is optional but @bodyRoot is required", async () => {
    await ruleTester
      .expect(
        `
        model Bar {
          baz: string;
        }
        op foo(
          @header("content-type")
          contentType?: "application/json",
          @bodyRoot
          body: Bar,
        ): void;
      `,
      )
      .toEmitDiagnostics([
        {
          code: "@typespec/http/no-content-type-optionality-mismatch",
          message:
            "The optionality of the Content-type header must match the optionality of the associated request body.",
        },
      ]);
  });

  it("emits for content-type with odata minimalmetadata and optional body", async () => {
    await ruleTester
      .expect(
        `
        model Bar {
          baz: string;
        }
        op foo(
          @header("content-type")
          contentType: "application/json; odata=minimalmetadata",
          @body
          body?: Bar,
        ): void;
      `,
      )
      .toEmitDiagnostics([
        {
          code: "@typespec/http/no-content-type-optionality-mismatch",
        },
      ]);
  });
});

describe("no diagnostics", () => {
  it("does not emit when both content-type and @body are required", async () => {
    await ruleTester
      .expect(
        `
        op foo(
          @header("content-type")
          contentType: "application/json",
          @body
          body: string,
        ): void;
      `,
      )
      .toBeValid();
  });

  it("does not emit when both content-type and @body are optional", async () => {
    await ruleTester
      .expect(
        `
        op foo(
          @header("content-type")
          contentType?: "application/json",
          @body
          body?: string,
        ): void;
      `,
      )
      .toBeValid();
  });

  it("does not emit when both content-type and @bodyRoot are required", async () => {
    await ruleTester
      .expect(
        `
        model Bar {
          baz: string;
        }
        op foo(
          @header("content-type")
          contentType: "application/json",
          @bodyRoot
          body: Bar,
        ): void;
      `,
      )
      .toBeValid();
  });

  it("does not emit when both content-type and @bodyRoot are optional", async () => {
    await ruleTester
      .expect(
        `
        model Bar {
          baz: string;
        }
        op foo(
          @header("content-type")
          contentType?: "application/json",
          @bodyRoot
          body?: Bar,
        ): void;
      `,
      )
      .toBeValid();
  });

  it("does not emit when no content-type header is present", async () => {
    await ruleTester
      .expect(
        `
        op foo(
          @body
          body?: string,
        ): void;
      `,
      )
      .toBeValid();
  });

  it("does not emit when no body is present with only a query param", async () => {
    await ruleTester
      .expect(
        `
        op foo(
          @query
          q: string,
        ): void;
      `,
      )
      .toBeValid();
  });

  it("does not emit when operation has no parameters", async () => {
    await ruleTester.expect(`op foo(): void;`).toBeValid();
  });

  it("does not emit for non-content-type headers", async () => {
    await ruleTester
      .expect(
        `
        op foo(
          @header("x-custom")
          custom: string,
          @body
          body?: string,
        ): void;
      `,
      )
      .toBeValid();
  });

  it("does not emit for content-type with union type matching body optionality", async () => {
    await ruleTester
      .expect(
        `
        op foo(
          @header("content-type")
          contentType: "application/json" | "text/plain",
          @body
          body: string,
        ): void;
      `,
      )
      .toBeValid();
  });
});
