import { strictEqual } from "assert";
import { openApiFor } from "./test-host.js";

describe("openapi3: documentation", () => {
  it("supports summary and description", async () => {
    const openApi = await openApiFor(`
      @route("/")
      namespace N {
        @summary("This is a summary")
        @doc("This is the longer description")
        op read(): {};
      }
      `);
    strictEqual(openApi.paths["/"].get.summary, "This is a summary");
    strictEqual(openApi.paths["/"].get.description, "This is the longer description");
  });
});
