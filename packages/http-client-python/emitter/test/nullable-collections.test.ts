import { expectDiagnostics } from "@typespec/compiler/testing";
import { expect, it } from "vitest";
import { emitCodeModel, type CodeModelType } from "./test-host.js";

interface ModelWithProperties extends CodeModelType {
  properties: { clientName: string; type: CollectionType }[];
}

interface CollectionType extends CodeModelType {
  elementType: CodeModelType;
  elementNullable?: boolean;
}

async function emitCollections(properties: string) {
  const { codeModel, diagnostics } = await emitCodeModel(`
    import "@typespec/http";
    using TypeSpec.Http;
    @service namespace Test;
    model Item { value: string; }
    model Collections { ${properties} }
    @post op echo(@body body: Collections): Collections;
  `);
  expectDiagnostics(diagnostics, []);
  const model = codeModel.types.find((type) => type.name === "Collections") as ModelWithProperties;
  expect(model).toBeDefined();
  return Object.fromEntries(
    model.properties.map((property) => [property.clientName, property.type]),
  );
}

it.each(["Item[]", "Record<Item>"])(
  "preserves nullable elements without mutating shared types for %s",
  async (plainType) => {
    const nullableType = plainType === "Item[]" ? "(Item | null)[]" : "Record<Item | null>";
    const properties = await emitCollections(`
      plain: ${plainType};
      nullable: ${nullableType};
      repeated: ${nullableType};
    `);

    expect(properties.plain.elementNullable).toBeUndefined();
    expect(properties.nullable.elementNullable).toBe(true);
    expect(properties.nullable).not.toBe(properties.plain);
    expect(properties.nullable).toBe(properties.repeated);
    expect(properties.nullable.elementType).toBe(properties.plain.elementType);
    expect(properties.plain.elementType).not.toHaveProperty("nullable");
  },
);

it("preserves nullability at each level of nested collections", async () => {
  const properties = await emitCollections(`
    arrays: ((string | null)[] | null)[];
    dictionaries: Record<Record<string | null> | null>;
    mixed: Record<(string | null)[]>;
  `);

  const nullableStrings = { type: "list", elementNullable: true, elementType: { type: "string" } };
  expect(properties.arrays).toEqual({
    type: "list",
    elementNullable: true,
    elementType: nullableStrings,
  });
  expect(properties.dictionaries).toEqual({
    type: "dict",
    elementNullable: true,
    elementType: { type: "dict", elementNullable: true, elementType: { type: "string" } },
  });
  expect(properties.mixed).toEqual({ type: "dict", elementType: nullableStrings });
});
