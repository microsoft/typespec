import { Diagnostic, Program, Union } from "@typespec/compiler";
import { unsafe_$ as $ } from "@typespec/compiler/experimental";
import {
  BasicTestRunner,
  expectDiagnosticEmpty,
  expectDiagnostics,
} from "@typespec/compiler/testing";
import { deepStrictEqual, ok } from "assert";
import { beforeEach, describe, it } from "vitest";
import { getMergePatchProperties, getMergePatchSource, isMergePatch } from "../src/merge-patch.js";
import { getAllHttpServices } from "../src/operations.js";
import { HttpOperation, RouteResolutionOptions } from "../src/types.js";
import { createHttpTestRunner, getOperationsWithServiceNamespace } from "./test-host.js";

function isNullableUnion(program: Program, union: Union): boolean {
  return (
    union.variants.size === 2 &&
    [...union.variants.values()].some((v) => v.type === $(program).intrinsic.null)
  );
}

async function compileAndDiagnoseWithRunner(
  runner: BasicTestRunner,
  code: string,
  options?: RouteResolutionOptions,
): Promise<[HttpOperation[], readonly Diagnostic[]]> {
  await runner.compileAndDiagnose(
    `@service(#{title: "Test Service"}) namespace TestService;
      ${code}`,
    {
      noEmit: true,
    },
  );
  const [services] = getAllHttpServices(runner.program, options);
  return [services[0].operations, runner.program.diagnostics];
}

describe("merge-patch: http operation support", () => {
  it("uses the merge-patch content type for explicit body", async () => {
    const [program, diag] = await getOperationsWithServiceNamespace(`
      model Foo {
        id: string;
        name: string;
        description?: string;
      }
      @patch op update(@body body: MergePatchUpdate<Foo>): void;`);
    expectDiagnosticEmpty(diag);
    ok(program[0].parameters?.body?.contentTypes);
    deepStrictEqual(program[0].parameters.body.contentTypes, ["application/merge-patch+json"]);
  });
  it("uses the merge-patch content type for explicit bodyRoot", async () => {
    const [program, diag] = await getOperationsWithServiceNamespace(`
      model Foo {
        id: string;
        name: string;
        description?: string;
      }
      @patch op update(@bodyRoot body: MergePatchUpdate<Foo>): void;`);
    expectDiagnosticEmpty(diag);
    ok(program[0].parameters?.body?.contentTypes);
    deepStrictEqual(program[0].parameters.body.contentTypes, ["application/merge-patch+json"]);
  });
  it("uses the merge-patch content type for implicit body", async () => {
    const [program, diag] = await getOperationsWithServiceNamespace(`
      model Foo {
        id: string;
        name: string;
        description?: string;
      }
      @patch op update(body: MergePatchUpdate<Foo>): void;`);
    expectDiagnosticEmpty(diag);
    ok(program[0].parameters?.body?.contentTypes);
    deepStrictEqual(program[0].parameters.body.contentTypes, ["application/merge-patch+json"]);
  });
  it("emits a diagnostic if content-type is specified with merge-patch", async () => {
    const [_, diag] = await getOperationsWithServiceNamespace(`
      model Foo {
        id: string;
        name: string;
        description?: string;
      }
      @patch op update(@header("Content-type") contentType: "application/json", @body body: MergePatchUpdate<Foo>): void;`);
    expectDiagnostics(diag, {
      code: "merge-patch-content-type",
      message:
        "The content-type of a request using a merge-patch template should be 'application/merge-patch+json' detected a header with content-type 'application/json'.",
    });
  });
});
describe("merge-patch: mutator validation", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createHttpTestRunner();
  });
  it("handles optional and required properties", async () => {
    const [program, diag] = await compileAndDiagnoseWithRunner(
      runner,
      `
      model Foo {
        id: string;
        name: string;
        description?: string;
      }
      @patch op update(@body body: MergePatchUpdate<Foo>): void;`,
    );
    expectDiagnosticEmpty(diag);
    const bodyType = program[0].parameters?.body?.type;
    ok(bodyType);
    deepStrictEqual(bodyType.kind, "Model");
    deepStrictEqual(bodyType.properties.get("id")?.optional, true);
    deepStrictEqual(bodyType.properties.get("name")?.optional, true);
    const description = bodyType.properties.get("description");
    ok(description);
    deepStrictEqual(description.optional, true);
    deepStrictEqual(description.type.kind, "Union");
    deepStrictEqual(isNullableUnion(runner.program, description.type), true);
  });
});
describe("merge-patch: emitter apis", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createHttpTestRunner();
  });
  it("recognizes mergePatch models and properties", async () => {
    const [program, diag] = await compileAndDiagnoseWithRunner(
      runner,
      `
      model Foo {
        id: string;
        name: string;
        description?: string;
      }
      @patch op update(@body body: MergePatchUpdate<Foo>): void;`,
    );
    expectDiagnosticEmpty(diag);
    const bodyType = program[0].parameters?.body?.type;
    ok(bodyType);
    deepStrictEqual(bodyType.kind, "Model");
    deepStrictEqual(isMergePatch(runner.program, bodyType), true);
    const sourceModel = getMergePatchSource(runner.program, bodyType);
    ok(sourceModel);
    deepStrictEqual(sourceModel.kind, "Model");
    deepStrictEqual(sourceModel.name, "Foo");
    const nameProp = bodyType.properties.get("name");
    ok(nameProp);
    let mpProps = getMergePatchProperties(runner.program, nameProp);
    ok(mpProps);
    deepStrictEqual(mpProps.erasable, false);
    deepStrictEqual(mpProps.updateBehavior, "replace");
    deepStrictEqual(mpProps.sourceProperty, sourceModel.properties.get("name"));
    const idProp = bodyType.properties.get("id");
    ok(idProp);
    mpProps = getMergePatchProperties(runner.program, idProp);
    ok(mpProps);
    deepStrictEqual(mpProps.erasable, false);
    deepStrictEqual(mpProps.updateBehavior, "replace");
    deepStrictEqual(mpProps.sourceProperty, sourceModel.properties.get("id"));
    const descriptionProp = bodyType.properties.get("description");
    ok(descriptionProp);
    mpProps = getMergePatchProperties(runner.program, descriptionProp);
    ok(mpProps);
    deepStrictEqual(mpProps.erasable, true);
    deepStrictEqual(mpProps.updateBehavior, "replace");
    deepStrictEqual(mpProps.sourceProperty, sourceModel.properties.get("description"));
  });
});
