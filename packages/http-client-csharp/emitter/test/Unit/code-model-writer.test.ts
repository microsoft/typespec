import { beforeEach, describe, expect, it, vi } from "vitest";
import emitterFixture from "../../../generator/Microsoft.TypeSpec.Generator.Input/test/TestData/TypeSpecInputConverterTests/LoadsEmitterFixture/tspCodeModel.json" with { type: "json" };
import { serializeCodeModel, writeCodeModel } from "../../src/code-model-writer.js";
import type { CSharpEmitterContext } from "../../src/sdk-context.js";
import type { CodeModel } from "../../src/type/code-model.js";
import {
  createCSharpSdkContext,
  createEmitterContext,
  createEmitterTestHost,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("Code-model reference format", () => {
  let context: CSharpEmitterContext;
  let model: CodeModel;

  beforeEach(async () => {
    const host = await createEmitterTestHost();
    const program = await typeSpecCompile("op test(): void;", host);
    context = await createCSharpSdkContext(createEmitterContext(program));
    model = { name: "Test", apiVersions: [], enums: [], constants: [], models: [], clients: [] };
  });

  it("preserves the original dollar-prefixed property names", () => {
    const payload = JSON.parse(`{
      "$id": "1", "$ref": "missing", "$values": [],
      "$$id": "literal", "$$$id": "also-literal", "$future": true
    }`);
    Object.assign(model, { extension: [payload, payload] });

    const document = JSON.parse(serializeCodeModel(context, model));

    expect(document.$version).toBeUndefined();
    expect(document.extension[0]).toEqual({
      $id: "1",
      $ref: "missing",
      $values: [],
      $$id: "literal",
      $$$id: "also-literal",
      $future: true,
    });
    expect(document.extension[1]).toEqual(document.extension[0]);
  });

  it("preserves graph definitions first encountered in decorator arguments", () => {
    const shared = { kind: "model", name: "Shared", properties: [] };
    Object.assign(model, {
      extension: { decorators: [{ name: "example", arguments: { value: shared } }] },
      models: [shared, shared],
    });
    // Place the first definition in the extension, before the typed models collection.
    const reordered = {
      extension: { decorators: [{ name: "example", arguments: { value: shared } }] },
      ...model,
    };

    const document = JSON.parse(serializeCodeModel(context, reordered));

    expect(document.extension.decorators[0].arguments.value.$id).toBe("1");
    expect(document.models).toEqual([{ $ref: "1" }, { $ref: "1" }]);
  });

  it.each(["unknown", "union"])("keeps the original %s example serialization", (kind) => {
    Object.assign(model, {
      extension: {
        kind,
        type: { kind: "unknown" },
        value: { $id: "schema-id", $$id: "literal", usage: 0, __raw: "omitted" },
      },
    });

    const document = JSON.parse(serializeCodeModel(context, model));
    expect(document.extension).toEqual({
      $id: "1",
      kind,
      type: { $id: "2", kind: "unknown" },
      value: { $id: "schema-id", $$id: "literal", usage: "None" },
    });
  });

  it("matches the fixture consumed by the C# deserializer", () => {
    const shared = { kind: "model", name: "Shared", properties: [] };
    const argumentsValue = {
      model: shared,
      payload: {
        $id: "payload-id",
        $ref: "missing",
        $values: [{ $id: "nested-id" }],
        $$id: "literal",
        usage: 0,
        __raw: "omitted",
      },
    };
    Object.assign(model, {
      models: [shared, shared],
      clients: [
        {
          name: "TestClient",
          crossLanguageDefinitionId: "Test.Client",
          decorators: [{ name: "example", arguments: argumentsValue }],
        },
      ],
    });
    const codeModel = { extension: { definition: shared }, ...model };
    const document = serializeCodeModel(context, codeModel);

    expect(document).toBe(JSON.stringify(emitterFixture, null, 2) + "\n");
  });

  it("preserves cycles reached through an array and a referenceable object", () => {
    const items: unknown[] = [];
    items.push({ kind: "node", items });
    Object.assign(model, { extension: items });

    const document = JSON.parse(serializeCodeModel(context, model));

    expect(document.extension).toEqual([{ $id: "1", kind: "node", items: [{ $ref: "1" }] }]);
  });

  it("keeps the original reference encoding inside example values", () => {
    const value: { kind: string; self?: unknown } = { kind: "data" };
    value.self = value;
    Object.assign(model, { extension: { kind: "unknown", value } });
    const document = JSON.parse(serializeCodeModel(context, model));
    expect(document.extension.value).toEqual({
      $id: "2",
      kind: "data",
      self: { $ref: "2" },
    });
  });

  it("preserves the original format through the exported writeCodeModel path", async () => {
    const payload = JSON.parse(`{ "$id": "schema-id", "kind": "unknown" }`);
    Object.assign(model, { extension: { value: payload } });
    const writeFile = vi.fn();
    context.program.host = { ...context.program.host, writeFile };

    await writeCodeModel(context, model, "/out");

    const [path, content] = writeFile.mock.calls[0];
    expect(path).toBe("/out/tspCodeModel.json");
    expect(content).toBe(serializeCodeModel(context, model));
    const document = JSON.parse(content);
    expect(document.$version).toBeUndefined();
    expect(document.extension).toEqual({ value: { $id: "schema-id", kind: "unknown" } });
  });
});
