import { strictEqual } from "assert";
import { describe, expect, expectTypeOf, it } from "vitest";
import { resolvePath } from "../../src/core/path-utils.js";
import {
  EmitContext,
  emitFile,
  Enum,
  getLocationContext,
  Model,
  navigateProgram,
  ObjectValue,
} from "../../src/index.js";
import { mockFile } from "../../src/testing/fs.js";
import { t } from "../../src/testing/marked-template.js";
import { resolveVirtualPath } from "../../src/testing/test-utils.js";
import { createTester } from "../../src/testing/tester.js";

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

  it("extract with fourslash syntax with t.code", async () => {
    const res = await Tester.compile(t.code`
      model /*ExtractedFoo*/Foo {}
    `);
    strictEqual(res.ExtractedFoo.entityKind, "Type");
    expect(res.ExtractedFoo.kind).toBe("Model");
  });

  it("extract with fourslash syntax without t.code", async () => {
    const res = await Tester.compile(`
      model /*ExtractedFoo*/Foo {}
    `);
    strictEqual(res.ExtractedFoo.entityKind, "Type");
    expect(res.ExtractedFoo.kind).toBe("Model");
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

  it("model property in operation", async () => {
    const res = await Tester.compile(t.code`
      op test(
        ${t.modelProperty("prop")}: string;
      ): void;
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
    ).rejects.toThrowError("Expected Foo to be of kind Model but got (Enum) Foo at 21");
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
    expectTypeOf(res.foo).toExtend<ObjectValue>();
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
      "Expected foo to be of value kind ObjectValue but got (NumericValue) 123 at 22",
    );
  });
});

it("still extract with additional using", async () => {
  const res = await Tester.using("TypeSpec").compile(t.code`
    model ${t.model("Foo")} {}
  `);
  expect(res.Foo.kind).toBe("Model");
});

it("still extract with wrappers", async () => {
  const res = await Tester.wrap((x) => `model Test {}\n${x}\nmodel Test2 {}`).compile(t.code`
    model ${t.model("Foo")} {}
  `);
  expect(res.Foo.kind).toBe("Model");
});

it("still extract with multiple files", async () => {
  const res = await Tester.compile({
    "main.tsp": t.code`
      import "./b.tsp";
      model ${t.model("A")} {}
    `,
    "b.tsp": t.code`
      enum ${t.enum("B")} {}
    `,
  });

  expectTypeOf(res.A).toExtend<Model>();
  expectTypeOf(res.B).toExtend<Enum>();
  expect(res.A.kind).toBe("Model");
  expect(res.B.kind).toBe("Enum");
});

it("add extra files via fs api", async () => {
  const tester = await Tester.createInstance();
  tester.fs.add("foo.tsp", "model Foo {}");
  await tester.compile(
    `
      import "./foo.tsp";
      model Bar {}
    `,
  );
});

describe("marker position", () => {
  function indexOfMarker(code: string, marker: `/*${string}*/`) {
    return code.indexOf(marker) + marker.length;
  }
  it("collect position from simple code", async () => {
    const tester = await Tester.createInstance();
    const code = `
      model /*A*/Foo {}
      enum /*B*/Bar {}
    `;
    const res = await tester.compile(code);
    expect(res.pos.A.pos).toEqual(indexOfMarker(code, "/*A*/"));
    expect(res.pos.B.pos).toEqual(indexOfMarker(code, "/*B*/"));
  });

  it("collect position with wrap, imports", async () => {
    const tester = await Tester.import("./other.tsp")
      .files({
        "other.tsp": `model Other {}`,
      })
      .wrap((x) => `model Added {};\n${x}`)
      .createInstance();
    const code = `
      model /*A*/Foo {}
    `;
    const renderedCode = `import "./other.tsp";\nmodel Added {};\n${code}`;
    const res = await tester.compile(code);
    expect(res.fs.fs.get(resolveVirtualPath("main.tsp"))).toEqual(renderedCode); // ensure our code is what we expect
    expect(res.pos.A.pos).toEqual(indexOfMarker(renderedCode, "/*A*/"));
  });

  it("collect position from typed markers", async () => {
    const tester = await Tester.createInstance();
    const res = await tester.compile(t.code`
      model ${t.model("Foo")} {}
      enum ${t.enum("Bar")} {}
    `);
    expect(res.pos.Foo.pos).toEqual(20);
    expect(res.pos.Bar.pos).toEqual(45);
  });
});

describe("emitter", () => {
  const EmitterTester = Tester.files({
    "node_modules/dummy-emitter/package.json": JSON.stringify({
      name: "dummy-emitter",
      version: "1.0.0",
      exports: { ".": "./index.js" },
    }),
    "node_modules/dummy-emitter/index.js": mockFile.js({
      $onEmit: (context: EmitContext) => {
        navigateProgram(context.program, {
          model: (model) => {
            if (getLocationContext(context.program, model).type !== "project") return;
            emitFile(context.program, {
              path: resolvePath(context.emitterOutputDir, `${model.name}.model`),
              content: model.name,
            });
          },
        });
      },
    }),
  }).emit("dummy-emitter");

  it("return output", async () => {
    const res = await EmitterTester.compile(
      `
      model Foo {}
      model Bar {}
    `,
    );
    expect(res.outputs).toEqual({
      "Foo.model": "Foo",
      "Bar.model": "Bar",
    });
  });

  it("can use same chai methods", async () => {
    const res = await await EmitterTester.wrap(
      (x) => `model Test {}\n${x}\nmodel Test2 {}`,
    ).compile(`model Foo {}`);
    expect(res.outputs).toEqual({
      "Foo.model": "Foo",
      "Test.model": "Test",
      "Test2.model": "Test2",
    });
  });

  it("pipe outputs", async () => {
    const res = await await EmitterTester.pipe((x) => x.outputs["Foo.model"]).compile(
      `model Foo {}`,
    );
    expect(res).toEqual("Foo");
  });

  it("add extra files via fs api", async () => {
    const tester = await EmitterTester.createInstance();
    tester.fs.add("foo.tsp", "model Foo {}");
    const res = await tester.compile(
      `
      import "./foo.tsp";
      model Bar {}
    `,
    );
    expect(res.outputs).toEqual({
      "Foo.model": "Foo",
      "Bar.model": "Bar",
    });
  });
});
