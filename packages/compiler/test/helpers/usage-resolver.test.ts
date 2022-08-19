import { deepStrictEqual } from "assert";
import { resolveUsages, UsageFlags } from "../../core/helpers/usage-resolver.js";
import { BasicTestRunner, createTestRunner } from "../../testing/index.js";

describe("compiler: helpers: usage resolver", () => {
  let runner: BasicTestRunner;
  beforeEach(async () => {
    runner = await createTestRunner();
  });

  async function getUsages(
    code: string,
    targetName?: string
  ): Promise<{ inputs: string[]; outputs: string[] }> {
    const targets = await runner.compile(code);

    const usages = resolveUsages(
      targetName ? (targets[targetName] as any) : runner.program.checker.getGlobalNamespaceType()
    );

    const result: { inputs: string[]; outputs: string[] } = { inputs: [], outputs: [] };
    for (const type of usages.types) {
      if (usages.isUsedAs(type, UsageFlags.Input) && "name" in type && type.name !== "") {
        result.inputs.push(runner.program.checker.getTypeName(type));
      }
      if (usages.isUsedAs(type, UsageFlags.Output) && "name" in type && type.name !== "") {
        result.outputs.push(runner.program.checker.getTypeName(type));
      }
    }
    return result;
  }

  it("track model used as operation parameter as input", async () => {
    const usages = await getUsages(`
      model Foo {}
      op test(input: Foo): void;
    `);

    deepStrictEqual(usages, { inputs: ["Foo"], outputs: [] });
  });

  it("track model used as operation returnType as output", async () => {
    const usages = await getUsages(`
      model Foo {}
      op test(): Foo;
    `);

    deepStrictEqual(usages, { inputs: [], outputs: ["Foo"] });
  });

  it("track model used as operation returnType inside interface as output", async () => {
    const usages = await getUsages(`
      model Foo {}
      interface MyI {
        test(): Foo;
      }
    `);

    deepStrictEqual(usages, { inputs: [], outputs: ["Foo"] });
  });

  it("track model used as operation returnType inside namespace as output", async () => {
    const usages = await getUsages(`
      model Foo {}
      namespace MyArea {
        op test(): Foo;
      }
    `);

    deepStrictEqual(usages, { inputs: [], outputs: ["Foo"] });
  });

  it("track model used as operation parameter and returnType as both input and output", async () => {
    const usages = await getUsages(`
      model Foo {}
      op test(input: Foo): Foo;
    `);

    deepStrictEqual(usages, { inputs: ["Foo"], outputs: ["Foo"] });
  });

  it("track model referenced via property in returnType", async () => {
    const usages = await getUsages(`
      model Bar {}
      model Foo {
        bar: Bar;
      }
      op test(): Foo;
    `);

    deepStrictEqual(usages, { inputs: [], outputs: ["Foo", "Bar"] });
  });

  it("track model referenced via base model in returnType", async () => {
    const usages = await getUsages(`
      model Bar {}
      model Foo extends Bar {}
      op test(): Foo;
    `);

    deepStrictEqual(usages, { inputs: [], outputs: ["Foo", "Bar"] });
  });

  it("track model referenced via child model in returnType", async () => {
    const usages = await getUsages(`
      model Bar extends Foo {}
      model Foo  {}
      op test(): Foo;
    `);

    deepStrictEqual(usages, { inputs: [], outputs: ["Foo", "Bar"] });
  });

  it("track model referenced in union in returnType", async () => {
    const usages = await getUsages(`
      model Bar {}
      model Foo {}
      op test(): Foo | Bar;
    `);

    deepStrictEqual(usages, { inputs: [], outputs: ["Foo", "Bar"] });
  });

  it("track enum referenced in returnType", async () => {
    const usages = await getUsages(`
      enum MyEnum {}
      op test(): MyEnum;
    `);

    deepStrictEqual(usages, { inputs: [], outputs: ["MyEnum"] });
  });

  describe("resolving usage of specific operation", () => {
    it("only collect types used in that operation", async () => {
      const usages = await getUsages(
        `
          model Foo {}
          model Bar {}
          op set(): Bar;
          @test op get(): Foo; 
        `,
        "get"
      );

      deepStrictEqual(usages, { inputs: [], outputs: ["Foo"] });
    });

    it("only collect specific usage(input/output) for that operation", async () => {
      const usages = await getUsages(
        `
          model Foo {}
          op set(input: Foo): void;
          @test op get(): Foo; 
        `,
        "get"
      );

      deepStrictEqual(usages, { inputs: [], outputs: ["Foo"] });
    });
  });

  describe("resolving usage of specific interface", () => {
    it("only find usage in that interface", async () => {
      const usages = await getUsages(
        `
          model Foo {}
          model Bar {}
          interface One {
            set(input: Foo): void;
          }
          @test interface Two {
            get(): Foo;
            other(input: Bar): void;
          }
        `,
        "Two"
      );

      deepStrictEqual(usages, { inputs: ["Bar"], outputs: ["Foo"] });
    });
  });
});
