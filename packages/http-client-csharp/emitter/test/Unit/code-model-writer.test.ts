import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { serializeCodeModel, writeCodeModel } from "../../src/code-model-writer.js";
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

    expect(document.$version).toBeUndefined();
    expect(document.extension[0]).toEqual({
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
    expect(document.extension[1]).toEqual({ $ref: "1" });
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
    expect(document.extension[property]).toEqual([expected, expected]);
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
      "../../../generator/Microsoft.TypeSpec.Generator.Input/test/TestData/TypeSpecInputConverterTests/LoadsEmitterFixture/tspCodeModel.json",
      import.meta.url,
    );

    expect(JSON.parse(document)).toEqual(JSON.parse(readFileSync(fixture, "utf8")));
  });

  it("preserves cycles reached through an array and a referenceable object", () => {
    const items: unknown[] = [];
    items.push({ kind: "node", items });
    Object.assign(model, { extension: items });

    const document = JSON.parse(serializeCodeModel(context, model));

    expect(document.extension).toEqual([{ $id: "1", kind: "node", items: [{ $ref: "1" }] }]);
  });

  it("rejects cycles in explicitly raw JSON", () => {
    const value: { kind: string; self?: unknown } = { kind: "data" };
    value.self = value;
    Object.assign(model, { extension: withRawJson({ value }, "value") });
    expect(() => serializeCodeModel(context, model)).toThrow("cyclic raw JSON");
  });

  it("writes no format marker through the exported writeCodeModel path", async () => {
    const payload = JSON.parse(`{ "$id": "schema-id", "kind": "unknown" }`);
    Object.assign(model, { extension: withRawJson({ value: payload }, "value") });
    const writeFile = vi.fn();
    context.program.host = { ...context.program.host, writeFile };

    await writeCodeModel(context, model, "/out");

    const [path, content] = writeFile.mock.calls[0];
    expect(path).toBe("/out/tspCodeModel.json");
    expect(content).toBe(serializeCodeModel(context, model));
    const document = JSON.parse(content);
    expect(document.$version).toBeUndefined();
    expect(document.extension).toEqual({ value: { $$id: "schema-id", kind: "unknown" } });
  });
});
