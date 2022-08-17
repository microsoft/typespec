import { ok } from "assert";
import {
  isTemplateDeclaration,
  isTemplateDeclarationOrInstance,
  isTemplateInstance,
  Model,
} from "../core/index.js";
import { BasicTestRunner, createTestRunner } from "../testing/index.js";

describe("compiler: type-utils", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createTestRunner();
  });
  describe("template utils", () => {
    it("check model is a template declaration", async () => {
      await runner.compile(`
       model Foo<T> {t: T};
    `);
      const Foo = runner.program.checker.getGlobalNamespaceType().models.get("Foo")!;
      ok(isTemplateDeclarationOrInstance(Foo));
      ok(isTemplateDeclaration(Foo), "Should BE a template declaration");
      ok(!isTemplateInstance(Foo), "Should NOT be a template instance");
    });

    it("check model reference is a template instance", async () => {
      const { Bar } = (await runner.compile(`
      model Foo<T> {t: T};

      @test model Bar {
        foo: Foo<string> 
      }
      `)) as { Bar: Model };
      const Foo = Bar.properties.get("foo")!.type as Model;

      ok(isTemplateDeclarationOrInstance(Foo));
      ok(isTemplateInstance(Foo), "Should BE a template instance");
      ok(!isTemplateDeclaration(Foo), "Should NOT be a template declaration");
    });
  });
});
