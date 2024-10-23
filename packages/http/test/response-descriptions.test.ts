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
});
