import { deepStrictEqual, ok, strictEqual } from "assert";
import { DecoratorContext, getTypeName, Namespace, Type } from "../../core/index.js";
import { createProjector } from "../../core/projector.js";
import { createTestHost, createTestRunner } from "../../testing/test-host.js";
import { BasicTestRunner, TestHost } from "../../testing/types.js";

/**
 * This test suite checks that projected types are reconstructed just fine.
 */
describe("compiler: projector: Identity", () => {
  let host: TestHost;
  let runner: BasicTestRunner;

  beforeEach(async () => {
    host = await createTestHost();
    runner = await createTestRunner(host);
  });

  type IdentifyProjectResult<T extends Type> = {
    type: T;
    globalNamespace: Namespace;

    originalType: T;

    /**
     * Types collected with the `@collect` decorator in the order they were run.
     */
    trackedTypes: Type[];
  };

  /**
   * Project the given code without any projection implementation.
   */
  async function projectWithNoChange<K extends Type["kind"], T extends Type & { kind: K }>(
    code: string,
    kind?: K
  ): Promise<IdentifyProjectResult<T>> {
    const projections = [{ arguments: [], projectionName: "noop" }];

    const trackedTypes: Type[] = [];
    host.addJsFile("./track.js", {
      $track: (_: DecoratorContext, target: Type) => trackedTypes.push(target),
    });

    const { target } = await runner.compile(`
      import "./track.js";
      ${code}`);

    while (trackedTypes.length > 0) {
      trackedTypes.pop();
    }

    ok(target, `Expected to have found a test type tagged with target. Add @test("target")`);
    if (kind) {
      strictEqual(target.kind, kind);
    }
    const projector = createProjector(runner.program, projections).projector;
    const projectedType = projector.projectedTypes.get(target);
    ok(projectedType, `Type ${getTypeName(target)} should have been projected`);
    if (kind) {
      strictEqual(projectedType.kind, kind);
    }
    strictEqual(projectedType.projectionBase, target);
    strictEqual(projectedType.projectionSource, target);

    return {
      type: projectedType as T,
      globalNamespace: projector.projectedGlobalNamespace!,
      originalType: target as T,
      trackedTypes,
    };
  }

  type TestDecoratorOrderOptions = {
    name: string;
    code: string;
    ref?: string;
    expectedTypes: [Type["kind"], string][];
  };

  function describeDecoratorOrder({ name, code, ref, expectedTypes }: TestDecoratorOrderOptions) {
    if (ref === undefined) {
      it(name, async () => {
        const emptyCode = `@test("target") model Empty {}`;
        const result = await projectWithNoChange(`${emptyCode}\n${code}`);
        expectTrackedTypes(result.trackedTypes, expectedTypes);
      });
    } else {
      const refCode = `
        @test("target") model Referencing {
          b: ${ref};
        }
      `;
      describe(name, () => {
        it("referenced before", async () => {
          const result = await projectWithNoChange(`${refCode}\n${code}`);
          expectTrackedTypes(result.trackedTypes, expectedTypes);
        });

        it("referenced after", async () => {
          const result = await projectWithNoChange(`${code}\n${refCode}`);
          expectTrackedTypes(result.trackedTypes, expectedTypes);
        });
      });
    }
  }

  function expectTrackedTypes(trackedTypes: Type[], expectedTypes: [Type["kind"], string][]) {
    deepStrictEqual(
      trackedTypes.map((x) => [x.kind, getTypeName(x)]),
      expectedTypes
    );
  }

  describe("models", () => {
    it("link projected model to projected properties", async () => {
      const projectResult = await projectWithNoChange(
        `
          @test("target") model Foo {
            name: string;
          }
        `,
        "Model"
      );
      strictEqual(projectResult.type.properties.get("name")?.model, projectResult.type);
    });

    it("link projected property with sourceProperty", async () => {
      const code = `
        @test("target") model Foo {
          ...Spreadable
        }

        model Spreadable {
          name: string;
        }
      `;
      const projectResult = await projectWithNoChange(code, "Model");
      const sourceProperty = projectResult.type.properties.get("name")?.sourceProperty;
      ok(sourceProperty);
      const Spreadable = projectResult.globalNamespace.models.get("Spreadable")!;
      strictEqual(sourceProperty, Spreadable.properties.get("name"));
    });

    it("project property with type referencing sibling", async () => {
      const code = `
      @test("target") model Foo {
        a: Foo.b;
        b: string;
      }`;
      const result = await projectWithNoChange(code, "Model");
      strictEqual(result.type.properties.get("a")?.type, result.type.properties.get("b"));
    });

    describe("runs decorator on property before model", () => {
      describeDecoratorOrder({
        name: "simple",
        code: `
          @track model Foo {
            @track a: string
          }`,
        ref: "Foo.a",
        expectedTypes: [
          ["ModelProperty", "Foo.a"],
          ["Model", "Foo"],
        ],
      });

      describeDecoratorOrder({
        name: "with spread properties",
        code: `
          @track model Foo {
            ...Spreadable;
          }
    
          model Spreadable {
            @track name: string;
          }`,
        ref: "Foo.name",
        expectedTypes: [
          ["ModelProperty", "Spreadable.name"],
          ["ModelProperty", "Foo.name"],
          ["Model", "Foo"],
        ],
      });
    });
  });

  describe("unions", () => {
    it("link projected unions to projected variants", async () => {
      const projectResult = await projectWithNoChange(
        `
          @test("target") union Foo {
            one: {};
          }
        `,
        "Union"
      );
      strictEqual(projectResult.type.variants.get("one")?.union, projectResult.type);
    });

    describe("runs decorator on variants before unions", () => {
      describeDecoratorOrder({
        name: "simple",
        code: `
          @track union Foo {
            @track one: {}
          }`,
        ref: "Foo.one",
        expectedTypes: [
          ["UnionVariant", "{}"],
          ["Union", "Foo"],
        ],
      });
    });
  });

  describe("enum", () => {
    it("link projected enum to the projected enum member", async () => {
      const projectResult = await projectWithNoChange(
        `
          @test("target") enum Foo {
            one,
          }
        `,
        "Enum"
      );
      strictEqual(projectResult.type.members.get("one")?.enum, projectResult.type);
    });

    describe("runs decorator on variants before unions", () => {
      describeDecoratorOrder({
        name: "simple",
        code: `
          @track enum Foo {
            @track one,
          }`,
        ref: "Foo.one",
        expectedTypes: [
          ["EnumMember", "Foo.one"],
          ["Enum", "Foo"],
        ],
      });

      describeDecoratorOrder({
        name: "with spread members",
        code: `
          @track enum Foo {
            ...Spreadable;
          }
    
          enum Spreadable {
            @track one,
          }`,
        ref: "Foo.one",
        expectedTypes: [
          ["EnumMember", "Foo.one"],
          ["Enum", "Foo"],
          ["EnumMember", "Spreadable.one"],
        ],
      });
    });
  });

  describe("interface", () => {
    it("link projected interface to the projected operation member", async () => {
      const projectResult = await projectWithNoChange(
        `
          @test("target") interface Foo {
            one(): void;
          }
        `,
        "Interface"
      );
      strictEqual(projectResult.type.operations.get("one")?.interface, projectResult.type);
    });

    describe("runs decorator on variants before unions", () => {
      describeDecoratorOrder({
        name: "simple",
        code: `
          @track interface Foo {
            @track one(): void;
          }`,
        ref: "Foo.one",
        expectedTypes: [
          ["Operation", "one"],
          ["Interface", "Foo"],
        ],
      });
    });
  });
});
