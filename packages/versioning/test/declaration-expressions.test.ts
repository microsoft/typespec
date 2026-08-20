import type { TesterInstance } from "@typespec/compiler/testing";
import { expectDiagnostics } from "@typespec/compiler/testing";
import { beforeEach, describe, it } from "vitest";
import { Tester } from "./test-host.js";

// A keyword-form union (`union { ... }`) used in expression position is `expression: true`,
// just like an anonymous `|`-operator union. Its variants can be named and decorated, so
// version-compatibility validation must treat it like a named union (going through
// `validateTargetVersionCompatible`) rather than flattening it like a `|`-operator union.
describe("versioning: declaration expression unions", () => {
  let runner: TesterInstance;

  beforeEach(async () => {
    runner = await Tester.wrap(
      (code) => `
      @versioned(Versions)
      namespace TestService {
        enum Versions {v1, v2, v3, v4}
        ${code}
      }`,
    ).createInstance();
  });

  it("validates a keyword-form union expression like a named union", async () => {
    const diagnostics = await runner.diagnose(`
      @added(Versions.v2)
      model Updated {}

      alias KwUnion = union { string, Updated };

      model Test {
        @typeChangedFrom(Versions.v2, KwUnion)
        prop: string;
      }
    `);

    // Regression: before the fix this incorrectly took the `|`-union flatten path and
    // reported the type-availability diagnostic instead.
    expectDiagnostics(diagnostics, {
      code: "@typespec/versioning/incompatible-versioned-reference",
      message:
        "'TestService.Updated' is referencing versioned type 'TestService.Updated' but is not versioned itself.",
    });
  });

  it("still flattens a `|`-operator union expression", async () => {
    const diagnostics = await runner.diagnose(`
      @added(Versions.v2)
      model Updated {}

      alias OpUnion = string | Updated;

      model Test {
        @typeChangedFrom(Versions.v2, OpUnion)
        prop: string;
      }
    `);

    expectDiagnostics(diagnostics, {
      code: "@typespec/versioning/incompatible-versioned-reference",
      message:
        "'TestService.Test.prop' is referencing type 'TestService.Updated' which does not exist in version 'v1'.",
    });
  });
});
