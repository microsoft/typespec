import { ok } from "assert";
import { openApiFor } from "./test-host.js";

describe("openapi3: shared routes", () => {
  it("annotates shared routes correctly", async () => {
    const result = await openApiFor(
      `
      @service({title: "My Service"})
      namespace Foo {
        @route("/uploadImage", { shared: true })
        op uploadImageBytes(@body body: bytes, @header contentType: "image/png"): void;
        
        @route("/uploadImage", { shared: true })
        op uploadImageJson(@body body: {imageBase64: bytes}, @header contentType: "application/json"): void;
      }
      `
    );
    ok(false, "Finish test");
  });
});
