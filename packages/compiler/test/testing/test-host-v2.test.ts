// TODO: rename?

import { describe, expect, it } from "vitest";
import { resolvePath } from "../../src/core/path-utils.js";
import { extract, m } from "../../src/testing/marked-template.js";
import { createTester } from "../../src/testing/test-host-v2.js";

const Tester = createTester(resolvePath(import.meta.dirname, "../.."), { libraries: [] });

describe("extract types", () => {
  it("model", async () => {
    const foo = await Tester.compile(extract`
      model ${m.model("Foo")} {} 
    `);
    expect(foo.Foo.kind).toBe("Model");
  });

  it("alias", async () => {
    const foo = await Tester.compile(extract`
      model Foo {}
      alias ${m.model("Bar")} = Foo; 
    `);
    expect(foo.Bar.kind).toBe("Model");
  });

  it("enum", async () => {
    const foo = await Tester.compile(extract`
      enum ${m.enum("Foo")} {} 
    `);
    expect(foo.Foo.kind).toBe("Enum");
  });

  it("union", async () => {
    const foo = await Tester.compile(extract`
      union ${m.union("Foo")} {} 
    `);
    expect(foo.Foo.kind).toBe("Union");
  });

  it("interface", async () => {
    const foo = await Tester.compile(extract`
      interface ${m.interface("Foo")} {}
    `);
    expect(foo.Foo.kind).toBe("Interface");
  });

  it("operation", async () => {
    const foo = await Tester.compile(extract`
      op ${m.op("Foo")}(): void;
    `);
    expect(foo.Foo.kind).toBe("Operation");
  });

  it("namespace", async () => {
    const foo = await Tester.compile(extract`
      namespace ${m.namespace("Foo")} {}
    `);
    expect(foo.Foo.kind).toBe("Namespace");
  });

  it("scalar", async () => {
    const foo = await Tester.compile(extract`
      scalar ${m.scalar("Foo")};
    `);
    expect(foo.Foo.kind).toBe("Scalar");
  });

  it("model property", async () => {
    const foo = await Tester.compile(extract`
      model Bar {
        ${m.modelProperty("prop")}: string;
      }
    `);
    expect(foo.prop.kind).toBe("ModelProperty");
  });

  it("union variant", async () => {
    const foo = await Tester.compile(extract`
      union Bar {
        ${m.unionVariant("A")}: string;
      }
    `);
    expect(foo.A.kind).toBe("UnionVariant");
  });

  it("enum member", async () => {
    const foo = await Tester.compile(extract`
      enum Bar {
        ${m.enumMember("A")}
      }
    `);
    expect(foo.A.kind).toBe("EnumMember");
  });
});

describe("extract values", () => {
  it("object", async () => {
    const foo = await Tester.compile(extract`
      const ${m.object("foo")} = #{};
    `);
    expect(foo.foo.valueKind).toBe("ObjectValue");
  });

  it("array", async () => {
    const foo = await Tester.compile(extract`
      const ${m.array("foo")} = #[];
    `);
    expect(foo.foo.valueKind).toBe("ArrayValue");
  });
});

it("validate type match", async () => {
  await expect(() =>
    Tester.compile(extract`
    enum ${m.model("Foo")} {} 
  `),
  ).rejects.toThrowError("Expected Foo to be of kind Model but got (Enum) Foo at 10-13");
});
