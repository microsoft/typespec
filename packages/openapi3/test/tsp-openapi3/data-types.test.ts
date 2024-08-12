import { Model } from "@typespec/compiler";
import { assert, describe, expect, it } from "vitest";
import { tspForOpenAPI3 } from "./utils/tsp-for-openapi3.js";

describe("converts top-level schemas", () => {
  it("handles scalars", async () => {
    const serviceNamespace = await tspForOpenAPI3({
      schemas: {
        CustomBoolean: {
          type: "boolean",
        },
        CustomInteger: {
          type: "integer",
          format: "int32",
        },
        CustomString: {
          type: "string",
        },
      },
    });

    const scalars = serviceNamespace.scalars;
    /* scalar CustomBoolean extends boolean; */
    expect(scalars.get("CustomBoolean")?.baseScalar?.name).toBe("boolean");
    /* scalar CustomInteger extends int32; */
    expect(scalars.get("CustomInteger")?.baseScalar?.name).toBe("int32");
    /* scalar CustomString extends string; */
    expect(scalars.get("CustomString")?.baseScalar?.name).toBe("string");
  });

  it("handles arrays", async () => {
    const serviceNamespace = await tspForOpenAPI3({
      schemas: {
        CustomArray: {
          type: "array",
          items: {
            type: "string",
          },
        },
        ArrayOfArrays: {
          type: "array",
          items: { $ref: "#/components/schemas/CustomArray" },
        },
      },
    });

    const models = serviceNamespace.models;

    /* model CustomArray is string[]; */
    const customArray = models.get("CustomArray")!;
    expect(customArray?.indexer).toBeDefined();
    expect(customArray.indexer?.key.name).toBe("integer");
    assert(
      customArray.indexer?.value.kind === "Scalar",
      `Expected indexer.value.kind to be "Scalar", got "${customArray?.indexer?.value?.kind}"`
    );
    expect(customArray.indexer?.value.name).toBe("string");

    /* model ArrayOfArrays is CustomArray[]; */
    const arrayOfArrays = models.get("ArrayOfArrays");
    expect(arrayOfArrays?.indexer).toBeDefined();
    expect(arrayOfArrays?.indexer?.key.name).toBe("integer");
    expect(arrayOfArrays?.indexer?.value).toBe(customArray);
  });

  describe("handles enums", () => {
    it("string enums", async () => {
      const serviceNamespace = await tspForOpenAPI3({
        schemas: {
          SimpleEnum: {
            type: "string",
            enum: ["foo", "bar"],
          },
        },
      });

      expect(serviceNamespace.enums.size).toBe(1);

      /* enum SimpleEnum { "foo", "bar", } */
      const simpleEnum = serviceNamespace.enums.get("SimpleEnum");
      expect(simpleEnum?.decorators.length).toBe(0);
      const simpleEnumMembers = [...(simpleEnum?.members.values() ?? [])];
      expect(simpleEnumMembers.length).toBe(2);
      expect(simpleEnumMembers[0]).toMatchObject({ kind: "EnumMember", name: "foo" });
      expect(simpleEnumMembers[1]).toMatchObject({ kind: "EnumMember", name: "bar" });
    });
  });

  describe("handles unions", () => {
    it("nullable enums", async () => {
      const serviceNamespace = await tspForOpenAPI3({
        schemas: {
          EnumUnion: {
            type: "string",
            enum: ["foo", "bar"],
            nullable: true,
          },
        },
      });

      expect(serviceNamespace.unions.size).toBe(1);

      /* union EnumUnion { "foo", "bar", null, } */
      const enumUnion = serviceNamespace.unions.get("EnumUnion");
      expect(enumUnion?.decorators.length).toBe(0);
      const enumUnionVariants = [...(enumUnion?.variants.values() ?? [])];
      expect(enumUnionVariants.length).toBe(3);
      expect(enumUnionVariants[0].type).toMatchObject({ kind: "String", value: "foo" });
      expect(enumUnionVariants[1].type).toMatchObject({ kind: "String", value: "bar" });
      expect(enumUnionVariants[2].type).toMatchObject({ kind: "Intrinsic", name: "null" });
    });

    it("non-string enums", async () => {
      const serviceNamespace = await tspForOpenAPI3({
        schemas: {
          EnumUnion: {
            type: "integer",
            format: "int32",
            enum: [1, 2],
          },
        },
      });

      expect(serviceNamespace.unions.size).toBe(1);

      /* union EnumUnion { 1, 2, } */
      const enumUnion = serviceNamespace.unions.get("EnumUnion");
      expect(enumUnion?.decorators.length).toBe(0);
      const enumUnionVariants = [...(enumUnion?.variants.values() ?? [])];
      expect(enumUnionVariants.length).toBe(2);
      expect(enumUnionVariants[0].type).toMatchObject({ kind: "Number", value: 1 });
      expect(enumUnionVariants[1].type).toMatchObject({ kind: "Number", value: 2 });
    });

    it("anyOf", async () => {
      const serviceNamespace = await tspForOpenAPI3({
        schemas: {
          Foo: {
            type: "object",
            properties: {
              name: { type: "string" },
            },
          },
          AnyOfUnion: {
            anyOf: [{ type: "string" }, { type: "boolean" }, { $ref: "#/components/schemas/Foo" }],
          },
        },
      });

      const Foo = serviceNamespace.models.get("Foo");
      assert(Foo, "Foo model not found");

      expect(serviceNamespace.unions.size).toBe(1);

      /* union AnyOfUnion { string, boolean, Foo, } */
      const anyOfUnion = serviceNamespace.unions.get("AnyOfUnion");
      expect(anyOfUnion?.decorators.length).toBe(0);
      const anyOfUnionVariants = [...(anyOfUnion?.variants.values() ?? [])];
      expect(anyOfUnionVariants.length).toBe(3);
      expect(anyOfUnionVariants[0].type).toMatchObject({ kind: "Scalar", name: "string" });
      expect(anyOfUnionVariants[1].type).toMatchObject({ kind: "Scalar", name: "boolean" });
      expect(anyOfUnionVariants[2].type).toBe(Foo);
    });

    it("oneOf", async () => {
      const serviceNamespace = await tspForOpenAPI3({
        schemas: {
          OneOfUnion: {
            oneOf: [{ type: "string" }, { type: "boolean" }],
          },
        },
      });

      expect(serviceNamespace.unions.size).toBe(1);

      /* @oneOf union OneOfUnion { string, boolean, } */
      const oneOfUnion = serviceNamespace.unions.get("OneOfUnion");
      expect(oneOfUnion?.decorators.length).toBe(1);
      expect(oneOfUnion?.decorators[0].definition?.name).toBe("@oneOf");
      const oneOfUnionVariants = [...(oneOfUnion?.variants.values() ?? [])];
      expect(oneOfUnionVariants.length).toBe(2);
      expect(oneOfUnionVariants[0].type).toMatchObject({ kind: "Scalar", name: "string" });
      expect(oneOfUnionVariants[1].type).toMatchObject({ kind: "Scalar", name: "boolean" });
    });

    it("discriminator", async () => {
      const serviceNamespace = await tspForOpenAPI3({
        schemas: {
          DiscriminatedUnion: {
            anyOf: [
              {
                type: "object",
                required: ["kind"],
                properties: { kind: { type: "string", enum: ["foo"] } },
              },
              {
                type: "object",
                required: ["kind"],
                properties: { kind: { type: "string", enum: ["bar"] } },
              },
            ],
            discriminator: { propertyName: "kind" },
          },
        },
      });

      expect(serviceNamespace.unions.size).toBe(1);

      /* @discriminator("kind") union DiscriminatedUnion { { kind: "foo" }, { kind: "bar" }, } */
      const discriminatedUnion = serviceNamespace.unions.get("DiscriminatedUnion");
      expect(discriminatedUnion?.decorators.length).toBe(1);
      expect(discriminatedUnion?.decorators[0].definition?.name).toBe("@discriminator");
      expect(discriminatedUnion?.decorators[0].args[0]).toMatchObject({ jsValue: "kind" });
      const discriminatedUnionVariants = [...(discriminatedUnion?.variants.values() ?? [])];
      expect(discriminatedUnionVariants.length).toBe(2);
      expect(
        (discriminatedUnionVariants[0].type as Model).properties.get("kind")?.type
      ).toMatchObject({
        kind: "String",
        value: "foo",
      });
      expect(
        (discriminatedUnionVariants[1].type as Model).properties.get("kind")?.type
      ).toMatchObject({
        kind: "String",
        value: "bar",
      });
    });

    it("nullable", async () => {
      const serviceNamespace = await tspForOpenAPI3({
        schemas: {
          NullableUnion: {
            type: "string",
            nullable: true,
          },
        },
      });

      expect(serviceNamespace.unions.size).toBe(1);

      /* union NullableUnion { string, null, } */
      const nullableUnion = serviceNamespace.unions.get("NullableUnion");
      expect(nullableUnion?.decorators.length).toBe(0);
      const nullableUnionVariants = [...(nullableUnion?.variants.values() ?? [])];
      expect(nullableUnionVariants.length).toBe(2);
      expect(nullableUnionVariants[0].type).toMatchObject({ kind: "Scalar", name: "string" });
      expect(nullableUnionVariants[1].type).toMatchObject({ kind: "Intrinsic", name: "null" });
    });
  });

  describe("handles models", () => {
    it("simple schemas", async () => {
      const serviceNamespace = await tspForOpenAPI3({
        schemas: {
          Foo: {
            type: "object",
            required: ["id"],
            properties: {
              name: { type: "string" },
              id: { type: "integer", format: "int32" },
            },
          },
        },
      });

      /* model Foo { name?: string, id: int32, } */
      const Foo = serviceNamespace.models.get("Foo");
      assert(Foo, "Foo model not found");
      expect(Foo.properties.size).toBe(2);
      expect(Foo.properties.get("name")).toMatchObject({
        optional: true,
        type: { kind: "Scalar", name: "string" },
      });
      expect(Foo.properties.get("id")).toMatchObject({
        optional: false,
        type: { kind: "Scalar", name: "int32" },
      });
    });

    it("with additionalProps", async () => {
      const serviceNamespace = await tspForOpenAPI3({
        schemas: {
          Foo: {
            type: "object",
            required: ["id"],
            properties: {
              name: { type: "string" },
              id: { type: "integer", format: "int32" },
            },
            additionalProperties: {
              type: "string",
            },
          },
        },
      });

      /* model Foo { name?: string, id: int32, ...Record<string> } */
      const Foo = serviceNamespace.models.get("Foo");
      assert(Foo, "Foo model not found");
      expect(Foo.properties.size).toBe(2);
      expect(Foo.properties.get("name")).toMatchObject({
        optional: true,
        type: { kind: "Scalar", name: "string" },
      });
      expect(Foo.properties.get("id")).toMatchObject({
        optional: false,
        type: { kind: "Scalar", name: "int32" },
      });
      assert(
        Foo.indexer?.value.kind === "Scalar",
        `Expected indexer.value.kind to be 'Scalar', got ${Foo.indexer?.value.kind}`
      );
      expect(Foo.indexer?.value.name).toBe("string");
    });

    it("aliases references", async () => {
      const serviceNamespace = await tspForOpenAPI3({
        schemas: {
          Foo: {
            type: "object",
            properties: {
              name: { type: "string" },
            },
          },
          FooAlias: { $ref: "#/components/schemas/Foo" },
        },
      });

      /* model FooAlias is Foo; */
      const Foo = serviceNamespace.models.get("Foo");
      assert(Foo, "Foo model not found");

      const FooAlias = serviceNamespace.models.get("FooAlias");
      expect(FooAlias?.sourceModels.length).toBe(1);
      expect(FooAlias?.sourceModels[0].usage).toBe("is");
      expect(FooAlias?.sourceModels[0].model).toBe(Foo);
    });
  });
});
