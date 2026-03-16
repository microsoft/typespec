import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { filterModelProperties, getEffectiveModelType } from "../../src/core/checker.js";
import { DecoratorContext, Model, ModelProperty, Type } from "../../src/core/types.js";
import { expectTypeEquals, mockFile, t } from "../../src/testing/index.js";
import { Tester } from "../tester.js";

const removeSymbol = Symbol("remove");

const RemoveTester = Tester.files({
  "remove.js": mockFile.js({
    $remove: ({ program }: DecoratorContext, entity: Type) => {
      program.stateSet(removeSymbol).add(entity);
    },
  }),
});

describe("compiler: effective type", () => {
  it("spread", async () => {
    const { Source, Test, program } = await Tester.compile(t.code`
      model ${t.model("Source")} {
        prop: string;
      }
      
      model ${t.model("Test")} {
        prop: { ...Source };
      }
    `);
    strictEqual(Source.kind, "Model" as const);
    strictEqual(Test.kind, "Model" as const);

    const propType = Test.properties.get("prop")?.type as Model;
    const effective = getEffectiveModelType(program, propType);
    expectTypeEquals(effective, Source);
  });

  it("indirect spread", async () => {
    const { Source, Test, program } = await Tester.compile(t.code`
      model ${t.model("Source")} {
        prop: string;
      }

      // Alias here as a named model is its own effective type.
      alias Spread = { 
        ...Source
      };

      model ${t.model("Test")} {
        test: {...Spread };
      }
    `);
    strictEqual(Source.kind, "Model" as const);
    strictEqual(Test.kind, "Model" as const);

    const propType = Test.properties.get("test")?.type;
    strictEqual(propType?.kind, "Model" as const);

    const effective = getEffectiveModelType(program, propType);
    expectTypeEquals(effective, Source);
  });

  it("indirect spread, intersect, and filter", async () => {
    const { Source, Test, program } = await RemoveTester.compile(t.code`
      import "./remove.js";

      model IndirectSource {
        prop1: string;
      }

      model ${t.model("Source")} {
        prop2: string;
        ...IndirectSource;
      }
  
      model ${t.model("Test")} {
        test: { @remove prop3: string; } & Source;
      }
    `);
    strictEqual(Source.kind, "Model" as const);
    strictEqual(Test.kind, "Model" as const);

    const propType = Test.properties.get("test")?.type;
    strictEqual(propType?.kind, "Model" as const);

    const removeFilter = (property: ModelProperty) => !program.stateSet(removeSymbol).has(property);
    const effective = getEffectiveModelType(program, propType, removeFilter);
    expectTypeEquals(effective, Source);
  });

  it("intersect", async () => {
    const { Source, Test, program } = await Tester.compile(t.code`
      model ${t.model("Source")} {
        prop: string;
      }

      model ${t.model("Test")} {
        test: Source & {}
      }
    `);
    strictEqual(Source.kind, "Model" as const);
    strictEqual(Test.kind, "Model" as const);

    const propType = Test.properties.get("test")?.type;
    strictEqual(propType?.kind, "Model" as const);

    const effective = getEffectiveModelType(program, propType);
    expectTypeEquals(effective, Source);
  });

  it("extends", async () => {
    const { Test, Derived, program } = await Tester.compile(t.code`
      model Base {
        propBase: string;
      }

      model ${t.model("Derived")} extends Base {
        propDerived: string;
      }

      model ${t.model("Test")} {
        test: { ...Derived };
      }
    `);
    strictEqual(Test.kind, "Model" as const);
    strictEqual(Derived.kind, "Model" as const);

    const propType = Test.properties.get("test")?.type;
    strictEqual(propType?.kind, "Model" as const);
    const effective = getEffectiveModelType(program, propType);
    expectTypeEquals(effective, Derived);
  });

  it("intersect and filter", async () => {
    const { Source, Test, program } = await RemoveTester.compile(t.code`
      import "./remove.js";

      model ${t.model("Source")} {
        prop: string;
      }

      model ${t.model("Test")} {
        test: Source & { @remove something: string; };
      }
    `);
    strictEqual(Source.kind, "Model" as const);
    strictEqual(Test.kind, "Model" as const);

    const propType = Test.properties.get("test")?.type;
    strictEqual(propType?.kind, "Model" as const);
    const removeFilter = (property: ModelProperty) => !program.stateSet(removeSymbol).has(property);
    const effective = getEffectiveModelType(program, propType, removeFilter);
    expectTypeEquals(effective, Source);
  });

  it("extend and filter", async () => {
    const { Base, Derived, program } = await RemoveTester.compile(t.code`
      import "./remove.js";

      model ${t.model("Base")} {
        prop: string;
      }

      model ${t.model("Derived")} extends Base {
        @remove test: string;
      }
    `);
    strictEqual(Base.kind, "Model" as const);
    strictEqual(Derived.kind, "Model" as const);

    const propType = Derived.properties.get("test")?.type;
    strictEqual(propType?.kind, "Scalar" as const);

    const removeFilter = (property: ModelProperty) => !program.stateSet(removeSymbol).has(property);
    const effective = getEffectiveModelType(program, Derived, removeFilter);
    expectTypeEquals(effective, Base);
  });

  it("extend and filter two levels", async () => {
    const { Base, Derived, program } = await RemoveTester.compile(t.code`
      import "./remove.js";

      model ${t.model("Base")} {
        prop: string;
      }

      model Middle extends Base {
        @remove prop2: string;
      }

      model ${t.model("Derived")} extends Middle {
        @remove test: string;
      }
    `);
    strictEqual(Base.kind, "Model" as const);
    strictEqual(Derived.kind, "Model" as const);

    const propType = Derived.properties.get("test")?.type;
    strictEqual(propType?.kind, "Scalar" as const);

    const removeFilter = (property: ModelProperty) => !program.stateSet(removeSymbol).has(property);
    const effective = getEffectiveModelType(program, Derived, removeFilter);
    expectTypeEquals(effective, Base);
  });

  it("extend and filter two levels with override", async () => {
    const { Middle, Derived, program } = await RemoveTester.compile(t.code`
      import "./remove.js";

      model Base {
        prop: string;
        prop2: string;
      }

      model ${t.model("Middle")} extends Base {
        @remove prop3: string;
        @remove prop4: string;
        prop2: "hello";
      }

      model ${t.model("Derived")} extends Middle {
        @remove test: string;
      }
    `);
    strictEqual(Middle.kind, "Model" as const);
    strictEqual(Derived.kind, "Model" as const);

    const propType = Derived.properties.get("test")?.type;
    strictEqual(propType?.kind, "Scalar" as const);

    const removeFilter = (property: ModelProperty) => !program.stateSet(removeSymbol).has(property);
    const effective = getEffectiveModelType(program, Derived, removeFilter);
    expectTypeEquals(effective, Middle);
  });

  it("extend, intersect, and filter", async () => {
    const { Derived, Test, program } = await RemoveTester.compile(t.code`
      import "./remove.js";

      model Base {
        prop: string;
      }

      model ${t.model("Derived")} extends Base {
        propDerived: string;
      }

      model ${t.model("Test")} {
        test: Derived & { @remove something: string; };
      }
    `);
    strictEqual(Derived.kind, "Model" as const);
    strictEqual(Test.kind, "Model" as const);

    const propType = Test.properties.get("test")?.type;
    strictEqual(propType?.kind, "Model" as const);

    const removeFilter = (property: ModelProperty) => !program.stateSet(removeSymbol).has(property);
    const effective = getEffectiveModelType(program, propType, removeFilter);
    expectTypeEquals(effective, Derived);
  });

  it("extend templated base with spread and filter", async () => {
    const { Thing, Test, program } = await RemoveTester.compile(t.code`
      import "./remove.js";

      model Base<T> {
        @remove prop: string;
        ...T;
      }

      model ${t.model("Thing")} {
        name: string;
      }

      model ${t.model("Test")} {
        test: Base<Thing>;
      }
    `);
    strictEqual(Thing.kind, "Model" as const);
    strictEqual(Test.kind, "Model" as const);

    const propType = Test.properties.get("test")?.type;
    strictEqual(propType?.kind, "Model" as const);

    const removeFilter = (property: ModelProperty) => !program.stateSet(removeSymbol).has(property);
    const effective = getEffectiveModelType(program, propType, removeFilter);
    expectTypeEquals(effective, Thing);
  });

  it("empty model", async () => {
    const { Test, program } = await Tester.compile(t.code`
      model ${t.model("Test")} {
        test: {};
      }
    `);
    strictEqual(Test.kind, "Model" as const);

    const propType = Test.properties.get("test")?.type;
    strictEqual(propType?.kind, "Model" as const);

    const effective = getEffectiveModelType(program, propType);
    expectTypeEquals(effective, propType);
  });

  it("unsourced property", async () => {
    const { Test, program } = await Tester.compile(t.code`
      model Source {
        prop: string;
      }

      model ${t.model("Test")} {
        test: { notRemoved: string, ...Source };
      }
    `);
    strictEqual(Test.kind, "Model" as const);

    const propType = Test.properties.get("test")?.type;
    strictEqual(propType?.kind, "Model" as const);

    const effective = getEffectiveModelType(program, propType);
    expectTypeEquals(effective, propType);
  });

  it("different sources", async () => {
    const { Test, program } = await Tester.compile(t.code`
      model SourceOne {
        one: string;
      }

      model SourceTwo {
        two: string

      }

      model ${t.model("Test")} {
        test: SourceOne & SourceTwo;
      }
    `);
    strictEqual(Test.kind, "Model" as const);

    const SourceOneAndSourceTwo = Test.properties.get("test")?.type;
    strictEqual(SourceOneAndSourceTwo?.kind, "Model" as const);

    const effective = getEffectiveModelType(program, SourceOneAndSourceTwo);
    expectTypeEquals(effective, SourceOneAndSourceTwo);
  });

  it("only part of source with separate filter", async () => {
    const { Test, program } = await RemoveTester.compile(t.code`
      import "./remove.js";

      model Source {
        propA: string;
        @remove
        propB: string;
      }

      model ${t.model("Test")} {
        test: Source;
      }
    `);
    strictEqual(Test.kind, "Model" as const);

    const Source = Test.properties.get("test")?.type;
    strictEqual(Source?.kind, "Model" as const);

    const removeFilter = (property: ModelProperty) => !program.stateSet(removeSymbol).has(property);
    const filtered = filterModelProperties(program, Source, removeFilter);
    const effective = getEffectiveModelType(program, filtered);
    strictEqual(effective.name, "", "Result should be anonymous");
    expectTypeEquals(effective, filtered);
  });

  it("only parts of base and spread sources with separate filter", async () => {
    const { Derived, program } = await RemoveTester.compile(t.code`
      import "./remove.js";

      // NOTE: Base and Source should have the same number of properties so that we
      // don't let a bug case escape this test by luck via the property count check.
      model Base {
        @remove propA: string;
        propB: string;
      }

      model Source {
        @remove propC: string;
        propD: string;
      }

      model ${t.model("Derived")} extends Base {
        ...Source;
      }
    `);
    strictEqual(Derived.kind, "Model" as const);

    const removeFilter = (property: ModelProperty) => !program.stateSet(removeSymbol).has(property);
    const filtered = filterModelProperties(program, Derived, removeFilter);
    const effective = getEffectiveModelType(program, filtered);
    strictEqual(effective.name, "", "result should be anonymous");
    expectTypeEquals(filtered, effective);
  });

  it("only part of source with filter", async () => {
    const { Test, program } = await RemoveTester.compile(t.code`
      import "./remove.js";

      model Source {
        propA: string;
        @remove
        propB: string;
      }

      model ${t.model("Test")} {
        test: Source;
      }
    `);
    strictEqual(Test.kind, "Model" as const);

    const Source = Test.properties.get("test")?.type;
    strictEqual(Source?.kind, "Model" as const);

    const removeFilter = (property: ModelProperty) => !program.stateSet(removeSymbol).has(property);
    const effective = getEffectiveModelType(program, Source, removeFilter);
    expectTypeEquals(effective, Source);
  });
});
