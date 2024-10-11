import { deepStrictEqual, ok } from "assert";
import { it } from "vitest";
import { openApiFor } from "./test-host.js";

it("defines template models", async () => {
  const openApi = await openApiFor(`
    model Pet {
      choice_text: string;
    }
    model Cat <T extends Pet> {
      choices: T[];
    }
    @post op create(prompt: string): Cat<Pet>;
    `);
  //ok(openApi.components.schemas.Cat, "expected definition named Cat");
  ok(openApi.components.schemas.Pet, "expected definition named Pet");
  deepStrictEqual(openApi.paths["/"].post.responses["200"].content["application/json"].schema, {
    $ref: "#/components/schemas/Cat",
  });
});
