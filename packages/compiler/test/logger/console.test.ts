import { describe, expect, it } from "vitest";
import { formatDiagnostic } from "../../src/core/logger/console-sink.js";
import { createSourceFile, Diagnostic } from "../../src/index.js";

describe("formatDiagnostics", () => {
  it("handles synthetic sources", async () => {
    const diagnostic: Diagnostic = {
      code: "test.code",
      message: "This is a test diagnostic",
      severity: "warning",
      target: {
        file: createSourceFile("", "<unknown location>"),
        pos: 0,
        end: 0,
        isSynthetic: true,
      },
    };

    const formatted = formatDiagnostic(diagnostic, { pathRelativeTo: "/" });
    expect(formatted).toBe("<unknown location>:1:1 - warning test.code: This is a test diagnostic");
  });
});
