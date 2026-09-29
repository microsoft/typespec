import { expect, it } from "vitest";
import { renderTypeSpecForOpenAPI3, validateTsp } from "./utils/tsp-for-openapi3.js";

it("escapes quotes and line breaks in tag metadata", async () => {
  const tsp = await renderTypeSpecForOpenAPI3({
    tags: [
      { name: "pets", description: 'Everything about "pets"' },
      { name: "store", description: "Access to\nthe store" },
    ],
  });

  await validateTsp(tsp);
  expect(tsp).toContain(`#{ name: "pets", description: "Everything about \\"pets\\"" }`);
});
