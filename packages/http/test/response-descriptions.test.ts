import { expectDiagnosticEmpty } from "@typespec/compiler/testing";
import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { getOperationsWithServiceNamespace } from "./test-host.js";

describe("http: response descriptions", () => {
  async function getHttpOp(code: string) {
    const [ops, diagnostics] = await getOperationsWithServiceNamespace(code);
    expectDiagnosticEmpty(diagnostics);
    strictEqual(ops.length, 1);
    return ops[0];
  }

  it("use a default message by status code if not specified", async () => {
    const op = await getHttpOp(
      `
      op read(): {@statusCode _: 200, content: string};
      `,
    );
    strictEqual(op.responses[0].description, "The request has succeeded.");
  });

  it("@returns set doc for all success responses", async () => {
    const op = await getHttpOp(
      `
      @error model Error {}
      @returnsDoc("A string")
      op read(): { @statusCode _: 200, content: string } |  { @statusCode _: 201, content: string } | Error;
      `,
    );
    strictEqual(op.responses[0].description, "A string");
    strictEqual(op.responses[1].description, "A string");
    strictEqual(op.responses[2].description, undefined);
  });

  it("@errors set doc for all success responses", async () => {
    const op = await getHttpOp(
      `
      @error model Error {}
      @errorsDoc("Generic error")
      op read(): { @statusCode _: 200, content: string } |  { @statusCode _: 201, content: string } | Error;
      `,
    );
    strictEqual(op.responses[0].description, "The request has succeeded.");
    strictEqual(
      op.responses[1].description,
      "The request has succeeded and a new resource has been created as a result.",
    );
    strictEqual(op.responses[2].description, "Generic error");
  });

  it("@doc explicitly on a response override the operation returns doc", async () => {
    const op = await getHttpOp(
      `
      @error model Error {}
      @error @doc("Not found model") model NotFound {@statusCode _: 404}
      @errorsDoc("Generic error")
      op read(): { @statusCode _: 200, content: string } |  { @statusCode _: 201, content: string } | NotFound | Error ;
      `,
    );
    strictEqual(op.responses[0].description, "The request has succeeded.");
    strictEqual(
      op.responses[1].description,
      "The request has succeeded and a new resource has been created as a result.",
    );
    strictEqual(op.responses[2].description, "Not found model");
    strictEqual(op.responses[3].description, "Generic error");
  });

  it("@doc on response model set response doc if model is an evelope with @statusCode", async () => {
    const op = await getHttpOp(
      `
      /** Explicit doc */
      model Result {
        @statusCode _: 201;
        implicit: 200;
      }
      op read(): Result;
      `,
    );
    strictEqual(op.responses[0].description, "Explicit doc");
  });

  it("inline doc comments for an operation returnType", async () => {
    const op = await getHttpOp(
      `
      op read():
      /** 🍋 */
      { @statusCode _: 200, content: string };
      `,
    );
    strictEqual(op.responses[0].description, "🍋");
  });

  it("inline doc comments for an operation returnType with union expression", async () => {
    const op = await getHttpOp(
      `
      op read(): |
      /** 🍌 */
      { @statusCode _: 200, content: string } | 
      /** 🍎 */
      { @statusCode _: 201, content: string } |
      { @statusCode _: 202, content: string };
      `,
    );
    strictEqual(op.responses[0].description, "🍌");
    strictEqual(op.responses[1].description, "🍎");
    strictEqual(
      op.responses[2].description,
      "The request has been accepted for processing, but processing has not yet completed.",
    );
  });

  it("inline doc comments for an operation returnType with union alias", async () => {
    const op = await getHttpOp(
      `
      /** 🥝 */
      model MySuccess200 { @statusCode _: 200, content: string };
      alias MyResponse =
      /** 🌰 */
      MySuccess200 |
      /** 🍇 */
      { @statusCode _: 201, content: string } |
      { @statusCode _: 202, content: string };
      op read(): MyResponse;
      `,
    );
    strictEqual(op.responses[0].description, "🌰");
    strictEqual(op.responses[1].description, "🍇");
    strictEqual(
      op.responses[2].description,
      "The request has been accepted for processing, but processing has not yet completed.",
    );
  });

  it("inline doc comments and @doc and @returnsDoc for an operation returnType with union declaration", async () => {
    const op = await getHttpOp(
      `
      @doc("🍉")
      union MyResponse {
        /** 🥭 */
        { @statusCode _: 200, content: string };
        /** 🍍 */
        { @statusCode _: 201, content: string };
        { @statusCode _: 202, content: string };
      };
      @returnsDoc("✅")
      op read(): MyResponse |
      { @statusCode _: 400, content: string };
      `,
    );
    strictEqual(op.responses[0].description, "🥭");
    strictEqual(op.responses[1].description, "🍍");
    strictEqual(op.responses[2].description, "🍉");
    strictEqual(op.responses[3].description, "✅");
  });

  it("inline doc comments for an operation returnType with union declaration ovrrided", async () => {
    const op = await getHttpOp(
      `
      alias My400 = /** 🍎 */ { @statusCode _: 400, content: string };
      union My401 {
        /** 🍐 */
        { @statusCode _: 401, content: string };
      };
      union My400_401 {
        /** 🥭 */
        My400;
        /** 🍍 */
        My401;
      };
      union MyError {
        /** 🍊 */
        My400_401;
      }
      @doc("🍉")
      union MyResponse {
        /** 🍌 */
        MyError;
        { @statusCode _: 403, content: string };
      };
      op read():
      { @statusCode _: 200, content: string } |
      /** 🍏 */
      MyResponse;
      `,
    );
    strictEqual(op.responses[0].description, "The request has succeeded.");
    strictEqual(op.responses[1].description, "🍏");
    strictEqual(op.responses[2].description, "🍏");
    strictEqual(op.responses[3].description, "🍏");
  });

  it("complex inline doc comments for an operation returnType with union alias", async () => {
    const op = await getHttpOp(
      `
      /** 🥝 */
      union My400_401 {
        /** 🌰 */
        { @statusCode _: 400, content: string };
        /** 🍎 */
        { @statusCode _: 401, content: string };
      };
      alias _MyResponse =
      /** 🍇 */
      { @statusCode _: 201, content: string } |
      { @statusCode _: 202, content: string } |
      My400_401;
      alias MyResponse = _MyResponse | { @statusCode _: 200, content: string };
      op read(): MyResponse;
      `,
    );
    strictEqual(op.responses[0].description, "🍇");
    strictEqual(
      op.responses[1].description,
      "The request has been accepted for processing, but processing has not yet completed.",
    );
    strictEqual(op.responses[2].description, "🌰");
    strictEqual(op.responses[3].description, "🍎");
  });

  it("inline doc comments deeply nested aliases with mixed doc patterns", async () => {
    const op = await getHttpOp(
      `
      /** Base error doc */
      model BaseError { @statusCode _: 500, message: string }
      
      /** Custom 404 */
      alias NotFound = { @statusCode _: 404, error: string };
      
      alias Level1 = 
      /** Level1 doc */
      NotFound | BaseError;
      
      alias Level2 = 
      /** Level2 doc */
      Level1 | { @statusCode _: 403, reason: string };
      
      /** Top level union doc */
      union TopUnion {
        /** Variant A doc */
        Level2;
        /** Variant B doc */  
        { @statusCode _: 429, retryAfter: string };
      }
      
      op test(): 
      /** Inline success doc */
      { @statusCode _: 200, data: string } |
      TopUnion;
      `,
    );

    strictEqual(op.responses[0].description, "Inline success doc");
    strictEqual(op.responses[1].description, "Variant A doc");
    strictEqual(op.responses[2].description, "Variant A doc");
    strictEqual(op.responses[3].description, "Variant A doc");
    strictEqual(op.responses[4].description, "Variant B doc");
  });

  it("inline doc comments circular alias references with docs", async () => {
    const op = await getHttpOp(
      `
      alias ErrorA = 
      /** Error A doc */
      { @statusCode _: 400, type: "A" } | ErrorB;
      
      alias ErrorB = 
      /** Error B doc */  
      { @statusCode _: 401, type: "B" } | ErrorC;
      
      alias ErrorC = 
      /** Error C doc */
      { @statusCode _: 402, type: "C" };
      
      op test(): 
      { @statusCode _: 200, success: true } | ErrorA;
      `,
    );

    strictEqual(op.responses[0].description, "The request has succeeded.");
    strictEqual(op.responses[1].description, "Error A doc");
    strictEqual(op.responses[2].description, "Error B doc");
    strictEqual(op.responses[3].description, "Error C doc");
  });

  it("multiple inline doc comments at same level", async () => {
    const op = await getHttpOp(
      `
      /** First doc */
      /** Second doc */  
      /** Third doc */
      model Response200 { @statusCode _: 200, data: string }
      
      op test():
      /** Inline first */
      /** Inline second */
      Response200 |
      /** Error doc 1 */
      /** Error doc 2 */
      { @statusCode _: 400, error: string };
      `,
    );

    strictEqual(op.responses[0].description, "Inline second");
    strictEqual(op.responses[1].description, "Error doc 2");
  });

  it("inline doc comments with intersections", async () => {
    const op = await getHttpOp(
      `
      /** Base response doc */
      model SuccessResponse200 { @statusCode _: 200 }
      model SuccessResponse201 { @statusCode _: 201 }
      
      /** Data mixin doc */
      model DataMixin { data: string }
      
      alias IntersectionResponse = 
      /** Intersection doc */
      SuccessResponse200 & DataMixin;

      op test():
      IntersectionResponse |
      /** Intersection inline doc */
      (SuccessResponse201 & DataMixin) |
      { @statusCode _: 400, error: string };
      `,
    );

    strictEqual(op.responses[0].description, "Intersection doc");
    strictEqual(op.responses[1].description, "Intersection inline doc");
    strictEqual(
      op.responses[2].description,
      "The server could not understand the request due to invalid syntax.",
    );
  });

  it("inline doc comments extreme nesting stress test", async () => {
    const op = await getHttpOp(
      `
      /** L0 doc */
      alias L0 = { @statusCode _: 200, l0: true };
      
      /** L1 doc */
      alias L1 = L0 | { @statusCode _: 201, l1: true };
      
      /** L2 doc */  
      alias L2 = L1 | { @statusCode _: 202, l2: true };
      
      /** L3 doc */
      alias L3 = L2 | { @statusCode _: 203, l3: true };
      
      /** L4 doc */
      alias L4 = L3 | { @statusCode _: 204, l4: true };
      
      /** L5 doc */
      alias L5 = L4 | { @statusCode _: 205, l5: true };
      
      op test(): 
      /** Final doc */
      L5 | { @statusCode _: 400, error: string };
      `,
    );

    strictEqual(op.responses[0].description, "Final doc");
    strictEqual(op.responses[1].description, "Final doc");
    strictEqual(op.responses[2].description, "Final doc");
    strictEqual(op.responses[3].description, "Final doc");
    strictEqual(op.responses[4].description, "Final doc");
    strictEqual(op.responses[5].description, "Final doc");
    strictEqual(
      op.responses[6].description,
      "The server could not understand the request due to invalid syntax.",
    );
  });

  it("ordering check", async () => {
    const docs = [
      "/** 1 */",
      '@@doc(ReadRespose, "2");',
      '@doc("3")',
      "/** 4 */",
      '@doc("5")',
      "/** 6 */",
      '@returnsDoc("7")',
    ];
    for (const [index, doc] of docs.entries()) {
      /**
       * This test should keep in sync with the example in the documentation
       * {@link file://./../../../website/src/content/docs/docs/getting-started/typespec-for-openapi-dev.md#description-ordering}
       */
      const code = `
      ${docs[5]}
      ${docs[4]}
      model SuccessResponse {
        @statusCode _: 200;
        content: string;
      }

      ${docs[3]}
      ${docs[2]}
      union ReadRespose {
        SuccessResponse;
      }

      ${docs[1]}

      ${docs[6]}
      op read(): ${docs[0]}
      ReadRespose;
      `;
      const op = await getHttpOp(code);
      const description = String(index + 1);
      strictEqual(op.responses[0].description, description);
      // comment out current doc to test the next one
      docs[index] = `// ${doc}`;
    }
  });
});
