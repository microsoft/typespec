import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { serializeCodeModel } from "../../src/code-model-writer.js";
import { withRawJson } from "../../src/lib/raw-json.js";
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

  it("separates serializer metadata from all dollar-prefixed data keys", () => {
    const payload = JSON.parse(`{
      "$id": "1", "$ref": "missing", "$values": [],
      "$$id": "escaped", "$future": true, "__proto__": { "$id": "1" },
      "kind": "future-kind", "crossLanguageDefinitionId": "user-data"
    }`);
    Object.assign(model, { extension: [payload, payload] });

    const document = JSON.parse(serializeCodeModel(context, model));

    expect(document.format).toBe("typespec-csharp-code-model");
    expect(document.version).toBe(2);
    expect(document.root.extension[0]).toEqual({
      $id: "1",
      $$id: "1",
      $$ref: "missing",
      $$values: [],
      $$$id: "escaped",
      $$future: true,
      ["__proto__"]: { $$id: "1" },
      kind: "future-kind",
      crossLanguageDefinitionId: "user-data",
    });
    expect(document.root.extension[1]).toEqual({ $ref: "1" });
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

    expect(document.root.extension.decorators[0].arguments.value.$id).toBe("1");
    expect(document.root.models).toEqual([{ $ref: "1" }, { $ref: "1" }]);
  });

  it.each(["futureField", "__raw", "usage"])("preserves an opaque %s field", (property) => {
    const payload = {
      $id: "1",
      $ref: "2",
      $$id: "3",
      $values: [],
      kind: "model",
      crossLanguageDefinitionId: "user-data",
      usage: 42,
      __raw: { $id: "1" },
    };
    const extension = withRawJson({ [property]: [payload, payload] }, property);
    Object.assign(model, { extension });

    const document = JSON.parse(serializeCodeModel(context, model));
    const expected = {
      $$id: "1",
      $$ref: "2",
      $$$id: "3",
      $$values: [],
      kind: "model",
      crossLanguageDefinitionId: "user-data",
      usage: 42,
      __raw: { $$id: "1" },
    };
    expect(document.root.extension[property]).toEqual([expected, expected]);
    expect(extension[property][0]).toBe(payload);
  });

  it("matches the fixture consumed by the C# deserializer", () => {
    const shared = { kind: "model", name: "Shared", properties: [] };
    const argumentsValue = withRawJson(
      {
        model: shared,
        payload: {
          $id: "1",
          $ref: "missing",
          $values: [{ $id: "1" }],
          kind: "future-kind",
          usage: 42,
          __raw: "keep",
        },
      },
      "payload",
    );
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
    const fixture = new URL(
      "../../../generator/Microsoft.TypeSpec.Generator.Input/test/TestData/TypeSpecInputConverterTests/LoadsVersionedEmitterFixture/tspCodeModel.json",
      import.meta.url,
    );

    expect(JSON.parse(document)).toEqual(JSON.parse(readFileSync(fixture, "utf8")));
  });

  it("preserves cycles reached through an array and a referenceable object", () => {
    const items: unknown[] = [];
    items.push({ kind: "node", items });
    Object.assign(model, { extension: items });

    const document = JSON.parse(serializeCodeModel(context, model));

    expect(document.root.extension).toEqual([{ $id: "1", kind: "node", items: [{ $ref: "1" }] }]);
  });

  it("rejects array-only cycles and cycles in explicitly raw JSON", () => {
    const array: unknown[] = [];
    array.push(array);
    Object.assign(model, { extension: array });
    expect(() => serializeCodeModel(context, model)).toThrow("cyclic JSON array");

    const value: { kind: string; self?: unknown } = { kind: "data" };
    value.self = value;
    Object.assign(model, { extension: withRawJson({ value }, "value") });
    expect(() => serializeCodeModel(context, model)).toThrow("cyclic raw JSON");
  });
});
