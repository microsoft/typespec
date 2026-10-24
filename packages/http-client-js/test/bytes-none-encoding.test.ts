import { expectDiagnostics } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { emit, emitWithDiagnostics } from "./test-host.js";

describe("bytes none encoding", () => {
  it("should not report unknown-encoding for raw bytes request body with application/octet-stream", async () => {
    const code = `
      import "@typespec/http";
      using Http;
      @service(#{ title: "Repro" })
      @server("{endpoint}", "", { endpoint?: url = "http://localhost:3000" })
      namespace Repro;

      @post op upload(
        @header("Content-Type") contentType: "application/octet-stream",
        @body body: bytes,
      ): void;
    `;
    const outputs = await emit(code);
    expect(outputs).toBeDefined();
  });

  it("should not report unknown-encoding for raw bytes response body with application/octet-stream", async () => {
    const code = `
      import "@typespec/http";
      using Http;
      @service(#{ title: "Repro" })
      @server("{endpoint}", "", { endpoint?: url = "http://localhost:3000" })
      namespace Repro;

      @get op download(): {
        @header("Content-Type") contentType: "application/octet-stream";
        @body body: bytes;
      };
    `;
    const outputs = await emit(code);
    expect(outputs).toBeDefined();
  });

  it("should still report unknown-encoding for unsupported explicit encoding on derived scalar", async () => {
    const code = `
      import "@typespec/http";
      using Http;
      @service(#{ title: "Repro" })
      @server("{endpoint}", "", { endpoint?: url = "http://localhost:3000" })
      namespace Repro;

      @encode("invalid-encoding")
      scalar invalidBytes extends bytes;

      @post op upload(
        @body body: invalidBytes,
      ): void;
    `;
    const [, diagnostics] = await emitWithDiagnostics(code);
    expectDiagnostics(diagnostics, [
      { code: "@typespec/http-client-js/unknown-encoding", severity: "warning" },
      { code: "@typespec/http-client-js/unknown-encoding", severity: "warning" },
    ]);
  });

  it("should still report unknown-encoding for unsupported explicit encoding on response body", async () => {
    const code = `
      import "@typespec/http";
      using Http;
      @service(#{ title: "Repro" })
      @server("{endpoint}", "", { endpoint?: url = "http://localhost:3000" })
      namespace Repro;

      @encode("invalid-encoding")
      scalar invalidBytes extends bytes;

      @get op download(): {
        @header("Content-Type") contentType: "application/octet-stream";
        @body body: invalidBytes;
      };
    `;
    const [, diagnostics] = await emitWithDiagnostics(code);
    expectDiagnostics(diagnostics, {
      code: "@typespec/http-client-js/unknown-encoding",
      severity: "warning",
    });
  });
});
