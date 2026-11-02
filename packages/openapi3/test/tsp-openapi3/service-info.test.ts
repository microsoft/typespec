import { expect, it } from "vitest";
import { renderTypeSpecForOpenAPI3, validateTsp } from "./utils/tsp-for-openapi3.js";

it("escapes quotes in the service title", async () => {
  const tsp = await renderTypeSpecForOpenAPI3({
    info: { title: 'The "Pet" Store', version: "1.0.0" },
  });

  await validateTsp(tsp);
  expect(tsp).toContain(`@service(#{ title: "The \\"Pet\\" Store" })`);
});

it("escapes newlines in the service title", async () => {
  const tsp = await renderTypeSpecForOpenAPI3({
    info: { title: "Pet\nStore", version: "1.0.0" },
  });

  await validateTsp(tsp);
});

it("escapes interpolation in the service title", async () => {
  const tsp = await renderTypeSpecForOpenAPI3({
    info: { title: "Pet ${Store}", version: "1.0.0" },
  });

  await validateTsp(tsp);
  expect(tsp).toContain('@service(#{ title: "Pet \\${Store}" })');
});
