import { expectDiagnosticEmpty, expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual, ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { HttpOperationMultipartBody } from "../src/types.js";
import { getOperationsWithServiceNamespace } from "./test-host.js";

it("emit diagnostic when using invalid content type for multipart ", async () => {
  const diagnostics = await diagnoseHttpOp(`
    op read(
      @header contentType: "application/json",
      @multipartBody body: [HttpPart<string>]): void;
  `);
  expectDiagnostics(diagnostics, {
    code: "@typespec/http/multipart-invalid-content-type",
    message:
      "Content type 'application/json' is not a multipart content type. Supported content types are: multipart/form-data, multipart/mixed.",
  });
});

describe("define with the tuple form", () => {
  describe("part without name", () => {
    it("emit diagnostic when using multipart/form-data", async () => {
      const diagnostics = await diagnoseHttpOp(`
        op read(
          @header contentType: "multipart/form-data",
          @multipartBody body: [HttpPart<string>]): void;
      `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/http/formdata-no-part-name",
        message: "Part used in multipart/form-data must have a name.",
      });
    });

    it("include anonymous part when multipart/form-data", async () => {
      const body = await getMultipartBody(`
        op read(
          @header contentType: "multipart/mixed",
          @multipartBody body: [HttpPart<string>]): void;
      `);
      strictEqual(body.parts.length, 1);
      strictEqual(body.parts[0].name, undefined);
    });
  });

  it("resolve name from HttpPart options", async () => {
    const body = await getMultipartBody(`
      op read(
        @header contentType: "multipart/mixed",
        @multipartBody body: [HttpPart<string, #{name: "myPart"}>]): void;
    `);
    strictEqual(body.parts.length, 1);
    strictEqual(body.parts[0].name, "myPart");
  });

  it("using an array of parts marks the part as multi: true", async () => {
    const body = await getMultipartBody(`
      op read(
        @header contentType: "multipart/mixed",
        @multipartBody body: [
          HttpPart<string>[]
        ]): void;
    `);

    strictEqual(body.parts.length, 1);
    strictEqual(body.parts[0].multi, true);
  });

  it("emit diagnostic if using non HttpPart in tuple", async () => {
    const diagnostics = await diagnoseHttpOp(`
      op read(
        @header contentType: "multipart/mixed",
        @multipartBody body: [string]): void;
    `);
    expectDiagnostics(diagnostics, {
      code: "@typespec/http/multipart-part",
      message: "Expect item to be an HttpPart model.",
    });
  });
});

describe("define with the object form", () => {
  it("part explicit name is used", async () => {
    const body = await getMultipartBody(`
      op read(
        @header contentType: "multipart/mixed",
        @multipartBody body: {
          myPropertyPart: HttpPart<string, #{name: "myPart"}>
        }): void;
    `);

    strictEqual(body.parts.length, 1);
    strictEqual(body.parts[0].name, "myPart");
  });

  it("using an array of parts marks the part as multi: true", async () => {
    const body = await getMultipartBody(`
      op read(
        @header contentType: "multipart/mixed",
        @multipartBody body: {
          part: HttpPart<string>[]
        }): void;
    `);

    strictEqual(body.parts.length, 1);
    strictEqual(body.parts[0].multi, true);
  });

  it("emit diagnostic if using non HttpPart in tuple", async () => {
    const diagnostics = await diagnoseHttpOp(`
      op read(
        @header contentType: "multipart/mixed",
        @multipartBody body: { part: string }): void;
    `);
    expectDiagnostics(diagnostics, {
      code: "@typespec/http/multipart-part",
      message: "Expect item to be an HttpPart model.",
    });
  });
});

describe("resolving part payload", () => {
  it("emit diagnostic if trying to use @multipartBody inside an HttpPart", async () => {
    const diagnostics = await diagnoseHttpOp(`
      op read(
        @header contentType: "multipart/mixed",
        @multipartBody body: [HttpPart<{@multipartBody nested: []}>]): void;
    `);
    expectDiagnostics(diagnostics, {
      code: "@typespec/http/multipart-nested",
      message: "Cannot use @multipartBody inside of an HttpPart",
    });
  });
  it("extract headers for the part", async () => {
    const op = await getHttpOp(`
      op read(
        @header contentType: "multipart/mixed",
        @header operationHeader: string;
        @multipartBody body: [
          HttpPart<{
            @body nested: string, 
            @header partHeader: string;
          }>]): void;
    `);

    strictEqual(op.parameters.parameters.length, 2);
    strictEqual(op.parameters.parameters[0].name, "Content-Type");
    strictEqual(op.parameters.parameters[1].name, "operation-header");

    const body = op.parameters.body;
    strictEqual(body?.bodyKind, "multipart");
    strictEqual(body.parts.length, 1);
    strictEqual(body.parts[0].headers.length, 1);
    strictEqual(body.parts[0].headers[0].options.name, "part-header");
  });

  describe("HttpFile part", () => {
    it("emit diagnostic if adding extra properties to File", async () => {
      const diagnostics = await diagnoseHttpOp(`
        model InvalidFile extends File {
          @header extra: string;
        }
        `);

      expectDiagnostics(diagnostics, {
        code: "@typespec/http/http-file-extra-property",
        message: "File model cannot define extra properties. Found 'extra'.",
      });
    });

    it("use of HttpFile resolve optional filename", async () => {
      const op = await getHttpOp(`
        op read(
          @header contentType: "multipart/mixed",
          @multipartBody body: [
            HttpPart<File, #{ name: "file" }>
          ]): void;
        `);

      const body = op.parameters.body;
      strictEqual(body?.bodyKind, "multipart");
      strictEqual(body.parts.length, 1);
      ok(body.parts[0].filename, "Filename property should have been resolved");
      strictEqual(body.parts[0].filename.optional, true);
    });

    it("use of custom HttpFile with required filename resolve required", async () => {
      const op = await getHttpOp(`
        model FileWithFilename extends File {
          filename: string;
        }
        op read(
          @header contentType: "multipart/mixed",
          @multipartBody body: [
            HttpPart<FileWithFilename, #{ name: "file" }>
          ]): void;
        `);

      const body = op.parameters.body;
      strictEqual(body?.bodyKind, "multipart");
      strictEqual(body.parts.length, 1);
      ok(body.parts[0].filename, "Filename property should have been resolved");
      strictEqual(body.parts[0].filename.optional, false);
    });
  });

  describe("part default content type", () => {
    it.each([
      ["bytes", "application/octet-stream"],
      ["File", "*/*"],
      ["string", "text/plain"],
      ["int32", "text/plain"],
      ["string[]", "application/json"],
      ["Foo", "application/json", `model Foo { value: string }`],
    ])("%s body", async (type, expectedContentType, extra?: string) => {
      const body = await getMultipartBody(`
        op upload(
          @header contentType: "multipart/mixed",
          @multipartBody body: [
            HttpPart<${type}>,
            HttpPart<${type}>[]
          ]): void;
        ${extra ?? ""}
      `);

      strictEqual(body.parts.length, 2);
      deepStrictEqual(body.parts[0].body.contentTypes, [expectedContentType]);
      deepStrictEqual(body.parts[1].body.contentTypes, [expectedContentType]);
    });
  });
});

async function getHttpOp(code: string) {
  const [ops, diagnostics] = await getOperationsWithServiceNamespace(code);
  expectDiagnosticEmpty(diagnostics);
  strictEqual(ops.length, 1);
  return ops[0];
}

async function getMultipartBody(code: string): Promise<HttpOperationMultipartBody> {
  const op = await getHttpOp(code);
  const body = op.parameters.body;
  strictEqual(body?.bodyKind, "multipart");
  return body;
}

async function diagnoseHttpOp(code: string) {
  const [_, diagnostics] = await getOperationsWithServiceNamespace(code);
  return diagnostics;
}
