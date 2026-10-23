import { expectDiagnosticEmpty } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { emitWithDiagnostics } from "./test-host.js";

describe("bytes none encoding", () => {
  it("should not report unknown-encoding for raw bytes body with application/octet-stream", async () => {
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

  it("should still report unknown-encoding for unsupported explicit encoding", async () => {
    const code = `
      import "@typespec/http";
      using Http;
      @service(#{ title: "Repro" })
      @server("{endpoint}", "", { endpoint?: url = "http://localhost:3000" })
      namespace Repro;

      @post op upload(
        @body @encode("invalid-encoding") body: bytes,
      ): void;
    `;
    const [outputs, diagnostics] = await emitWithDiagnostics(code);
    expect(diagnostics.length).toBeGreaterThan(0);
    expect(diagnostics[0].code).toBe("@typespec/http-client-js/unknown-encoding");
  });
});
