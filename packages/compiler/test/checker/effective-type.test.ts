import { strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { filterModelProperties, getEffectiveModelType } from "../../src/core/checker.js";
import { DecoratorContext, Model, ModelProperty, Type } from "../../src/core/types.js";
import { TestHost, createTestHost, expectIdenticalTypes } from "../../src/testing/index.js";

describe("compiler: effective type", () => {
  let testHost: TestHost;
  let removeFilter: (model: ModelProperty) => boolean;

  beforeEach(async () => {
    const removeSymbol = Symbol("remove");
    testHost = await createTestHost();
    testHost.addJsFile("remove.js", {
      $remove: ({ program }: DecoratorContext, entity: Type) => {
        program.stateSet(removeSymbol).add(entity);
      },
    });
    removeFilter = (property: ModelProperty) =>
      !testHost.program.stateSet(removeSymbol).has(property);
  });

  it("spread", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      @test model Source {
        prop: string;
      }
      
      @test model Test {
        prop: { ...Source };
      }
      `,
    );
    const { Source, Test } = await testHost.compile("./");
    strictEqual(Source.kind, "Model" as const);
    strictEqual(Test.kind, "Model" as const);

    const propType = Test.properties.get("prop")?.type as Model;
    const effective = getEffectiveModelType(testHost.program, propType);
    expectIdenticalTypes(effective, Source);
  });

  it("indirect spread", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      @test model Source {
        prop: string;
      }

      // Alias here as a named model is its own effective type.
      alias Spread = { 
        ...Source
      };

      @test model Test {
        test: {...Spread };
      }
      `,
    );
    const { Source, Test } = await testHost.compile("./");
    strictEqual(Source.kind, "Model" as const);
    strictEqual(Test.kind, "Model" as const);

    const propType = Test.properties.get("test")?.type;
    strictEqual(propType?.kind, "Model" as const);

    const effective = getEffectiveModelType(testHost.program, propType);
    expectIdenticalTypes(effective, Source);
  });

  it("indirect spread, intersect, and filter", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./remove.js";

      model IndirectSource {
        prop1: string;
      }

      @test model Source {
        prop2: string;
        ...IndirectSource;
      }
  
      @test model Test {
        test: { @remove prop3: string; } & Source;
      }
      `,
    );
    const { Source, Test } = await testHost.compile("./");
    strictEqual(Source.kind, "Model" as const);
    strictEqual(Test.kind, "Model" as const);

    const propType = Test.properties.get("test")?.type;
    strictEqual(propType?.kind, "Model" as const);

    const effective = getEffectiveModelType(testHost.program, propType, removeFilter);
    expectIdenticalTypes(effective, Source);
  });

  it("intersect", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      @test model Source {
        prop: string;
      }

      @test model Test {
        test: Source & {}
      }
      `,
    );
    const { Source, Test } = await testHost.compile("./");
    strictEqual(Source.kind, "Model" as const);
    strictEqual(Test.kind, "Model" as const);

    const propType = Test.properties.get("test")?.type;
    strictEqual(propType?.kind, "Model" as const);

    const effective = getEffectiveModelType(testHost.program, propType);
    expectIdenticalTypes(effective, Source);
  });

  it("extends", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      model Base {
        propBase: string;
      }

      @test model Derived extends Base {
        propDerived: string;
      }

      @test model Test {
        test: { ...Derived };
      }
      `,
    );
    const { Test, Derived } = await testHost.compile("./");
    strictEqual(Test.kind, "Model" as const);
    strictEqual(Derived.kind, "Model" as const);

    const propType = Test.properties.get("test")?.type;
    strictEqual(propType?.kind, "Model" as const);
    const effective = getEffectiveModelType(testHost.program, propType);
    expectIdenticalTypes(effective, Derived);
  });

  it("intersect and filter", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./remove.js";

      @test model Source {
        prop: string;
      }

      @test model Test {
        test: Source & { @remove something: string; };
      }
      `,
    );
    const { Source, Test } = await testHost.compile("./");
    strictEqual(Source.kind, "Model" as const);
    strictEqual(Test.kind, "Model" as const);

    const propType = Test.properties.get("test")?.type;
    strictEqual(propType?.kind, "Model" as const);
    const effective = getEffectiveModelType(testHost.program, propType, removeFilter);
    expectIdenticalTypes(effective, Source);
  });

  it("extend and filter", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./remove.js";

      @test model Base {
        prop: string;
      }

      @test model Derived extends Base {
        @remove test: string;
      }
      `,
    );
    const { Base, Derived } = await testHost.compile("./");
    strictEqual(Base.kind, "Model" as const);
    strictEqual(Derived.kind, "Model" as const);

    const propType = Derived.properties.get("test")?.type;
    strictEqual(propType?.kind, "Scalar" as const);

    const effective = getEffectiveModelType(testHost.program, Derived, removeFilter);
    expectIdenticalTypes(effective, Base);
  });

  it("extend and filter two levels", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./remove.js";

      @test model Base {
        prop: string;
      }

      @test model Middle extends Base {
        @remove prop2: string;
      }

      @test model Derived extends Middle {
        @remove test: string;
      }
      `,
    );
    const { Base, Derived } = await testHost.compile("./");
    strictEqual(Base.kind, "Model" as const);
    strictEqual(Derived.kind, "Model" as const);

    const propType = Derived.properties.get("test")?.type;
    strictEqual(propType?.kind, "Scalar" as const);

    const effective = getEffectiveModelType(testHost.program, Derived, removeFilter);
    expectIdenticalTypes(effective, Base);
  });

  it("extend and filter two levels with override", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./remove.js";

      @test model Base {
        prop: string;
        prop2: string;
      }

      @test model Middle extends Base {
        @remove prop3: string;
        @remove prop4: string;
        prop2: "hello";
      }

      @test model Derived extends Middle {
        @remove test: string;
      }
      `,
    );
    const { Middle, Derived } = await testHost.compile("./");
    strictEqual(Middle.kind, "Model" as const);
    strictEqual(Derived.kind, "Model" as const);

    const propType = Derived.properties.get("test")?.type;
    strictEqual(propType?.kind, "Scalar" as const);

    const effective = getEffectiveModelType(testHost.program, Derived, removeFilter);
    expectIdenticalTypes(effective, Middle);
  });

  it("extend, intersect, and filter", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./remove.js";

      model Base {
        prop: string;
      }

      @test model Derived extends Base {
        propDerived: string;
      }

      @test model Test {
        test: Derived & { @remove something: string; };
      }
      `,
    );
    const { Derived, Test } = await testHost.compile("./");
    strictEqual(Derived.kind, "Model" as const);
    strictEqual(Test.kind, "Model" as const);

    const propType = Test.properties.get("test")?.type;
    strictEqual(propType?.kind, "Model" as const);

    const effective = getEffectiveModelType(testHost.program, propType, removeFilter);
    expectIdenticalTypes(effective, Derived);
  });

  it("extend templated base with spread and filter", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./remove.js";

      model Base<T> {
        @remove prop: string;
        ...T;
      }

      @test model Thing {
        name: string;
      }

      @test model Test {
        test: Base<Thing>;
      }
      `,
    );
    const { Thing, Test } = await testHost.compile("./");
    strictEqual(Thing.kind, "Model" as const);
    strictEqual(Test.kind, "Model" as const);

    const propType = Test.properties.get("test")?.type;
    strictEqual(propType?.kind, "Model" as const);

    const effective = getEffectiveModelType(testHost.program, propType, removeFilter);
    expectIdenticalTypes(effective, Thing);
  });

  it("empty model", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      @test model Test {
        test: {};
      }
      `,
    );
    const { Test } = await testHost.compile("./");
    strictEqual(Test.kind, "Model" as const);

    const propType = Test.properties.get("test")?.type;
    strictEqual(propType?.kind, "Model" as const);

    const effective = getEffectiveModelType(testHost.program, propType);
    expectIdenticalTypes(effective, propType);
  });

  it("unsourced property", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      model Source {
        prop: string;
      }

      @test model Test {
        test: { notRemoved: string, ...Source };
      }
      `,
    );
    const { Test } = await testHost.compile("./");
    strictEqual(Test.kind, "Model" as const);

    const propType = Test.properties.get("test")?.type;
    strictEqual(propType?.kind, "Model" as const);

    const effective = getEffectiveModelType(testHost.program, propType);
    expectIdenticalTypes(effective, propType);
  });

  it("different sources", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      model SourceOne {
        one: string;
      }

      model SourceTwo {
        two: string

      }

      @test model Test {
        test: SourceOne & SourceTwo;
      }
      `,
    );

    const { Test } = await testHost.compile("./");
    strictEqual(Test.kind, "Model" as const);

    const SourceOneAndSourceTwo = Test.properties.get("test")?.type;
    strictEqual(SourceOneAndSourceTwo?.kind, "Model" as const);

    const effective = getEffectiveModelType(testHost.program, SourceOneAndSourceTwo);
    expectIdenticalTypes(effective, SourceOneAndSourceTwo);
  });

  it("only part of source with separate filter", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./remove.js";

      model Source {
        propA: string;
        @remove
        propB: string;
      }

      @test model Test {
        test: Source;
      }
      `,
    );

    const { Test } = await testHost.compile("./");
    strictEqual(Test.kind, "Model" as const);

    const Source = Test.properties.get("test")?.type;
    strictEqual(Source?.kind, "Model" as const);

    const filtered = filterModelProperties(testHost.program, Source, removeFilter);
    const effective = getEffectiveModelType(testHost.program, filtered);
    strictEqual(effective.name, "", "Result should be anonymous");
    expectIdenticalTypes(effective, filtered);
  });

  it("only parts of base and spread sources with separate filter", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
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

      @test model Derived extends Base {
        ...Source;
      }
      `,
    );
    const { Derived } = await testHost.compile("./");
    strictEqual(Derived.kind, "Model" as const);

    const filtered = filterModelProperties(testHost.program, Derived, removeFilter);
    const effective = getEffectiveModelType(testHost.program, filtered);
    strictEqual(effective.name, "", "result should be anonymous");
    expectIdenticalTypes(filtered, effective);
  });

  it("only part of source with filter", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      import "./remove.js";

      model Source {
        propA: string;
        @remove
        propB: string;
      }

      @test model Test {
        test: Source;
      }
      `,
    );

    const { Test } = await testHost.compile("./");
    strictEqual(Test.kind, "Model" as const);

    const Source = Test.properties.get("test")?.type;
    strictEqual(Source?.kind, "Model" as const);

    const effective = getEffectiveModelType(testHost.program, Source, removeFilter);
    expectIdenticalTypes(effective, Source);
  });
});
