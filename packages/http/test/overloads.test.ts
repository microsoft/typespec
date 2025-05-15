import { expectDiagnostics, t } from "@typespec/compiler/testing";
import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { getHttpOperation, listHttpOperationsIn } from "../src/index.js";
import { Tester } from "./test-host.js";

describe("http: overloads", () => {
  it("overloads inherit base overload route and verb", async () => {
    const { uploadString, uploadBytes, program } = await Tester.compile(t.code`
      @route("/upload")
      @put
      op upload(data: string | bytes, @header contentType: "text/plain" | "application/octet-stream"): void;
      @overload(upload)
      op ${t.op("uploadString")}(data: string, @header contentType: "text/plain" ): void;
      @overload(upload)
      op ${t.op("uploadBytes")}(data: bytes, @header contentType: "application/octet-stream"): void;
    `);

    const [uploadStringHttp] = getHttpOperation(program, uploadString);
    const [uploadBytesHttp] = getHttpOperation(program, uploadBytes);

    strictEqual(uploadStringHttp.path, "/upload");
    strictEqual(uploadStringHttp.verb, "put");
    strictEqual(uploadBytesHttp.path, "/upload");
    strictEqual(uploadBytesHttp.verb, "put");
  });

  it("overloads can change their route or verb", async () => {
    const { upload, uploadString, uploadBytes, program } = await Tester.compile(t.code`
      @route("/upload")
      @put
      op ${t.op("upload")}(data: string | bytes, @header contentType: "text/plain" | "application/octet-stream"): void;
      @overload(upload)
      @route("/uploadString")
      op ${t.op("uploadString")}(data: string, @header contentType: "text/plain" ): void;
      @overload(upload)
      @post op ${t.op("uploadBytes")}(data: bytes, @header contentType: "application/octet-stream"): void;
    `);

    const [uploadHttp] = getHttpOperation(program, upload);
    const [uploadStringHttp] = getHttpOperation(program, uploadString);
    const [uploadBytesHttp] = getHttpOperation(program, uploadBytes);

    strictEqual(uploadHttp.path, "/upload");
    strictEqual(uploadHttp.verb, "put");

    // Change to /uploadString
    strictEqual(uploadStringHttp.path, "/uploadString");
    strictEqual(uploadStringHttp.verb, "put");

    // Changed to post
    strictEqual(uploadBytesHttp.path, "/upload");
    strictEqual(uploadBytesHttp.verb, "post");
  });

  it("links overloads", async () => {
    const { program } = await Tester.compile(t.code`
      @route("/upload")
      @put
      op upload(data: string | bytes, @header contentType: "text/plain" | "application/octet-stream"): void;
      @overload(upload)
      op uploadString(data: string, @header contentType: "text/plain" ): void;
      @overload(upload)
      op uploadBytes(data: bytes, @header contentType: "application/octet-stream"): void;
    `);

    const [[overload, uploadString, uploadBytes]] = listHttpOperationsIn(
      program,
      program.getGlobalNamespaceType(),
    );

    strictEqual(uploadString.overloading, overload);
    strictEqual(uploadBytes.overloading, overload);
    strictEqual(overload.overloads?.[0], uploadString);
    strictEqual(overload.overloads?.[1], uploadBytes);
  });

  it("overload base route should still be unique with other operations", async () => {
    const diagnostics = await Tester.diagnose(`
      @route("/upload")
      op otherUpload(data: bytes): void;

      @route("/upload")
      op upload(data: string | bytes, @header contentType: "text/plain" | "application/octet-stream"): void;
      @overload(upload)
      op uploadString(data: string, @header contentType: "text/plain" ): void;
      @overload(upload)
      op uploadBytes(data: bytes, @header contentType: "application/octet-stream"): void;
    `);
    expectDiagnostics(diagnostics, [
      {
        code: "@typespec/http/duplicate-operation",
        message: `Duplicate operation "otherUpload" routed at "post /upload".`,
      },
      {
        code: "@typespec/http/duplicate-operation",
        message: `Duplicate operation "upload" routed at "post /upload".`,
      },
    ]);
  });

  it("overloads route should still be unique with other operations", async () => {
    const diagnostics = await Tester.diagnose(`
      @route("/uploadString")
      op otherUploadString(data: string): void;

      @route("/upload")
      op upload(data: string | bytes, @header contentType: "text/plain" | "application/octet-stream"): void;
      @overload(upload)
      @route("/uploadString")
      op uploadString(data: string, @header contentType: "text/plain" ): void;
      @overload(upload)
      op uploadBytes(data: bytes, @header contentType: "application/octet-stream"): void;
    `);
    expectDiagnostics(diagnostics, [
      {
        code: "@typespec/http/duplicate-operation",
        message: `Duplicate operation "otherUploadString" routed at "post /uploadString".`,
      },
      {
        code: "@typespec/http/duplicate-operation",
        message: `Duplicate operation "uploadString" routed at "post /uploadString".`,
      },
    ]);
  });
});
