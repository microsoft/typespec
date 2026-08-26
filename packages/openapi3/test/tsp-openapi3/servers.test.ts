import { expect, it } from "vitest";
import { renderTypeSpecForOpenAPI3, validateTsp } from "./utils/tsp-for-openapi3.js";

it("render multi line description", async () => {
  const tsp = await renderTypeSpecForOpenAPI3({
    servers: [
      {
        url: "https://example.com/api",
        description: "Some\nMulti\nline\nDescription",
      },
    ],
  });

  expect(tsp).toMatchInlineSnapshot(`
    "import "@typespec/http";
    import "@typespec/openapi";
    import "@typespec/openapi3";

    using Http;
    using OpenAPI;

    @service(#{ title: "Test Service" })
    @info(#{ version: "1.0.0" })
    @server(
      "https://example.com/api",
      """
        Some
        Multi
        line
        Description
        """
    )
    namespace TestService;
    "
  `);

  await validateTsp(tsp);
});
it("render multi line description for parameters", async () => {
  const tsp = await renderTypeSpecForOpenAPI3({
    servers: [
      {
        url: "https://example.com/api/{region}",
        variables: {
          region: {
            default: "us",
            description: "Some\nMulti\nline\nDescription",
          },
        },
      },
    ],
  });

  expect(tsp).toMatchInlineSnapshot(`
    "import "@typespec/http";
    import "@typespec/openapi";
    import "@typespec/openapi3";

    using Http;
    using OpenAPI;

    @service(#{ title: "Test Service" })
    @info(#{ version: "1.0.0" })
    @server(
      "https://example.com/api/{region}",
      "",
      {
        /**
         * Some
         * Multi
         * line
         * Description
         */
        region: string = "us",
      }
    )
    namespace TestService;
    "
  `);

  await validateTsp(tsp);
});
