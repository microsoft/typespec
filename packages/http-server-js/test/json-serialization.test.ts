import { Model, ModelProperty } from "@typespec/compiler";
import { BasicTestRunner, createTestRunner } from "@typespec/compiler/testing";
import { deepStrictEqual, ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import {
  emitJsonSerialization,
  requiresJsonSerialization,
} from "../src/common/serialization/json.js";
import { createInitialContext } from "../src/ctx.js";
import { JsEmitterOptions } from "../src/lib.js";
import { objectLiteralProperty, parseCase } from "../src/util/case.js";
import { keywordSafe } from "../src/util/keywords.js";

describe("json serialization", () => {
  let runner: BasicTestRunner;

  const defaultOptions: JsEmitterOptions = {
    express: false,
    "no-format": false,
    "omit-unreachable-types": false,
  };

  beforeEach(async () => {
    runner = await createTestRunner();
  });

  async function getModels() {
    const compiled = (await runner.compile(`
      @service(#{ title: "Test" })
      namespace Test;

      enum MyEnum {
        A,
        B,
      }

      model KeywordModel {
        type: MyEnum;
      }

      model RenamedModel {
        wire_type: MyEnum;
      }

      model TestModels {
        @test keyword: KeywordModel;
        @test renamed: RenamedModel;
      }
    `)) as {
      keyword: ModelProperty;
      renamed: ModelProperty;
    };

    if (compiled.keyword.type.kind !== "Model" || compiled.renamed.type.kind !== "Model") {
      throw new Error("Expected @test properties to reference models.");
    }

    const ctx = await createInitialContext(runner.program, defaultOptions);

    if (!ctx) {
      throw new Error("Expected emitter context.");
    }

    return {
      ctx,
      keywordModel: compiled.keyword.type,
      renamedModel: compiled.renamed.type,
    };
  }

  function emitModelSerialization(
    ctx: NonNullable<Awaited<ReturnType<typeof createInitialContext>>>,
    model: Model,
  ) {
    const module = ctx.globalNamespaceModule;
    return [...emitJsonSerialization(ctx, model, module, model.name)];
  }

  function getGeneratedPropertyName(name: string): string {
    return keywordSafe(parseCase(name).camelCase);
  }

  it("serializes enum properties when a keyword-safe property name forces model serialization", async () => {
    const { ctx, keywordModel } = await getModels();

    strictEqual(requiresJsonSerialization(ctx, ctx.globalNamespaceModule, keywordModel), true);

    const lines = emitModelSerialization(ctx, keywordModel);

    ok(
      lines.includes(
        `    ${objectLiteralProperty("type")}: input.${getGeneratedPropertyName("type")},`,
      ),
    );
    ok(lines.includes(`    ${getGeneratedPropertyName("type")}: input.type,`));
  });

  it("serializes enum properties when a renamed property forces model serialization", async () => {
    const { ctx, renamedModel } = await getModels();

    strictEqual(requiresJsonSerialization(ctx, ctx.globalNamespaceModule, renamedModel), true);

    const lines = emitModelSerialization(ctx, renamedModel);

    deepStrictEqual(lines, [
      "toJsonObject(input: RenamedModel): any {",
      "  return {",
      `    ${objectLiteralProperty("wire_type")}: input.${getGeneratedPropertyName("wire_type")},`,
      "  };",
      "},",
      "fromJsonObject(input: any): RenamedModel {",
      "  return {",
      `    ${getGeneratedPropertyName("wire_type")}: input.wire_type,`,
      "  };",
      "},",
    ]);
  });
});
