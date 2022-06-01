import { ok, strictEqual } from "assert";
import { DecoratorContext, ModelType, ModelTypeProperty, Type } from "../../core/types.js";
import { createTestHost, TestHost } from "../../testing/index.js";

describe("compiler: effective type", () => {
  let testHost: TestHost;
  let removeFilter: (model: ModelTypeProperty) => boolean;

  beforeEach(async () => {
    const removeSymbol = Symbol("remove");
    testHost = await createTestHost();
    testHost.addJsFile("remove.js", {
      $remove: function ({ program }: DecoratorContext, entity: Type) {
        program.stateSet(removeSymbol).add(entity);
      },
    });
    removeFilter = function (property: ModelTypeProperty) {
      return !testHost.program.stateSet(removeSymbol).has(property);
    };
  });

  it("spread", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      @test model Source {
        prop: string;
      }
      
      @test model Test {
        prop: { ...Source };
      }
      `
    );
    const { Source, Test } = await testHost.compile("./");
    ok(Source.kind === "Model" && Test.kind === "Model", "expected models");

    const propType = Test.properties.get("prop")?.type as ModelType;
    const effective = testHost.program.checker.getEffectiveModelType(propType);
    strictEqual(effective, Source);
  });

  it("indirect spread", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      @test model Source {
        prop: string;
      }

      // Alias here as a named model is its own effective type.
      alias Spread = { 
        ...Source
      };

      @test model Test {
        test: {...Source}
      }
      `
    );
    const { Source, Test } = await testHost.compile("./");
    ok(Source.kind === "Model" && Test.kind === "Model", "expected models");

    const propType = Test.properties.get("test")?.type;
    ok(propType?.kind === "Model", "expected model");

    const effective = testHost.program.checker.getEffectiveModelType(propType);
    strictEqual(effective, Source);
  });

  it("intersect", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      @test model Source {
        prop: string;
      }

      @test model Test {
        test: Source & {}
      }
      `
    );
    const { Source, Test } = await testHost.compile("./");
    ok(Source.kind === "Model" && Test.kind === "Model", "expected models");

    const propType = Test.properties.get("test")?.type;
    ok(propType?.kind === "Model", "expected model");

    const effective = testHost.program.checker.getEffectiveModelType(propType);
    strictEqual(effective, Source);
  });

  it("extends", async () => {
    testHost.addCadlFile(
      "main.cadl",
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
      `
    );
    const { Test, Derived } = await testHost.compile("./");
    ok(Test.kind === "Model" && Derived.kind === "Model", "expected models");

    const propType = Test.properties.get("test")?.type;
    ok(propType?.kind === "Model", "expected model");
    const effective = testHost.program.checker.getEffectiveModelType(propType);
    strictEqual(effective, Derived);
  });

  it("intersect and filter", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      import "./remove.js";

      @test model Source {
        prop: string;
      }

      @test model Test {
        test: Source & { @remove something: string; };
      }
      `
    );
    const { Source, Test } = await testHost.compile("./");
    ok(Source.kind === "Model" && Test.kind === "Model", "expected models");

    const propType = Test.properties.get("test")?.type;
    ok(propType?.kind === "Model", "expected model");
    const effective = testHost.program.checker.getEffectiveModelType(propType, removeFilter);
    strictEqual(effective, Source);
  });

  it("extend and filter", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      import "./remove.js";

      @test model Base {
        prop: string;
      }

      @test model Derived extends Base {
        @remove test: string;
      }
      `
    );
    const { Base, Derived } = await testHost.compile("./");
    ok(Base.kind === "Model" && Derived.kind === "Model", "expected models");

    const propType = Derived.properties.get("test")?.type;
    ok(propType?.kind === "Model", "expected model");

    const effective = testHost.program.checker.getEffectiveModelType(Derived, removeFilter);
    strictEqual(effective, Base);
  });

  it("extend, intersect, and filter", async () => {
    testHost.addCadlFile(
      "main.cadl",
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
      `
    );
    const { Derived, Test } = await testHost.compile("./");
    ok(Derived.kind === "Model" && Test.kind === "Model", "expected models");

    const propType = Test.properties.get("test")?.type;
    ok(propType?.kind === "Model", "expected model");

    const effective = testHost.program.checker.getEffectiveModelType(propType, removeFilter);
    strictEqual(effective, Derived);
  });

  it("does not depend on property order", async () => {
    testHost.addCadlFile(
      "main.cadl",
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
      `
    );
    const { Derived, Test } = await testHost.compile("./");
    ok(Derived.kind === "Model" && Test.kind === "Model", "expected models");

    const propType = Test.properties.get("test")?.type;
    ok(propType?.kind === "Model", "expected model");

    // There's a code path that's hard to hit with the way properties are
    // ordered between base and derived, reverse it to make sure we don't
    // depend on this order.
    propType.properties = new Map(Array.from(propType.properties).reverse());

    const effective = testHost.program.checker.getEffectiveModelType(propType, removeFilter);
    strictEqual(effective, Derived);
  });

  it("extend templated base with spread and filter", async () => {
    testHost.addCadlFile(
      "main.cadl",
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
      `
    );
    const { Thing, Test } = await testHost.compile("./");
    ok(Thing.kind === "Model" && Test.kind === "Model", "expected models");

    const propType = Test.properties.get("test")?.type;
    ok(propType?.kind === "Model", "expected model");

    const effective = testHost.program.checker.getEffectiveModelType(propType, removeFilter);
    strictEqual(effective, Thing);
  });

  it("empty model", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      @test model Test {
        test: {};
      }
      `
    );
    const { Test } = await testHost.compile("./");
    ok(Test.kind === "Model", "expected model");

    const propType = Test.properties.get("test")?.type;
    ok(propType?.kind === "Model", "expected model");

    const effective = testHost.program.checker.getEffectiveModelType(propType);
    strictEqual(effective, propType);
  });

  it("unsourced property", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      model Source {
        prop: string;
      }

      @test model Test {
        test: { notRemoved: string, ...Source };
      }
      `
    );
    const { Test } = await testHost.compile("./");
    ok(Test.kind === "Model", "expected model");

    const propType = Test.properties.get("test")?.type;
    ok(propType?.kind === "Model", "expected model");

    const effective = testHost.program.checker.getEffectiveModelType(propType);
    strictEqual(effective, propType);
  });

  it("different sources", async () => {
    testHost.addCadlFile(
      "main.cadl",
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
      `
    );

    const { Test } = await testHost.compile("./");
    ok(Test.kind === "Model", "expected model");

    const SourceOneAndSourceTwo = Test.properties.get("test")?.type;
    ok(SourceOneAndSourceTwo?.kind === "Model", "expected model");

    const effective = testHost.program.checker.getEffectiveModelType(SourceOneAndSourceTwo);
    strictEqual(effective, SourceOneAndSourceTwo);
  });

  it("only part of source with separate filter", async () => {
    testHost.addCadlFile(
      "main.cadl",
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
      `
    );

    const { Test } = await testHost.compile("./");
    ok(Test.kind === "Model", "expected model");

    const Source = Test.properties.get("test")?.type;
    ok(Source?.kind === "Model", "expected model");

    const filtered = testHost.program.checker.filterModelProperties(Source, removeFilter);
    const effective = testHost.program.checker.getEffectiveModelType(filtered);
    strictEqual(effective, filtered);
  });

  it("only part of source with filter", async () => {
    testHost.addCadlFile(
      "main.cadl",
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
      `
    );

    const { Test } = await testHost.compile("./");
    ok(Test.kind === "Model", "expected model");

    const Source = Test.properties.get("test")?.type;
    ok(Source?.kind === "Model", "expected model");

    const effective = testHost.program.checker.getEffectiveModelType(Source, removeFilter);
    strictEqual(effective, Source);
  });
});
