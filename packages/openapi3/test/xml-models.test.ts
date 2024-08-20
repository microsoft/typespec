import { deepStrictEqual, ok } from "assert";
import { describe, it } from "vitest";
import { oapiForModel } from "./test-host.js";

describe("openapi3: xml models", () => {
  it("set the element value via @name", async () => {
    const res = await oapiForModel(
      "Book",
      `
      @name("xmlBook")
      model Book {        
        content: string;
      };`
    );

    ok(res.isRef);
    deepStrictEqual(res.schemas.Book, {
      type: "object",
      properties: {
        content: { type: "string" },
      },
      required: ["content"],
      xml: {
        name: "xmlBook",
      },
    });
  });

  it("set the attribute value via @name", async () => {
    const res = await oapiForModel(
      "Book",
      `model Book {
        @name("xmlcontent")
        content: string;
      };`
    );

    ok(res.isRef);
    deepStrictEqual(res.schemas.Book, {
      type: "object",
      properties: {
        content: { type: "string", xml: { name: "xmlcontent" } },
      },
      required: ["content"],
    });
  });
});
