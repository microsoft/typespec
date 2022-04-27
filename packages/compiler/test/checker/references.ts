import { strictEqual } from "assert";
import { EnumType, ModelType, OperationType, UnionTypeVariant } from "../../core/types.js";
import { createTestHost, TestHost } from "../../testing/index.js";

describe.only("cadl: references", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("can reference model properties", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      @test model Bar {
        x: string;
      }
      @test model Foo { y: Bar.x }
      `
    );

    const { Foo, Bar } = (await testHost.compile("./main.cadl")) as {
      Foo: ModelType;
      Bar: ModelType;
    };
    strictEqual(Foo.properties.get("y")!.type, Bar.properties.get("x"));
  });

  it("can reference spread model properties", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      model Spreadable {
        y: string;
      }

      @test model Bar {
        x: string;
        ... Spreadable;
      }

      @test model Foo { x: Bar.x, y: Bar.y }
      `
    );

    const { Foo, Bar } = (await testHost.compile("./main.cadl")) as {
      Foo: ModelType;
      Bar: ModelType;
    };

    strictEqual(Foo.properties.get("y")!.type, Bar.properties.get("y"));
  });

  it("can reference inherited model properties", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      @test model Base {
        y: string;
      }

      @test model Bar extends Base {
        x: string;
      }

      @test model Foo { x: Bar.x, y: Bar.y }
      `
    );

    const { Foo, Bar, Base } = (await testHost.compile("./main.cadl")) as {
      Foo: ModelType;
      Bar: ModelType;
      Base: ModelType;
    };

    strictEqual(Foo.properties.get("x")!.type, Bar.properties.get("x"));
    strictEqual(Foo.properties.get("y")!.type, Base.properties.get("y"));
  });

  it("can reference properties from declaration aliases", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      @test model Bar {
        x: string;
      }

      alias BarAlias = Bar;

      @test model Foo {
        y: BarAlias.x,
      }
      `
    );

    const { Foo, Bar } = (await testHost.compile("./main.cadl")) as {
      Foo: ModelType;
      Bar: ModelType;
    };

    strictEqual(Foo.properties.get("y")!.type, Bar.properties.get("x"));
  });
  it("can reference properties from instantiated aliases", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      @test model Bar<T> {
        x: T;
      }

      alias BarT = Bar<string>;

      @test model Foo {
        y: BarT.x,
      }
      `
    );

    const { Foo, Bar } = (await testHost.compile("./main.cadl")) as {
      Foo: ModelType;
      Bar: ModelType;
    };

    strictEqual(Foo.properties.get("y")!.type, Bar.properties.get("x"));
  });

  it("can reference enum members", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      @test enum Foo {
        x, y, z
      };

      @test op Bar(arg: Foo.x): void;

      `
    );

    const { Foo, Bar } = (await testHost.compile("./main.cadl")) as {
      Foo: EnumType;
      Bar: OperationType;
    };

    strictEqual(Foo.members[0], Bar.parameters.properties.get("arg")!.type);
  });

  it("can reference aliased enum members", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      @test enum Foo {
        x, y, z
      };

      alias FooAlias = Foo;
      @test op Bar(arg: FooAlias.x): void;
      `
    );

    const { Foo, Bar } = (await testHost.compile("./main.cadl")) as {
      Foo: EnumType;
      Bar: OperationType;
    };

    strictEqual(Foo.members[0], Bar.parameters.properties.get("arg")!.type);
  });
  it("can reference union variants", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      union Foo {
        @test("x") x: string
      }

      @test model Bar { prop: Foo.x };
      `
    );

    const { x, Bar } = (await testHost.compile("./main.cadl")) as {
      x: UnionTypeVariant;
      Bar: ModelType;
    };

    strictEqual(x, Bar.properties.get("prop")!.type);
  });

  it.only("can reference templated union variants", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      union Foo<T> {
        @test("x") x: T
      }

      alias FooT = Foo<string>;

      @test model Bar { prop: FooT.x };
      `
    );

    const { x, Bar } = (await testHost.compile("./main.cadl")) as {
      x: UnionTypeVariant;
      Bar: ModelType;
    };

    strictEqual(x, Bar.properties.get("prop")!.type);
  });

  it("can reference interface members", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      interface Foo {
        @test operation(): void;
      };

      @test model Bar { prop: Foo.operation };
      `
    );

    const { operation, Bar } = (await testHost.compile("./main.cadl")) as {
      operation: OperationType;
      Bar: ModelType;
    };

    strictEqual(operation, Bar.properties.get("prop")!.type);
  });

  it("can reference aliased interface members", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      interface Foo {
        @test operation(): void;
      };

      alias AliasFoo = Foo;

      @test model Bar { prop: AliasFoo.operation };
      `
    );

    const { operation, Bar } = (await testHost.compile("./main.cadl")) as {
      operation: OperationType;
      Bar: ModelType;
    };

    strictEqual(operation, Bar.properties.get("prop")!.type);
  });

  it("can reference instantiated interface members", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      interface Foo<T> {
        @test operation(): T;
      };

      alias AliasFoo = Foo<string>;

      @test model Bar { prop: AliasFoo.operation };
      `
    );

    const { operation, Bar } = (await testHost.compile("./main.cadl")) as {
      operation: OperationType;
      Bar: ModelType;
    };

    strictEqual(operation, Bar.properties.get("prop")!.type);
  });
});
