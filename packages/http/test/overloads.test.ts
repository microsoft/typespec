import { Operation } from "@typespec/compiler";
import { BasicTestRunner, expectDiagnostics } from "@typespec/compiler/testing";
import { strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { getHttpOperation, listHttpOperationsIn } from "../src/index.js";
import { createHttpTestRunner } from "./test-host.js";

describe("http: overloads", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createHttpTestRunner();
  });

  it("overloads inherit base overload route and verb", async () => {
    const { uploadString, uploadBytes } = (await runner.compile(`
      @route("/upload")
      @put
      op upload(data: string | bytes, @header contentType: "text/plain" | "application/octet-stream"): void;
      @overload(upload)
      @test op uploadString(data: string, @header contentType: "text/plain" ): void;
      @overload(upload)
      @test  op uploadBytes(data: bytes, @header contentType: "application/octet-stream"): void;
    `)) as { uploadString: Operation; uploadBytes: Operation };

    const [uploadStringHttp] = getHttpOperation(runner.program, uploadString);
    const [uploadBytesHttp] = getHttpOperation(runner.program, uploadBytes);

    strictEqual(uploadStringHttp.path, "/upload");
    strictEqual(uploadStringHttp.verb, "put");
    strictEqual(uploadBytesHttp.path, "/upload");
    strictEqual(uploadBytesHttp.verb, "put");
  });

  it("overloads can change their route or verb", async () => {
    const { upload, uploadString, uploadBytes } = (await runner.compile(`
      @route("/upload")
      @put
      @test op upload(data: string | bytes, @header contentType: "text/plain" | "application/octet-stream"): void;
      @overload(upload)
      @route("/uploadString")
      @test op uploadString(data: string, @header contentType: "text/plain" ): void;
      @overload(upload)
      @post @test op uploadBytes(data: bytes, @header contentType: "application/octet-stream"): void;
    `)) as { upload: Operation; uploadString: Operation; uploadBytes: Operation };

    const [uploadHttp] = getHttpOperation(runner.program, upload);
    const [uploadStringHttp] = getHttpOperation(runner.program, uploadString);
    const [uploadBytesHttp] = getHttpOperation(runner.program, uploadBytes);

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
    await runner.compile(`
      @route("/upload")
      @put
      op upload(data: string | bytes, @header contentType: "text/plain" | "application/octet-stream"): void;
      @overload(upload)
      op uploadString(data: string, @header contentType: "text/plain" ): void;
      @overload(upload)
      op uploadBytes(data: bytes, @header contentType: "application/octet-stream"): void;
    `);

    const [[overload, uploadString, uploadBytes]] = listHttpOperationsIn(
      runner.program,
      runner.program.getGlobalNamespaceType(),
    );

    strictEqual(uploadString.overloading, overload);
    strictEqual(uploadBytes.overloading, overload);
    strictEqual(overload.overloads?.[0], uploadString);
    strictEqual(overload.overloads?.[1], uploadBytes);
  });

  it("overload base route should still be unique with other operations", async () => {
    const diagnostics = await runner.diagnose(`
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
    const diagnostics = await runner.diagnose(`
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
