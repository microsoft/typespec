// Regression tests for service-discovery issues.
// These tests verify that the emitter correctly restricts collection to @service-decorated
// namespaces and does not pick up unreachable types from non-service namespaces.

import type { TesterInstance } from "@typespec/compiler/testing";
import assert from "assert";
import { beforeEach, it } from "vitest";
import { ApiTester, compileAndDiagnose } from "./test-host.js";

let tester: TesterInstance;

beforeEach(async () => {
  tester = await ApiTester.createInstance();
});

// Regression test for https://github.com/microsoft/typespec/issues/11493
// Types that are not reachable from the service namespace must not be emitted,
// even if they share the same name as a service type.
it("does not emit types from non-service namespaces", async () => {
  const spec = `
    namespace OtherNs {
      interface Operations {
        @get @route("/other-ops") listOps(): void;
      }
    }

    @service(#{ title: "MyService" })
    namespace MyService {
      interface Operations {
        @get @route("/service-ops") listServiceOps(): void;
      }
    }
  `;

  const [result] = await compileAndDiagnose(tester, spec, { "skip-format": true });

  const files = [...result.fs.fs.keys()];

  // Only the service interface and controller should be generated — no duplicates with _2 suffix.
  const csFiles = files.filter((f) => f.endsWith(".cs"));
  const operationsFiles = csFiles.filter((f) => f.includes("Operations")).sort();
  assert.ok(
    operationsFiles.every((f) => !f.includes("_2")),
    `No Operations file should have a '_2' suffix. Got: ${operationsFiles.join(", ")}`,
  );
  assert.ok(
    operationsFiles.some((f) => f.endsWith("IOperations.cs")),
    `Expected IOperations.cs in: ${operationsFiles.join(", ")}`,
  );
  assert.ok(
    operationsFiles.some((f) => f.endsWith("OperationsController.cs")),
    `Expected OperationsController.cs in: ${operationsFiles.join(", ")}`,
  );
});

// Regression test for https://github.com/microsoft/typespec/issues/11493 (model variant)
// Models that are not reachable from the service namespace must not be emitted.
it("does not emit models from non-service namespaces", async () => {
  const spec = `
    namespace OtherNs {
      model ErrorResponse {
        code: string;
      }
    }

    @service(#{ title: "MyService" })
    namespace MyService {
      @error
      model ErrorResponse {
        @statusCode code: 400;
        message: string;
      }

      interface Ops {
        @get @route("/items") list(): void;
      }
    }
  `;

  const [result] = await compileAndDiagnose(tester, spec, { "skip-format": true });

  const files = [...result.fs.fs.keys()];

  // Only one ErrorResponse.cs should be generated — no _2 variant.
  const errorResponseFiles = files.filter((f) => f.includes("ErrorResponse"));
  assert.deepStrictEqual(
    errorResponseFiles.length,
    1,
    `Expected exactly one ErrorResponse file, got: ${errorResponseFiles.join(", ")}`,
  );
  assert.ok(
    !errorResponseFiles[0].includes("_2"),
    `ErrorResponse file must not have '_2' suffix: ${errorResponseFiles[0]}`,
  );
});
