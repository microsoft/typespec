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

  it("uses first model's description when multiple models have same status code", async () => {
    const res = await openApiFor(
      `
      @doc("Foo") model Foo { @statusCode _: 409 }
      @doc("Bar") model Bar { @statusCode _: 409 }
      op read(): { @statusCode _: 200, content: string } | Foo | Bar;
      `,
    );
    strictEqual(res.paths["/"].get.responses["200"].description, "The request has succeeded.");
    strictEqual(res.paths["/"].get.responses["409"].description, "Foo");
  });

  it("expands named union in return type and uses first variant's description", async () => {
    const res = await openApiFor(
      `
      @doc("Foo") model Foo { @statusCode _: 409 }
      @doc("Bar") model Bar { @statusCode _: 409 }
      union Conflict { Foo: Foo; Bar: Bar };
      op read(): { @statusCode _: 200, content: string } | Conflict;
      `,
    );
    strictEqual(res.paths["/"].get.responses["200"].description, "The request has succeeded.");
    strictEqual(res.paths["/"].get.responses["409"].description, "Foo");
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
});
