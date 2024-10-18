import { deepStrictEqual, ok } from "assert";
import { it } from "vitest";
import { openApiFor } from "./test-host.js";

it.each([
  ["TemplateInstance", "model Cat <T extends Pet=Pet> { choices: T[]; }", "Cat"],
  ["Instance", "model Cat <T extends Pet> { choices: T[]; }", "Cat<Pet>"],
])(`%s => %s`, async (_, model, modelName) => {
  const openApi = await openApiFor(`
    model Pet {
      choice_text: string;
    }
    ${model}
    @post op create(prompt: string): ${modelName};
    `);
  ok(openApi.components.schemas.Cat, "expected definition named Cat");
  ok(openApi.components.schemas.Pet, "expected definition named Pet");
  deepStrictEqual(openApi.paths["/"].post.responses["200"].content["application/json"].schema, {
    $ref: "#/components/schemas/Cat",
  });
});
