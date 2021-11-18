import { ModelType } from "@cadl-lang/compiler";
import { ok, strictEqual } from "assert";
import { createVersioningTestHost, TestHost } from "./testHost.js";

describe("cadl: versioning", () => {
  describe("versioning models", () => {
    let host: TestHost;
    beforeEach(async () => {
      host = await createVersioningTestHost();
    });

    it("can add properties", async () => {
      const {
        source,
        projections: [v1, v2, v3],
      } = await versionedModel(
        [1, 2, 3],
        `model Test {
          a: int32;
          @added(2) b: int32;
          @added(3) c: int32;
          @added(2) nested: Nested;
        }
        model Nested {
          d: int32;
          @added(3) e: int32;
        }
        `
      );
      assertHasProperties(v1, ["a"]);
      assertHasProperties(v2, ["a", "b", "nested"]);
      assertHasProperties(v2.properties.get("nested")!.type as ModelType, ["d"]);
      assertHasProperties(v3, ["a", "b", "c", "nested"]);
      assertHasProperties(v3.properties.get("nested")!.type as ModelType, ["d", "e"]);
      assertProjectsTo(
        [
          [v1, 1],
          [v2, 2],
          [v3, 3],
        ],
        source
      );
    });

    it("can remove properties", async () => {
      const {
        source,
        projections: [v1, v2, v3],
      } = await versionedModel(
        [1, 2, 3],
        `model Test {
          a: int32;
          @removed(2) b: int32;
          @removed(3) c: int32;
          @removed(3) nested: Nested;
        }
        model Nested {
          d: int32;
          @removed(2) e: int32;
        }
        `
      );
      assertHasProperties(v1, ["a", "b", "c", "nested"]);
      assertHasProperties(v1.properties.get("nested")!.type as ModelType, ["d", "e"]);
      assertHasProperties(v2, ["a", "c", "nested"]);
      assertHasProperties(v2.properties.get("nested")!.type as ModelType, ["d"]);
      assertHasProperties(v3, ["a"]);
      assertProjectsTo(
        [
          [v1, 1],
          [v2, 2],
          [v3, 3],
        ],
        source
      );
    });

    it("can rename properties", async () => {
      const {
        source,
        projections: [v1, v2, v3],
      } = await versionedModel(
        [1, 2, 3],
        `model Test {
          a: int32;
          @renamedFrom(2, "foo") b: int32;
          @renamedFrom(3, "bar") c: int32;
        }`
      );

      assertHasProperties(v1, ["a", "foo", "bar"]);
      assertHasProperties(v2, ["a", "b", "bar"]);
      assertHasProperties(v3, ["a", "b", "c"]);
      assertProjectsTo(
        [
          [v1, 1],
          [v2, 2],
          [v3, 3],
        ],
        source
      );
    });

    async function versionedModel(versions: (string | number)[], model: string) {
      host.addCadlFile(
        "main.cadl",
        `
      import "versioning";
      @versioned(${versions.map((t) => JSON.stringify(t)).join(" | ")})
      namespace MyService;

      @test ${model}
      `
      );

      const { Test } = (await host.compile("./main.cadl")) as { Test: ModelType };

      return {
        source: Test,
        projections: versions.map((v) => {
          return host.program.checker!.project(Test, Test.projections[0].to!, [v]) as ModelType;
        }),
      };
    }

    function assertHasProperties(model: ModelType, props: string[]) {
      strictEqual(model.properties.size, props.length, `Model ${model.name} property count`);
      for (const propName of props) {
        ok(model.properties.has(propName), `Model ${model.name} should have property ${propName}`);
      }
    }

    function assertProjectsTo(models: [ModelType, number][], target: ModelType) {
      models.forEach(([m, version]) => {
        const projection = host.program.checker!.project(m, m.projections[0].from!, [
          version,
        ]) as ModelType;
        strictEqual(projection.properties.size, target.properties.size);
        for (const prop of projection.properties.values()) {
          ok(target.properties.has(prop.name));
        }
      });
    }
  });
});
