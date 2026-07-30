// Regression tests for service-discovery issues.
// These tests verify that the emitter correctly restricts collection to @service-decorated
// namespaces and does not pick up types from library/helper namespaces.

import { TesterInstance, TestFileSystem } from "@typespec/compiler/testing";
import assert from "assert";
import { beforeEach, it } from "vitest";
import { ApiTester, compileAndDiagnose } from "./test-host.js";

function getOutputFiles(fs: TestFileSystem): Map<string, string> {
  return fs.fs;
}

let tester: TesterInstance;

beforeEach(async () => {
  tester = await ApiTester.createInstance();
});

// Regression test for https://github.com/microsoft/typespec/issues/11493
// When a library namespace (e.g. Azure.ResourceManager) defines an interface with the
// same name as one in the user's @service namespace (e.g. "Operations"), the emitter
// must NOT collect the library interface. Previously both were collected and the second
// got a `_2` suffix, causing a class/constructor name mismatch in the generated C#.
it("does not emit _2 suffix when a non-service namespace has an interface with the same name", async () => {
  const spec = `
    // Simulate a library namespace (e.g. Azure.ResourceManager) that has its own
    // Operations interface – the emitter must ignore it.
    namespace LibraryNs {
      interface Operations {
        @get @route("/lib-ops") listLibOps(): void;
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

  // The service interface should be generated without any _2 suffix.
  const files = getOutputFiles(result.fs);
  const controllerFile = [...files.entries()].find(([k]) => k.includes("OperationsController.cs"));
  const interfaceFile = [...files.entries()].find(([k]) => k.includes("IOperations.cs"));

  assert.ok(controllerFile, "OperationsController.cs should be emitted");
  assert.ok(interfaceFile, "IOperations.cs should be emitted");

  const [, controllerContents] = controllerFile!;
  const [, interfaceContents] = interfaceFile!;

  assert.ok(
    !controllerContents.includes("_2"),
    `OperationsController.cs must not contain '_2', but got:\n${controllerContents}`,
  );
  assert.ok(
    !interfaceContents.includes("_2"),
    `IOperations.cs must not contain '_2', but got:\n${interfaceContents}`,
  );

  // Sanity-check that the correct class/interface names are present.
  assert.ok(
    controllerContents.includes("public partial class OperationsController"),
    "Controller class should be named OperationsController",
  );
  assert.ok(
    interfaceContents.includes("public interface IOperations"),
    "Business-logic interface should be named IOperations",
  );

  // The library namespace interface should NOT produce a controller file.
  const libraryControllerFile = [...files.entries()].find(([k]) =>
    k.includes("LibraryNsOperationsController.cs"),
  );
  assert.ok(!libraryControllerFile, "LibraryNs controller should not be emitted");
});

// Regression test for https://github.com/microsoft/typespec/issues/11493 (model variant)
// When a library namespace defines a model with the same name as a service model, the
// emitter must not emit both, which would produce a `_2` suffix on the second class.
it("does not emit _2 suffix when a non-service namespace has a model with the same name", async () => {
  const spec = `
    // Library namespace model with the same name as the service model.
    namespace LibraryNs {
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

  const files = getOutputFiles(result.fs);
  const modelFile = [...files.entries()].find(([k]) => k.includes("ErrorResponse.cs"));

  assert.ok(modelFile, "ErrorResponse.cs should be emitted");

  const [, modelContents] = modelFile!;
  assert.ok(
    !modelContents.includes("_2"),
    `ErrorResponse.cs must not contain '_2', but got:\n${modelContents}`,
  );
  assert.ok(
    modelContents.includes("public partial class ErrorResponse"),
    "Model class should be named ErrorResponse",
  );
});
