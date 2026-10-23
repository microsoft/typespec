import { expectDiagnosticEmpty } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { emitWithDiagnostics } from "./test-host.js";

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
    const [outputs, diagnostics] = await emitWithDiagnostics(code);
    expectDiagnosticEmpty(diagnostics);
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
    const [outputs, diagnostics] = await emitWithDiagnostics(code);
    expectDiagnosticEmpty(diagnostics);
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
    const [outputs, diagnostics] = await emitWithDiagnostics(code);
    expect(diagnostics.length).toBeGreaterThan(0);
    expect(diagnostics.some((d) => d.code === "@typespec/http-client-js/unknown-encoding")).toBe(true);
  });
});
