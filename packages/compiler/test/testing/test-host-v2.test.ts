// TODO: rename?

import { describe, expect, expectTypeOf, it } from "vitest";
import { resolvePath } from "../../src/core/path-utils.js";
import { Model } from "../../src/index.js";
import { t } from "../../src/testing/marked-template.js";
import { createTester } from "../../src/testing/test-host-v2.js";

const Tester = createTester(resolvePath(import.meta.dirname, "../.."), { libraries: [] });

describe("extract types", () => {
  it("generic type", async () => {
    const res = await Tester.compile(t.code`
      model ${t.type("Foo")} {} 
      enum ${t.type("Bar")} {} 
    `);
    expect(res.Foo.kind).toBe("Model");
    expect(res.Bar.kind).toBe("Enum");
  });

  it("model", async () => {
    const res = await Tester.compile(t.code`
      model ${t.model("Foo")} {} 
    `);
    expectTypeOf(res.Foo).toExtend<Model>();
    expect(res.Foo.kind).toBe("Model");
  });

  it("alias", async () => {
    const res = await Tester.compile(t.code`
      model Foo {}
      alias ${t.model("Bar")} = Foo; 
    `);
    expect(res.Bar.kind).toBe("Model");
  });

  it("enum", async () => {
    const res = await Tester.compile(t.code`
      enum ${t.enum("Foo")} {} 
    `);
    expect(res.Foo.kind).toBe("Enum");
  });

  it("union", async () => {
    const res = await Tester.compile(t.code`
      union ${t.union("Foo")} {} 
    `);
    expect(res.Foo.kind).toBe("Union");
  });

  it("interface", async () => {
    const res = await Tester.compile(t.code`
      interface ${t.interface("Foo")} {}
    `);
    expect(res.Foo.kind).toBe("Interface");
  });

  it("operation", async () => {
    const res = await Tester.compile(t.code`
      op ${t.op("Foo")}(): void;
    `);
    expect(res.Foo.kind).toBe("Operation");
  });

  it("namespace", async () => {
    const res = await Tester.compile(t.code`
      namespace ${t.namespace("Foo")} {}
    `);
    expect(res.Foo.kind).toBe("Namespace");
  });

  it("scalar", async () => {
    const res = await Tester.compile(t.code`
      scalar ${t.scalar("Foo")};
    `);
    expect(res.Foo.kind).toBe("Scalar");
  });

  it("model property", async () => {
    const res = await Tester.compile(t.code`
      model Bar {
        ${t.modelProperty("prop")}: string;
      }
    `);
    expect(res.prop.kind).toBe("ModelProperty");
  });

  it("union variant", async () => {
    const res = await Tester.compile(t.code`
      union Bar {
        ${t.unionVariant("A")}: string;
      }
    `);
    expect(res.A.kind).toBe("UnionVariant");
  });

  it("enum member", async () => {
    const res = await Tester.compile(t.code`
      enum Bar {
        ${t.enumMember("A")}
      }
    `);
    expect(res.A.kind).toBe("EnumMember");
  });

  it("validate type match", async () => {
    await expect(() =>
      Tester.compile(t.code`
        enum ${t.model("Foo")} {} 
      `),
    ).rejects.toThrowError("Expected Foo to be of kind Model but got (Enum) Foo at 21-24");
  });
});

describe("extract values", () => {
  it("generic value", async () => {
    const res = await Tester.compile(t.code`
      const ${t.value("a")} = "foo"; 
      const ${t.value("b")} = 123; 
    `);
    expect(res.a.valueKind).toBe("StringValue");
    expect(res.b.valueKind).toBe("NumericValue");
  });

  it("object", async () => {
    const res = await Tester.compile(t.code`
      const ${t.object("foo")} = #{};
    `);
    expect(res.foo.valueKind).toBe("ObjectValue");
  });

  it("array", async () => {
    const res = await Tester.compile(t.code`
      const ${t.array("foo")} = #[];
    `);
    expect(res.foo.valueKind).toBe("ArrayValue");
  });

  it("validate value match", async () => {
    await expect(() =>
      Tester.compile(t.code`
        const ${t.object("foo")} = 123; 
      `),
    ).rejects.toThrowError(
      "Expected foo to be of value kind ObjectValue but got (NumericValue) 123 at 22-25",
    );
  });
});
