import { strictEqual } from "node:assert";
import { it } from "vitest";
import { convertOpenAPI3Document } from "../../src/index.js";

it("should convert const schemas to literal types (GitHub Issue #8288)", async () => {
  const tsp = await convertOpenAPI3Document({
    info: {
      title: "Test Service",
      version: "1.0.0",
    },
    openapi: "3.0.0",
    paths: {},
    components: {
      schemas: {
        RealtimeServerEventOutputAudioBufferStarted: {
          type: "object",
          properties: {
            type: {
              "x-stainless-const": true,
              const: "output_audio_buffer.started",
            },
          },
        },
      },
    },
  });

  // The result should contain the literal type, not "unknown"
  strictEqual(tsp.includes('"output_audio_buffer.started"'), true);
  strictEqual(tsp.includes("type: unknown"), false);

  // Also check that the extension is properly handled
  strictEqual(tsp.includes('@extension("x-stainless-const", true)'), true);
});
