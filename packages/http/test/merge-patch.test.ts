import { Diagnostic, Model, ModelProperty, Program, Type, TypeKind } from "@typespec/compiler";
import {
  expectDiagnosticEmpty,
  expectDiagnostics,
  TesterInstance,
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
import { diagnoseOperations, getOperationsWithServiceNamespace, Tester } from "./test-host.js";

let runner: TesterInstance;
beforeEach(async () => {
  runner = await Tester.createInstance();
});

function checkNullableUnion(program: Program, union: Type): boolean {
  return (
    $(program).union.is(union) &&
    union.variants.size === 2 &&
    [...union.variants.values()].some(
      (v) => $(program).intrinsic.is(v.type) && v.type.name === $(program).intrinsic.null.name,
    )
  );
}

function getNonNullableType(union: Type): Type | undefined {
  const program: Program = runner.program;
  if (!$(program).union.is(union)) return undefined;
  const values = [...union.variants.values()]
    .filter((v) => v.type !== $(program).intrinsic.null)
    .flatMap((variant) => variant.type);
  if (values.length !== 1) return undefined;
  return values[0];
}

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
  const program: Program = runner.program;
  deepStrictEqual(property.type.kind, "Union");
  expect(checkNullableUnion(program, property.type)).toBe(true);
  return property;
}
async function compileAndDiagnoseWithRunner(
  runner: TesterInstance,
  code: string,
  options?: RouteResolutionOptions,
): Promise<[HttpOperation[], readonly Diagnostic[]]> {
  await runner.compileAndDiagnose(
    `@service(#{title: "Test Service"}) namespace TestService;
      ${code}`,
  );
  const [services] = getAllHttpServices(runner.program, options);
  return [services[0].operations, runner.program.diagnostics];
}

describe("metadata tests", () => {
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
describe("http operation support", () => {
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
      #suppress "@typespec/http/patch-implicit-optional" "For test only ignore correct merge patch"
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
describe("mutator validation", () => {
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
    const resource = getNonNullableType(related.type);
    ok(resource);
    deepStrictEqual(resource.kind, "Model");
    const valueResource = $(runner.program).record.getElementType(resource);
    ok(valueResource);
    deepStrictEqual(valueResource.kind, "Model");
    validateResource(valueResource);
    const array = checkProperty(bodyType, "children", true, "Union");
    ok(array);
    deepStrictEqual(array.type.kind, "Union");
    const realArray = getNonNullableType(array.type);
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
describe("emitter apis", () => {
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
describe("visibility transforms", () => {
  it("allows invisible metadata in MergePatchUpdate", async () => {
    const [typeGraph, diag] = await compileAndDiagnoseWithRunner(
      runner,
      `
      model Foo {
        @visibility(Lifecycle.Create, Lifecycle.Read)
        @path id: string;
        description?: string;
        @visibility(Lifecycle.Create)
        createOnly?: string;
        @visibility(Lifecycle.Update)
        updateOnly?: string;
        @visibility(Lifecycle.Read)
        readOnly?: string;
      }

      @patch op update(@body body: MergePatchUpdate<Foo>): Foo;`,
    );
    expectDiagnosticEmpty(diag);
    const envelope = typeGraph[0].parameters?.body?.type;
    ok(envelope);
    deepStrictEqual(envelope.kind, "Model");
    isNullableUnion(checkProperty(envelope, "description", true, "Union"));
    isNullableUnion(checkProperty(envelope, "updateOnly", true, "Union"));
    expect(envelope.properties.size).toBe(2);
  });
  it("handles basic visibility for MergePatchUpdate", async () => {
    const [typeGraph, diag] = await compileAndDiagnoseWithRunner(
      runner,
      `
      model Foo {
        id: string;
        description?: string;
        @visibility(Lifecycle.Create)
        createOnly?: string;
        @visibility(Lifecycle.Update)
        updateOnly?: string;
        @visibility(Lifecycle.Read)
        readOnly?: string;
      }

      @patch op update(@body body: MergePatchUpdate<Foo>): Foo;`,
    );
    expectDiagnosticEmpty(diag);
    const envelope = typeGraph[0].parameters?.body?.type;
    ok(envelope);
    deepStrictEqual(envelope.kind, "Model");
    checkProperty(envelope, "id", true, "Scalar", "string");
    isNullableUnion(checkProperty(envelope, "description", true, "Union"));
    isNullableUnion(checkProperty(envelope, "updateOnly", true, "Union"));
    expect(envelope.properties.size).toBe(3);
  });
  it("handles complex array property visibility for MergePatchUpdate", async () => {
    const [typeGraph, diag] = await compileAndDiagnoseWithRunner(
      runner,
      `
      model Bar {
        id: string;
        description?: string;
        @visibility(Lifecycle.Create)
        createOnly?: string;
        @visibility(Lifecycle.Update)
        updateOnly?: string;
        @visibility(Lifecycle.Read)
        readOnly?: string;
      }
      
      model Foo {
        subject: Bar[];
      }

      @patch op update(@body body: MergePatchUpdate<Foo>): Foo;`,
    );
    expectDiagnosticEmpty(diag);
    const envelope = typeGraph[0].parameters?.body?.type;
    ok(envelope);
    deepStrictEqual(envelope.kind, "Model");
    const array = checkProperty(envelope, "subject", true, "Model").type;
    deepStrictEqual(array.kind, "Model");
    const innerEnvelope = array.indexer?.value;
    ok(innerEnvelope);
    deepStrictEqual(innerEnvelope.kind, "Model");
    checkProperty(innerEnvelope, "id", false, "Scalar", "string");
    checkProperty(innerEnvelope, "description", true, "Scalar", "string");
    checkProperty(innerEnvelope, "createOnly", true, "Scalar", "string");
    expect(innerEnvelope.properties.size).toBe(3);
  });
  it("handles model is with MergePatchUpdate", async () => {
    const [typeGraph, diag] = await compileAndDiagnoseWithRunner(
      runner,
      `
      model Bar {
        id: string;
        description?: string;
        @visibility(Lifecycle.Create)
        createOnly?: string;
        @visibility(Lifecycle.Update)
        updateOnly?: string;
        @visibility(Lifecycle.Read)
        readOnly?: string;
      }
      
      model Foo {
        subject: Bar[];
      }
      
      model Baz is MergePatchUpdate<Foo>;

      @patch op update(@body body: Baz): Foo;`,
    );
    expectDiagnosticEmpty(diag);
    const envelope = typeGraph[0].parameters?.body?.type;
    ok(envelope);
    deepStrictEqual(envelope.kind, "Model");
    const array = checkProperty(envelope, "subject", true, "Model").type;
    deepStrictEqual(array.kind, "Model");
    const innerEnvelope = array.indexer?.value;
    ok(innerEnvelope);
    deepStrictEqual(innerEnvelope.kind, "Model");
    checkProperty(innerEnvelope, "id", false, "Scalar", "string");
    checkProperty(innerEnvelope, "description", true, "Scalar", "string");
    checkProperty(innerEnvelope, "createOnly", true, "Scalar", "string");
    expect(innerEnvelope.properties.size).toBe(3);
  });
  it("handles complex record property visibility for MergePatchUpdate", async () => {
    const [typeGraph, diag] = await compileAndDiagnoseWithRunner(
      runner,
      `
      model Bar {
        id: string;
        description?: string;
        @visibility(Lifecycle.Create)
        createOnly?: string;
        @visibility(Lifecycle.Update)
        updateOnly?: string;
        @visibility(Lifecycle.Read)
        readOnly?: string;
      }
      
      model Foo {
        subject: Record<Bar>;
      }

      @patch op update(@body body: MergePatchUpdate<Foo>): Foo;`,
    );
    expectDiagnosticEmpty(diag);
    const envelope = typeGraph[0].parameters?.body?.type;
    ok(envelope);
    deepStrictEqual(envelope.kind, "Model");
    const record = checkProperty(envelope, "subject", true, "Model").type;
    deepStrictEqual(record.kind, "Model");
    const innerEnvelope = record.indexer?.value;
    ok(innerEnvelope);
    deepStrictEqual(innerEnvelope.kind, "Model");
    checkProperty(innerEnvelope, "id", true, "Scalar", "string");
    isNullableUnion(checkProperty(innerEnvelope, "description", true, "Union"));
    isNullableUnion(checkProperty(innerEnvelope, "createOnly", true, "Union"));
    isNullableUnion(checkProperty(innerEnvelope, "updateOnly", true, "Union"));
    expect(innerEnvelope.properties.size).toBe(4);
  });
  it("handles complex (required) model property visibility for MergePatchUpdate", async () => {
    const [typeGraph, diag] = await compileAndDiagnoseWithRunner(
      runner,
      `
      model Bar {
        id: string;
        description?: string;
        @visibility(Lifecycle.Create)
        createOnly?: string;
        @visibility(Lifecycle.Update)
        updateOnly?: string;
        @visibility(Lifecycle.Read)
        readOnly?: string;
      }
      
      model Foo {
        subject: Bar;
      }

      @patch op update(@body body: MergePatchUpdate<Foo>): Foo;`,
    );
    expectDiagnosticEmpty(diag);
    const envelope = typeGraph[0].parameters?.body?.type;
    ok(envelope);
    deepStrictEqual(envelope.kind, "Model");
    const innerEnvelope = checkProperty(envelope, "subject", true, "Model").type;
    ok(innerEnvelope);
    deepStrictEqual(innerEnvelope.kind, "Model");
    checkProperty(innerEnvelope, "id", true, "Scalar", "string");
    isNullableUnion(checkProperty(innerEnvelope, "description", true, "Union"));
    isNullableUnion(checkProperty(innerEnvelope, "updateOnly", true, "Union"));
    expect(innerEnvelope.properties.size).toBe(3);
  });
  it("handles complex tuple model property visibility for MergePatchUpdate", async () => {
    const [typeGraph, diag] = await compileAndDiagnoseWithRunner(
      runner,
      `
      model Bar {
        id: string;
        description?: string;
        @visibility(Lifecycle.Create)
        createOnly?: string;
        @visibility(Lifecycle.Update)
        updateOnly?: string;
        @visibility(Lifecycle.Read)
        readOnly?: string;
      }
      
      model Foo {
        subject: [Bar];
      }

      @patch op update(@body body: MergePatchUpdate<Foo>): Foo;`,
    );
    expectDiagnosticEmpty(diag);
    const envelope = typeGraph[0].parameters?.body?.type;
    ok(envelope);
    deepStrictEqual(envelope.kind, "Model");
    const tuple = checkProperty(envelope, "subject", true, "Tuple").type;
    ok(tuple);
    deepStrictEqual(tuple.kind, "Tuple");
    const innerEnvelope = tuple.values[0];
    ok(innerEnvelope);
    deepStrictEqual(innerEnvelope.kind, "Model");
    checkProperty(innerEnvelope, "id", false, "Scalar", "string");
    checkProperty(innerEnvelope, "description", true, "Scalar", "string");
    checkProperty(innerEnvelope, "createOnly", true, "Scalar", "string");
    expect(innerEnvelope.properties.size).toBe(3);
  });
  it("handles complex (optional) model property visibility for MergePatchUpdate", async () => {
    const [typeGraph, diag] = await compileAndDiagnoseWithRunner(
      runner,
      `
      model Bar {
        id: string;
        description?: string;
        @visibility(Lifecycle.Create)
        createOnly?: string;
        @visibility(Lifecycle.Update)
        updateOnly?: string;
        @visibility(Lifecycle.Read)
        readOnly?: string;
      }
      
      model Foo {
        subject?: Bar;
      }

      @patch op update(@body body: MergePatchUpdate<Foo>): Foo;`,
    );
    expectDiagnosticEmpty(diag);
    const envelope = typeGraph[0].parameters?.body?.type;
    ok(envelope);
    deepStrictEqual(envelope.kind, "Model");
    const union = isNullableUnion(checkProperty(envelope, "subject", true, "Union")).type;
    ok(union);
    deepStrictEqual(union.kind, "Union");
    const innerEnvelope = getNonNullableType(union);
    ok(innerEnvelope);
    deepStrictEqual(innerEnvelope.kind, "Model");
    checkProperty(innerEnvelope, "id", true, "Scalar", "string");
    isNullableUnion(checkProperty(innerEnvelope, "description", true, "Union"));
    isNullableUnion(checkProperty(innerEnvelope, "createOnly", true, "Union"));
    isNullableUnion(checkProperty(innerEnvelope, "updateOnly", true, "Union"));
    expect(innerEnvelope.properties.size).toBe(4);
  });
  it("handles complex union property visibility for MergePatchUpdate", async () => {
    const [typeGraph, diag] = await compileAndDiagnoseWithRunner(
      runner,
      `
      model Bar {
        id: string;
        description?: string;
        @visibility(Lifecycle.Create)
        createOnly?: string;
        @visibility(Lifecycle.Update)
        updateOnly?: string;
        @visibility(Lifecycle.Read)
        readOnly?: string;
      }

      model Baz {
        id: string;
        description?: string;
        @visibility(Lifecycle.Create)
        createOnly?: string;
        @visibility(Lifecycle.Update)
        updateOnly?: string;
        @visibility(Lifecycle.Read)
        readOnly?: string;
      }
      
      model Foo {
        subject: Bar | Baz;
      }

      @patch op update(@body body: MergePatchUpdate<Foo>): Foo;`,
    );
    expectDiagnosticEmpty(diag);
    const envelope = typeGraph[0].parameters?.body?.type;
    ok(envelope);
    deepStrictEqual(envelope.kind, "Model");
    const union = checkProperty(envelope, "subject", true, "Union").type;
    ok(union);
    deepStrictEqual(union.kind, "Union");
    for (const [_, variant] of union.variants) {
      const innerEnvelope = variant.type;
      ok(innerEnvelope);
      deepStrictEqual(innerEnvelope.kind, "Model");
      checkProperty(innerEnvelope, "id", true, "Scalar", "string");
      isNullableUnion(checkProperty(innerEnvelope, "description", true, "Union"));
      isNullableUnion(checkProperty(innerEnvelope, "createOnly", true, "Union"));
      isNullableUnion(checkProperty(innerEnvelope, "updateOnly", true, "Union"));
      expect(innerEnvelope.properties.size).toBe(4);
    }
  });
  it("handles basic visibility for MergePatchCreateOrUpdate", async () => {
    const [typeGraph, diag] = await compileAndDiagnoseWithRunner(
      runner,
      `
      model Foo {
        id: string;
        description?: string;
        @visibility(Lifecycle.Create)
        createOnly?: string;
        @visibility(Lifecycle.Update)
        updateOnly?: string;
        @visibility(Lifecycle.Read)
        readOnly?: string;
      }

      @patch op update(@body body: MergePatchCreateOrUpdate<Foo>): Foo;`,
    );
    expectDiagnosticEmpty(diag);
    const envelope = typeGraph[0].parameters?.body?.type;
    ok(envelope);
    deepStrictEqual(envelope.kind, "Model");
    checkProperty(envelope, "id", true, "Scalar", "string");
    isNullableUnion(checkProperty(envelope, "description", true, "Union"));
    isNullableUnion(checkProperty(envelope, "createOnly", true, "Union"));
    isNullableUnion(checkProperty(envelope, "updateOnly", true, "Union"));
    expect(envelope.properties.size).toBe(4);
  });
  it("handles complex array property visibility for MergePatchCreateOrUpdate", async () => {
    const [typeGraph, diag] = await compileAndDiagnoseWithRunner(
      runner,
      `
      model Bar {
        id: string;
        description?: string;
        @visibility(Lifecycle.Create)
        createOnly?: string;
        @visibility(Lifecycle.Update)
        updateOnly?: string;
        @visibility(Lifecycle.Read)
        readOnly?: string;
      }
      
      model Foo {
        subject: Bar[];
      }

      @patch op update(@body body: MergePatchCreateOrUpdate<Foo>): Foo;`,
    );
    expectDiagnosticEmpty(diag);
    const envelope = typeGraph[0].parameters?.body?.type;
    ok(envelope);
    deepStrictEqual(envelope.kind, "Model");
    const array = checkProperty(envelope, "subject", true, "Model").type;
    deepStrictEqual(array.kind, "Model");
    const innerEnvelope = array.indexer?.value;
    ok(innerEnvelope);
    deepStrictEqual(innerEnvelope.kind, "Model");
    checkProperty(innerEnvelope, "id", false, "Scalar", "string");
    checkProperty(innerEnvelope, "description", true, "Scalar", "string");
    checkProperty(innerEnvelope, "createOnly", true, "Scalar", "string");
    expect(innerEnvelope.properties.size).toBe(3);
  });
  it("handles complex record property visibility for MergePatchCreateOrUpdate", async () => {
    const [typeGraph, diag] = await compileAndDiagnoseWithRunner(
      runner,
      `
      model Bar {
        id: string;
        description?: string;
        @visibility(Lifecycle.Create)
        createOnly?: string;
        @visibility(Lifecycle.Update)
        updateOnly?: string;
        @visibility(Lifecycle.Read)
        readOnly?: string;
      }
      
      model Foo {
        subject: Record<Bar>;
      }

      @patch op update(@body body: MergePatchCreateOrUpdate<Foo>): Foo;`,
    );
    expectDiagnosticEmpty(diag);
    const envelope = typeGraph[0].parameters?.body?.type;
    ok(envelope);
    deepStrictEqual(envelope.kind, "Model");
    const record = checkProperty(envelope, "subject", true, "Model").type;
    deepStrictEqual(record.kind, "Model");
    const innerEnvelope = record.indexer?.value;
    ok(innerEnvelope);
    deepStrictEqual(innerEnvelope.kind, "Model");
    checkProperty(innerEnvelope, "id", true, "Scalar", "string");
    isNullableUnion(checkProperty(innerEnvelope, "description", true, "Union"));
    isNullableUnion(checkProperty(innerEnvelope, "createOnly", true, "Union"));
    isNullableUnion(checkProperty(innerEnvelope, "updateOnly", true, "Union"));
    expect(innerEnvelope.properties.size).toBe(4);
  });
  it("handles complex (required) model property visibility for MergePatchCreateOrUpdate", async () => {
    const [typeGraph, diag] = await compileAndDiagnoseWithRunner(
      runner,
      `
      model Bar {
        id: string;
        description?: string;
        @visibility(Lifecycle.Create)
        createOnly?: string;
        @visibility(Lifecycle.Update)
        updateOnly?: string;
        @visibility(Lifecycle.Read)
        readOnly?: string;
      }
      
      model Foo {
        subject: Bar;
      }

      @patch op update(@body body: MergePatchCreateOrUpdate<Foo>): Foo;`,
    );
    expectDiagnosticEmpty(diag);
    const envelope = typeGraph[0].parameters?.body?.type;
    ok(envelope);
    deepStrictEqual(envelope.kind, "Model");
    const innerEnvelope = checkProperty(envelope, "subject", true, "Model").type;
    ok(innerEnvelope);
    deepStrictEqual(innerEnvelope.kind, "Model");
    checkProperty(innerEnvelope, "id", true, "Scalar", "string");
    isNullableUnion(checkProperty(innerEnvelope, "description", true, "Union"));
    isNullableUnion(checkProperty(innerEnvelope, "createOnly", true, "Union"));
    isNullableUnion(checkProperty(innerEnvelope, "updateOnly", true, "Union"));
    expect(innerEnvelope.properties.size).toBe(4);
  });
  it("handles complex (optional) model property visibility for MergePatchCreateOrUpdate", async () => {
    const [typeGraph, diag] = await compileAndDiagnoseWithRunner(
      runner,
      `
      model Bar {
        id: string;
        description?: string;
        @visibility(Lifecycle.Create)
        createOnly?: string;
        @visibility(Lifecycle.Update)
        updateOnly?: string;
        @visibility(Lifecycle.Read)
        readOnly?: string;
      }
      
      model Foo {
        subject?: Bar;
      }

      @patch op update(@body body: MergePatchCreateOrUpdate<Foo>): Foo;`,
    );
    expectDiagnosticEmpty(diag);
    const envelope = typeGraph[0].parameters?.body?.type;
    ok(envelope);
    deepStrictEqual(envelope.kind, "Model");
    const union = isNullableUnion(checkProperty(envelope, "subject", true, "Union")).type;
    ok(union);
    deepStrictEqual(union.kind, "Union");
    const innerEnvelope = getNonNullableType(union);
    ok(innerEnvelope);
    deepStrictEqual(innerEnvelope.kind, "Model");
    checkProperty(innerEnvelope, "id", true, "Scalar", "string");
    isNullableUnion(checkProperty(innerEnvelope, "description", true, "Union"));
    isNullableUnion(checkProperty(innerEnvelope, "createOnly", true, "Union"));
    isNullableUnion(checkProperty(innerEnvelope, "updateOnly", true, "Union"));
    expect(innerEnvelope.properties.size).toBe(4);
  });
  it("handles complex union property visibility for MergePatchCreateOrUpdate", async () => {
    const [typeGraph, diag] = await compileAndDiagnoseWithRunner(
      runner,
      `
      model Bar {
        id: string;
        description?: string;
        @visibility(Lifecycle.Create)
        createOnly?: string;
        @visibility(Lifecycle.Update)
        updateOnly?: string;
        @visibility(Lifecycle.Read)
        readOnly?: string;
      }

      model Baz {
        id: string;
        description?: string;
        @visibility(Lifecycle.Create)
        createOnly?: string;
        @visibility(Lifecycle.Update)
        updateOnly?: string;
        @visibility(Lifecycle.Read)
        readOnly?: string;
      }
      
      model Foo {
        subject: Bar | Baz;
      }

      @patch op update(@body body: MergePatchCreateOrUpdate<Foo>): Foo;`,
    );
    expectDiagnosticEmpty(diag);
    const envelope = typeGraph[0].parameters?.body?.type;
    ok(envelope);
    deepStrictEqual(envelope.kind, "Model");
    const union = checkProperty(envelope, "subject", true, "Union").type;
    ok(union);
    deepStrictEqual(union.kind, "Union");
    for (const [_, variant] of union.variants) {
      const innerEnvelope = variant.type;
      ok(innerEnvelope);
      deepStrictEqual(innerEnvelope.kind, "Model");
      checkProperty(innerEnvelope, "id", true, "Scalar", "string");
      isNullableUnion(checkProperty(innerEnvelope, "description", true, "Union"));
      isNullableUnion(checkProperty(innerEnvelope, "createOnly", true, "Union"));
      isNullableUnion(checkProperty(innerEnvelope, "updateOnly", true, "Union"));
      expect(innerEnvelope.properties.size).toBe(4);
    }
  });
});
