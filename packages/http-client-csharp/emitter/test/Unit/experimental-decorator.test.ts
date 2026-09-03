import { deepStrictEqual, strictEqual } from "assert";
import { describe, it } from "vitest";
import { getExperimentalDetails } from "../../src/lib/decorators.js";

describe("experimental decorator metadata", () => {
  it("extracts diagnostic and dependency identifiers", () => {
    const details = getExperimentalDetails([
      {
        name: "TypeSpec.HttpClient.@experimental",
        arguments: {
          options: {
            emitterScope: "@typespec/http-client-csharp",
            diagnosticId: "C",
            dependsOn: ["A", "B"],
          },
        },
      },
    ]);

    deepStrictEqual(details, {
      diagnosticId: "C",
      dependsOn: ["A", "B"],
    });
  });

  it("ignores metadata scoped to another emitter", () => {
    const details = getExperimentalDetails([
      {
        name: "TypeSpec.HttpClient.@experimental",
        arguments: {
          options: {
            emitterScope: "other-emitter",
            diagnosticId: "C",
          },
        },
      },
    ]);

    strictEqual(details, undefined);
  });

  it("applies unscoped metadata", () => {
    const details = getExperimentalDetails([
      {
        name: "TypeSpec.HttpClient.@experimental",
        arguments: {
          options: {
            diagnosticId: "C",
          },
        },
      },
    ]);

    deepStrictEqual(details, {
      diagnosticId: "C",
      dependsOn: [],
    });
  });
});
