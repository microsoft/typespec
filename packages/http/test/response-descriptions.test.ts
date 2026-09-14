import { expectDiagnosticEmpty } from "@typespec/compiler/testing";
import { strictEqual } from "assert";
import { it } from "vitest";
import { getOperationsWithServiceNamespace } from "./test-host.js";

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

it("uses union @doc when all responses sharing a status code came from that union", async () => {
  const op = await getHttpOp(`
    @doc("A cat or a dog.")
    union Pet { cat: Cat, dog: Dog }

    model Cat { @statusCode _: 200, meow: boolean }
    model Dog { @statusCode _: 200, bark: boolean }

    op read(): Pet;
  `);
  strictEqual(op.responses[0].description, "A cat or a dog.");
});

it("uses union @doc over operation @returnsDoc", async () => {
  const op = await getHttpOp(`
    @doc("A cat or a dog.")
    union Pet { cat: Cat, dog: Dog }

    model Cat { @statusCode _: 200, meow: boolean }
    model Dog { @statusCode _: 200, bark: boolean }

    @returnsDoc("A pet.")
    op read(): Pet;
  `);
  strictEqual(op.responses[0].description, "A cat or a dog.");
});

it("uses shared @doc among all responses sharing a status code", async () => {
  const op = await getHttpOp(`
    @doc("A pet.")
    model Cat { @statusCode _: 200, meow: boolean }

    @doc("A pet.")
    model Dog { @statusCode _: 200, bark: boolean }

    op read(): Cat | Dog;
  `);
  strictEqual(op.responses[0].description, "A pet.");
});

it("uses default description when the @doc of all responses sharing a status code disagree", async () => {
  const op = await getHttpOp(`
    @doc("A cat.")
    model Cat { @statusCode _: 200, meow: boolean }

    @doc("A dog.")
    model Dog { @statusCode _: 200, bark: boolean }

    op read(): Cat | Dog;
  `);
  strictEqual(op.responses[0].description, "The request has succeeded.");
});

it("uses @returnsDoc when the @doc of all success responses sharing a status code disagree", async () => {
  const op = await getHttpOp(`
    @doc("A cat.")
    model Cat { @statusCode _: 200, meow: boolean }

    @doc("A dog.")
    model Dog { @statusCode _: 200, bark: boolean }

    @returnsDoc("A pet.")
    @errorsDoc("Something went wrong.")
    op read(): Cat | Dog;
  `);
  strictEqual(op.responses[0].description, "A pet.");
});

it("uses @errorsDoc when the @doc of all @error responses sharing a status code disagree", async () => {
  const op = await getHttpOp(`
    @doc("Error A.")
    @error model ErrorA { @statusCode _: 400, codeA: string }

    @doc("Error B.")
    @error model ErrorB { @statusCode _: 400, codeB: string }

    @returnsDoc("Success.")
    @errorsDoc("Something went wrong.")
    op read(): ErrorA | ErrorB;
  `);
  strictEqual(op.responses[0].description, "Something went wrong.");
});

it("uses @returnsDoc when every response sharing a status code is a non-error model", async () => {
  const op = await getHttpOp(`
    union Pet { cat: Cat, dog: Dog }

    model Cat { @statusCode _: 200, meow: boolean }
    model Dog { @statusCode _: 200, bark: boolean }

    @returnsDoc("A pet.")
    @errorsDoc("Something went wrong.")
    op read(): Pet;
  `);
  strictEqual(op.responses[0].description, "A pet.");
});

it("uses @errorsDoc when every response sharing a status code is an @error model", async () => {
  const op = await getHttpOp(`
    @error model ErrorA { @statusCode _: 400, codeA: string }
    @error model ErrorB { @statusCode _: 400, codeB: string }

    @returnsDoc("Success.")
    @errorsDoc("Something went wrong.")
    op read(): ErrorA | ErrorB;
  `);
  strictEqual(op.responses[0].description, "Something went wrong.");
});

it("uses default description when responses sharing a status code mix success and error models", async () => {
  const op = await getHttpOp(`
    @error model Error { @statusCode _: 200; message: string }
    model Pet { @statusCode _: 200 }

    @returnsDoc("Success.")
    @errorsDoc("Something went wrong.")
    op read(): Pet | Error;
  `);
  strictEqual(op.responses[0].description, "The request has succeeded.");
});

it("uses shared @doc for responses sharing a status code even when one comes from a union @doc and another from its own @doc", async () => {
  const op = await getHttpOp(`
    @doc("Success.")
    union Pet { cat: Cat }

    model Cat { @statusCode _: 200, meow: boolean }

    @doc("Success.")
    model Extra { @statusCode _: 200, extra: string }

    op read(): Pet | Extra;
  `);
  strictEqual(op.responses[0].description, "Success.");
});

it("uses shared @doc among all responses sharing a status code range", async () => {
  const op = await getHttpOp(`
    @doc("A pet.")
    model Cat {
      @statusCode @minValue(200) @maxValue(299) _: int32;
      meow: boolean;
    }

    @doc("A pet.")
    model Dog {
      @statusCode @minValue(200) @maxValue(299) _: int32;
      bark: boolean;
    }

    op read(): Cat | Dog;
  `);
  strictEqual(op.responses[0].description, "A pet.");
});

it("uses default description when responses sharing a status code range have different descriptions", async () => {
  const op = await getHttpOp(`
    @doc("A cat.")
    model Cat {
      @statusCode @minValue(200) @maxValue(299) _: int32;
      meow: boolean;
    }

    @doc("A dog.")
    model Dog {
      @statusCode @minValue(200) @maxValue(299) _: int32;
      bark: boolean;
    }

    op read(): Cat | Dog;
  `);
  strictEqual(op.responses[0].description, "Successful");
});
