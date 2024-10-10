import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { openApiFor } from "./test-host.js";

describe("openapi3: response descriptions", () => {
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
});
