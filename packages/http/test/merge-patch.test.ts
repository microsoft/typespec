import { Diagnostic, Model, ModelProperty, Program, Type, TypeKind } from "@typespec/compiler";
import {
  BasicTestRunner,
  expectDiagnosticEmpty,
  expectDiagnostics,
} from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { deepStrictEqual, ok } from "assert";
import { beforeEach, describe, expect, it } from "vitest";
import {
  getMergePatchProperties,
  getMergePatchSource,
  isMergePatch,
} from "../src/experimental/merge-patch/helpers.js";
import { getAllHttpServices } from "../src/operations.js";
import { HttpOperation, RouteResolutionOptions } from "../src/types.js";
import {
  createHttpTestRunner,
  diagnoseOperations,
  getOperationsWithServiceNamespace,
} from "./test-host.js";

function checkNullableUnion(program: Program, union: Type): boolean {
  return (
    $(program).union.is(union) &&
    union.variants.size === 2 &&
    [...union.variants.values()].some(
      (v) => $(program).intrinsic.is(v.type) && v.type.name === $(program).intrinsic.null.name,
    )
  );
}

function getNonNullableType(program: Program, union: Type): Type | undefined {
  if (!$(program).union.is(union)) return undefined;
  const values = [...union.variants.values()]
    .filter((v) => v.type !== $(program).intrinsic.null)
    .flatMap((variant) => variant.type);
  if (values.length !== 1) return undefined;
  return values[0];
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

describe("merge-patch: metadata tests", () => {
  async function testMetadata(
    prop: string,
    metadataType: string,
    propValue: string = "string",
  ): Promise<void> {
    const diag = await diagnoseOperations(`
      model Foo {
        ${metadataType} ${prop}: ${propValue};
        name: string;
        description?: string;
      }
      @patch op update(@body body: MergePatchUpdate<Foo>): void;`);
    expectDiagnostics(diag, {
      code: "@typespec/http/merge-patch-contains-metadata",
      message: `The MergePatch transform does not operate on http envelope metadata.  Remove any http metadata decorators ('@query', '@header', '@path', '@cookie', '@statusCode') from the model passed to the MergePatch template. Found '${metadataType}' decorating property '${prop}'`,
    });
  }
  it("emits a diagnostic when mergePatch target contains @path metadata", async () => {
    await testMetadata("id", "@path");
  });
  it("emits a diagnostic when mergePatch target contains @query metadata", async () => {
    await testMetadata("id", "@query");
  });
  it("emits a diagnostic when mergePatch target contains @header metadata", async () => {
    await testMetadata("id", "@header");
  });
  it("emits a diagnostic when mergePatch target contains @cookie metadata", async () => {
    await testMetadata("id", "@cookie");
  });
  it("emits a disgnostic when mergePatch target contains @statusCode metadata", async () => {
    await testMetadata("code", "@statusCode", "200");
  });
});
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
    expect(program[0].parameters?.body?.contentTypes).toBeDefined();
    expect(program[0].parameters?.body?.contentTypes).toEqual(["application/merge-patch+json"]);
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
    expect(program[0].parameters?.body?.contentTypes).toBeDefined();
    expect(program[0].parameters?.body?.contentTypes).toEqual(["application/merge-patch+json"]);
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
    expect(program[0].parameters?.body?.contentTypes).toBeDefined();
    expect(program[0].parameters?.body?.contentTypes).toEqual(["application/merge-patch+json"]);
  });
  it("uses the merge-patch content type for spread", async () => {
    const [program, diag] = await getOperationsWithServiceNamespace(`
      model Foo {
        id: string;
        name: string;
        description?: string;
      }
      @patch op update(...MergePatchUpdate<Foo>): void;`);
    expectDiagnosticEmpty(diag);
    expect(program[0].parameters?.body?.contentTypes).toBeDefined();
    expect(program[0].parameters?.body?.contentTypes).toEqual(["application/merge-patch+json"]);
  });
  it("emits a diagnostic if content-type is specified with merge-patch @body", async () => {
    const [_, diag] = await getOperationsWithServiceNamespace(`
      model Foo {
        id: string;
        name: string;
        description?: string;
      }
      @patch op update(@header("Content-type") contentType: "application/json", @body body: MergePatchUpdate<Foo>): void;`);
    expectDiagnostics(diag, {
      code: "@typespec/http/merge-patch-content-type",
      message:
        "The content-type of a request using a merge-patch template should be 'application/merge-patch+json' detected a header with content-type 'application/json'.",
    });
  });
  it("emits a diagnostic if content-type is specified with merge-patch union @body", async () => {
    const [_, diag] = await getOperationsWithServiceNamespace(`
      model Foo {
        id: string;
        name: string;
        description?: string;
      }
      @patch op update(@header("Content-type") contentType: "application/json", @body body: MergePatchUpdate<Foo> | null): void;`);
    expectDiagnostics(diag, {
      code: "@typespec/http/merge-patch-content-type",
      message:
        "The content-type of a request using a merge-patch template should be 'application/merge-patch+json' detected a header with content-type 'application/json'.",
    });
  });
  it("emits a diagnostic if content-type is specified with merge-patch @bodyRoot", async () => {
    const [_, diag] = await getOperationsWithServiceNamespace(`
      model Foo {
        id: string;
        name: string;
        description?: string;
      }
      @patch op update(@header("Content-type") contentType: "application/json", @bodyRoot body: MergePatchUpdate<Foo>): void;`);
    expectDiagnostics(diag, {
      code: "@typespec/http/merge-patch-content-type",
      message:
        "The content-type of a request using a merge-patch template should be 'application/merge-patch+json' detected a header with content-type 'application/json'.",
    });
  });
  it("emits a diagnostic if content-type is specified with implicit body", async () => {
    const [_, diag] = await getOperationsWithServiceNamespace(`
      model Foo {
        id: string;
        name: string;
        description?: string;
      }
      @patch op update(@header("Content-type") contentType: "application/json", body: MergePatchUpdate<Foo>): void;`);
    expectDiagnostics(diag, {
      code: "@typespec/http/merge-patch-content-type",
      message:
        "The content-type of a request using a merge-patch template should be 'application/merge-patch+json' detected a header with content-type 'application/json'.",
    });
  });

  it("emits a diagnostic if content-type is specified with spread", async () => {
    const [_, diag] = await getOperationsWithServiceNamespace(`
      model Foo {
        id: string;
        name: string;
        description?: string;
      }
      @patch op update(@header("Content-type") contentType: "application/json", ...MergePatchUpdate<Foo>): void;`);
    expectDiagnostics(diag, {
      code: "@typespec/http/merge-patch-content-type",
      message:
        "The content-type of a request using a merge-patch template should be 'application/merge-patch+json' detected a header with content-type 'application/json'.",
    });
  });

  it("allows setting a compatible content-type with MergePatch", async () => {
    const [_, diag] = await getOperationsWithServiceNamespace(`
      model Foo {
        id: string;
        name: string;
        description?: string;
      }
      @patch op update(@header("Content-type") contentType: "application/merge-patch+json", ...MergePatchUpdate<Foo>): void;`);
    expectDiagnosticEmpty(diag);
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
    expect(bodyType.properties.get("id")?.optional).toBe(true);
    expect(bodyType.properties.get("name")?.optional).toBe(true);
    const description = bodyType.properties.get("description");
    ok(description);
    expect(description.optional).toBe(true);
    expect(checkNullableUnion(runner.program, description!.type)).toBe(true);
  });

  function checkProperty(
    model: Model,
    name: string,
    optional: boolean,
    kind: TypeKind,
    typeName?: string,
  ): ModelProperty {
    const prop = model.properties.get(name);
    ok(prop);
    expect(prop.optional).toBe(optional);
    deepStrictEqual(prop.type.kind, kind);
    if (typeName && (prop.type.kind === "Model" || prop.type.kind === "Scalar")) {
      expect(prop.type.name).toStrictEqual(typeName);
    }
    return prop;
  }

  function isNullableUnion(property: ModelProperty) {
    deepStrictEqual(property.type.kind, "Union");
    expect(checkNullableUnion(runner.program, property.type)).toBe(true);
    return property;
  }

  function validateResource(model: Model): void {
    checkProperty(model, "id", true, "Scalar", "string");
    isNullableUnion(checkProperty(model, "name", true, "Union"));
    isNullableUnion(checkProperty(model, "quantity", true, "Union"));
    expect(
      isNullableUnion(checkProperty(model, "color", true, "Union")).defaultValue,
    ).toBeUndefined();
    expect(
      isNullableUnion(checkProperty(model, "flavor", true, "Union")).defaultValue,
    ).toBeUndefined();
    expect(checkProperty(model, "related", true, "Union").defaultValue).toBeUndefined();
  }
  it("correctly transforms complex type properties", async () => {
    const [typeGraph, diag] = await compileAndDiagnoseWithRunner(
      runner,
      `
      model SubResource {
        name: string;
        description?: string;
      }

      model Resource {
       id: string;
       name?: string;
       quantity?: safeint;
       color: "blue" | "green" | "red" = "blue";
       flavor?: "vanilla" | "chocolate" | "strawberry" = "vanilla";
       related?: Record<Resource>;
       children?: SubResource[];
       tags?: string[];
     }
      @patch op update(@body body: MergePatchUpdate<Resource>): Resource;`,
    );
    expectDiagnosticEmpty(diag);
    const bodyType = typeGraph[0].parameters?.body?.type;
    ok(bodyType);
    deepStrictEqual(bodyType.kind, "Model");
    validateResource(bodyType);
    const related = checkProperty(bodyType, "related", true, "Union");
    ok(related);
    expect(checkNullableUnion(runner.program, related.type)).toBe(true);
    const resource = getNonNullableType(runner.program, related.type);
    ok(resource);
    deepStrictEqual(resource.kind, "Model");
    const valueResource = $(runner.program).record.getElementType(resource);
    ok(valueResource);
    deepStrictEqual(valueResource.kind, "Model");
    validateResource(valueResource);
    const array = checkProperty(bodyType, "children", true, "Union");
    ok(array);
    deepStrictEqual(array.type.kind, "Union");
    const realArray = getNonNullableType(runner.program, array.type);
    ok(realArray);
    deepStrictEqual(realArray.kind, "Model");
    expect($(runner.program).array.is(realArray)).toBe(true);
    const arraySchema = $(runner.program).array.getElementType(realArray);
    ok(arraySchema);
    deepStrictEqual(arraySchema.kind, "Model");
    checkProperty(arraySchema, "name", false, "Scalar", "string");
    checkProperty(arraySchema, "description", true, "Scalar", "string");
  });
  it("handles inherited discriminators", async () => {
    const [typeGraph, diag] = await compileAndDiagnoseWithRunner(
      runner,
      `
      @discriminator("kind")
      model BaseResource {
        kind: string;
        name: string;
        description?: string;
      }

      model Resource extends BaseResource {
       kind: "Resource";
       id: string;
       quantity?: safeint;
     }
      @patch op update(@body body: MergePatchUpdate<BaseResource>): BaseResource;`,
    );
    expectDiagnosticEmpty(diag);
    const bodyType = typeGraph[0].parameters?.body?.type;
    ok(bodyType);
    deepStrictEqual(bodyType.kind, "Model");
    checkProperty(bodyType, "kind", false, "Scalar", "string");
    checkProperty(bodyType, "name", true, "Scalar", "string");
    isNullableUnion(checkProperty(bodyType, "description", true, "Union"));
  });

  it("handles union discriminators", async () => {
    const [typeGraph, diag] = await compileAndDiagnoseWithRunner(
      runner,
      `
      enum WidgetKind {
        Heavy,
        Light,
      }

      model HeavyWidget {
        kind: WidgetKind.Heavy;
        id: string;
        weight: int32 = 10;
        color: "red" | "blue";
      }

      model LightWidget {
        kind: WidgetKind.Light;
        id: string;
        weight: int32 = 10;
        color: "red" | "blue";
      }

      @discriminated
      union Widget {
        heavy: HeavyWidget,
        light: LightWidget,
      }
      
      model Entity {
        widget: Widget;
      }

      @patch op update(@body body: MergePatchUpdate<Entity>): Entity;`,
    );
    expectDiagnosticEmpty(diag);
    const envelope = typeGraph[0].parameters?.body?.type;
    ok(envelope);
    deepStrictEqual(envelope.kind, "Model");
    const bodyType = checkProperty(envelope, "widget", true, "Union").type;
    deepStrictEqual(bodyType.kind, "Union");
    deepStrictEqual(bodyType.variants.size, 2);
    for (const [_, variant] of bodyType.variants) {
      deepStrictEqual(variant.type.kind, "Model");
      checkProperty(variant.type, "kind", false, "EnumMember");
      checkProperty(variant.type, "id", true, "Scalar", "string");
      isNullableUnion(checkProperty(variant.type, "weight", true, "Union"));
      checkProperty(variant.type, "color", true, "Union");
    }
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
    expect(isMergePatch(runner.program, bodyType)).toBe(true);
    const sourceModel = getMergePatchSource(runner.program, bodyType);
    ok(sourceModel);
    deepStrictEqual(sourceModel.kind, "Model");
    expect(sourceModel.name).toStrictEqual("Foo");
    const nameProp = bodyType.properties.get("name");
    ok(nameProp);
    let mpProps = getMergePatchProperties(runner.program, nameProp);
    ok(mpProps);
    expect(mpProps.erasable).toBe(false);
    expect(mpProps.updateBehavior).toStrictEqual("replace");
    deepStrictEqual(mpProps.sourceProperty, sourceModel.properties.get("name"));
    const idProp = bodyType.properties.get("id");
    ok(idProp);
    mpProps = getMergePatchProperties(runner.program, idProp);
    ok(mpProps);
    expect(mpProps.erasable).toBe(false);
    expect(mpProps.updateBehavior).toStrictEqual("replace");
    deepStrictEqual(mpProps.sourceProperty, sourceModel.properties.get("id"));
    const descriptionProp = bodyType.properties.get("description");
    ok(descriptionProp);
    mpProps = getMergePatchProperties(runner.program, descriptionProp);
    ok(mpProps);
    expect(mpProps.erasable).toBe(true);
    expect(mpProps.updateBehavior).toStrictEqual("replace");
    deepStrictEqual(mpProps.sourceProperty, sourceModel.properties.get("description"));
  });
});
