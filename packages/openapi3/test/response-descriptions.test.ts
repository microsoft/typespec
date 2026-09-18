import { strictEqual } from "assert";
import { it } from "vitest";
import { supportedVersions, worksFor } from "./works-for.js";

worksFor(supportedVersions, ({ openApiFor }) => {
  it("use a default message by status code if not specified", async () => {
    const res = await openApiFor(
      `
      op read(): {@statusCode _: 200, content: string};
      `,
    );
    strictEqual(res.paths["/"].get.responses["200"].description, "The request has succeeded.");
  });

  it("@returns set doc for all success responses", async () => {
    const res = await openApiFor(
      `
      @error model Error {}
      @returnsDoc("A string")
      op read(): { @statusCode _: 200, content: string } |  { @statusCode _: 201, content: string } | Error;
      `,
    );
    strictEqual(res.paths["/"].get.responses["200"].description, "A string");
    strictEqual(res.paths["/"].get.responses["201"].description, "A string");
    strictEqual(
      res.paths["/"].get.responses["default"].description,
      "An unexpected error response.",
    );
  });

  it("@errors set doc for all success responses", async () => {
    const res = await openApiFor(
      `
      @error model Error {}
      @errorsDoc("Generic error")
      op read(): { @statusCode _: 200, content: string } |  { @statusCode _: 201, content: string } | Error;
      `,
    );
    strictEqual(res.paths["/"].get.responses["200"].description, "The request has succeeded.");
    strictEqual(
      res.paths["/"].get.responses["201"].description,
      "The request has succeeded and a new resource has been created as a result.",
    );
    strictEqual(res.paths["/"].get.responses["default"].description, "Generic error");
  });

  it("@doc explicitly on a response override the operation returns doc", async () => {
    const res = await openApiFor(
      `
      @error model Error {}
      @error @doc("Not found model") model NotFound {@statusCode _: 404}
      @errorsDoc("Generic error")
      op read(): { @statusCode _: 200, content: string } |  { @statusCode _: 201, content: string } | Error | NotFound;
      `,
    );
    strictEqual(res.paths["/"].get.responses["200"].description, "The request has succeeded.");
    strictEqual(
      res.paths["/"].get.responses["201"].description,
      "The request has succeeded and a new resource has been created as a result.",
    );
    strictEqual(res.paths["/"].get.responses["404"].description, "Not found model");
    strictEqual(res.paths["/"].get.responses["default"].description, "Generic error");
  });

  it("uses union variant descriptions", async () => {
    const res = await openApiFor(
      `
      model PetCreated { @statusCode code: 201 }
      model PetAccepted { @statusCode code: 202 }
      union CreatedResponses {
        @doc("Pet Created") created: PetCreated,
        @doc("Pet Accepted") accepted: PetAccepted,
      }
      op created(): CreatedResponses;
      `,
    );
    strictEqual(res.paths["/"].get.responses["201"].description, "Pet Created");
    strictEqual(res.paths["/"].get.responses["202"].description, "Pet Accepted");
  });

  it("recursively expands deeply nested unions", async () => {
    const res = await openApiFor(
      `
      @doc("Model A") model A { @statusCode _: 400 }
      @doc("Model B") model B { @statusCode _: 401 }
      @doc("Model C") model C { @statusCode _: 403 }
      union Inner { A: A; B: B };
      union Outer { inner: Inner; C: C };
      op read(): { @statusCode _: 200, content: string } | Outer;
      `,
    );
    strictEqual(res.paths["/"].get.responses["200"].description, "The request has succeeded.");
    strictEqual(res.paths["/"].get.responses["400"].description, "Model A");
    strictEqual(res.paths["/"].get.responses["401"].description, "Model B");
    strictEqual(res.paths["/"].get.responses["403"].description, "Model C");
  });

  it("uses union's @doc when specified on the union itself", async () => {
    const res = await openApiFor(
      `
      @doc("Foo model") model Foo { @statusCode _: 409 }
      @doc("Bar model") model Bar { @statusCode _: 409 }
      @doc("The resource conflicts with an existing resource")
      union Conflict { Foo: Foo; Bar: Bar };
      op read(): { @statusCode _: 200, content: string } | Conflict;
      `,
    );
    strictEqual(res.paths["/"].get.responses["200"].description, "The request has succeeded.");
    strictEqual(
      res.paths["/"].get.responses["409"].description,
      "The resource conflicts with an existing resource",
    );
  });

  it("nested union's @doc takes precedence over parent union's @doc", async () => {
    const res = await openApiFor(
      `
      @doc("Model A") model A { @statusCode _: 400 }
      @doc("Model B") model B { @statusCode _: 401 }
      @doc("Model C") model C { @statusCode _: 403 }
      @doc("Inner authentication errors")
      union Inner { A: A; B: B };
      @doc("All error responses")
      union Outer { inner: Inner; C: C };
      op read(): { @statusCode _: 200, content: string } | Outer;
      `,
    );
    strictEqual(res.paths["/"].get.responses["200"].description, "The request has succeeded.");
    strictEqual(res.paths["/"].get.responses["400"].description, "Inner authentication errors");
    strictEqual(res.paths["/"].get.responses["401"].description, "Inner authentication errors");
    strictEqual(res.paths["/"].get.responses["403"].description, "All error responses");
  });

  it("uses union @doc over operation @returnsDoc", async () => {
    const res = await openApiFor(`
      @doc("A cat or a dog.")
      union Pet { cat: Cat, dog: Dog }

      model Cat { @statusCode _: 200, meow: boolean }
      model Dog { @statusCode _: 200, bark: boolean }

      @returnsDoc("A pet.")
      op read(): Pet;
    `);
    strictEqual(res.paths["/"].get.responses["200"].description, "A cat or a dog.");
  });

  it("uses shared @doc among all responses sharing a status code", async () => {
    const res = await openApiFor(`
      @doc("A pet.")
      model Cat { @statusCode _: 200, meow: boolean }

      @doc("A pet.")
      model Dog { @statusCode _: 200, bark: boolean }

      op read(): Cat | Dog;
    `);
    strictEqual(res.paths["/"].get.responses["200"].description, "A pet.");
  });

  it("uses default description when the @doc of all responses sharing a status code disagree", async () => {
    const res = await openApiFor(`
      @doc("A cat.")
      model Cat { @statusCode _: 200, meow: boolean }

      @doc("A dog.")
      model Dog { @statusCode _: 200, bark: boolean }

      op read(): Cat | Dog;
    `);
    strictEqual(res.paths["/"].get.responses["200"].description, "The request has succeeded.");
  });

  it("uses @returnsDoc when the @doc of all success responses sharing a status code disagree", async () => {
    const res = await openApiFor(`
      @doc("A cat.")
      model Cat { @statusCode _: 200, meow: boolean }

      @doc("A dog.")
      model Dog { @statusCode _: 200, bark: boolean }

      @returnsDoc("A pet.")
      @errorsDoc("Something went wrong.")
      op read(): Cat | Dog;
    `);
    strictEqual(res.paths["/"].get.responses["200"].description, "A pet.");
  });

  it("uses @errorsDoc when the @doc of all @error responses sharing a status code disagree", async () => {
    const res = await openApiFor(`
      @doc("Error A.")
      @error model ErrorA { @statusCode _: 400, codeA: string }

      @doc("Error B.")
      @error model ErrorB { @statusCode _: 400, codeB: string }

      @returnsDoc("Success.")
      @errorsDoc("Something went wrong.")
      op read(): ErrorA | ErrorB;
    `);
    strictEqual(res.paths["/"].get.responses["400"].description, "Something went wrong.");
  });

  it("uses @returnsDoc when every response sharing a status code is a non-error model", async () => {
    const res = await openApiFor(`
      union Pet { cat: Cat, dog: Dog }

      model Cat { @statusCode _: 200, meow: boolean }
      model Dog { @statusCode _: 200, bark: boolean }

      @returnsDoc("A pet.")
      @errorsDoc("Something went wrong.")
      op read(): Pet;
    `);
    strictEqual(res.paths["/"].get.responses["200"].description, "A pet.");
  });

  it("uses @errorsDoc when every response sharing a status code is an @error model", async () => {
    const res = await openApiFor(`
      @error model ErrorA { @statusCode _: 400, codeA: string }
      @error model ErrorB { @statusCode _: 400, codeB: string }

      @returnsDoc("Success.")
      @errorsDoc("Something went wrong.")
      op read(): ErrorA | ErrorB;
    `);
    strictEqual(res.paths["/"].get.responses["400"].description, "Something went wrong.");
  });

  it("uses default description when responses sharing a status code mix success and error models", async () => {
    const res = await openApiFor(`
      @error model Error { @statusCode _: 200; message: string }
      model Pet { @statusCode _: 200 }

      @returnsDoc("Success.")
      @errorsDoc("Something went wrong.")
      op read(): Pet | Error;
    `);
    strictEqual(res.paths["/"].get.responses["200"].description, "The request has succeeded.");
  });

  it("uses shared @doc for responses sharing a status code even when one comes from a union @doc and another from its own @doc", async () => {
    const res = await openApiFor(`
      @doc("Success.")
      union Pet { cat: Cat }

      model Cat { @statusCode _: 200, meow: boolean }

      @doc("Success.")
      model Extra { @statusCode _: 200, extra: string }

      op read(): Pet | Extra;
    `);
    strictEqual(res.paths["/"].get.responses["200"].description, "Success.");
  });

  it("uses shared @doc among all responses sharing a status code range", async () => {
    const res = await openApiFor(`
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
    strictEqual(res.paths["/"].get.responses["2XX"].description, "A pet.");
  });

  it("uses default description when responses sharing a status code range have different descriptions", async () => {
    const res = await openApiFor(`
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
    strictEqual(res.paths["/"].get.responses["2XX"].description, "Successful");
  });
});
