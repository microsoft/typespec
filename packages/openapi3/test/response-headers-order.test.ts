import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { openApiFor } from "./test-host.js";

describe("openapi3: response headers order", () => {
  const headerDefinitions = `
      model A_Header { @header a : string };
      model B_Header { @header b : string };
      model C_Header { @header c : string };
  `;
  it("header already in lexical order", async () => {
    const res = await openApiFor(
      `
      ${headerDefinitions}
      model Headers { ...A_Header, ...B_Header, ...C_Header };

      op read(): {@statusCode _: 200, content: string, headers: Headers};
      `
    );
    strictEqual(Object.keys(res.paths["/"].get.responses["200"].headers).length, 3);
    strictEqual(Object.keys(res.paths["/"].get.responses["200"].headers)[0], "a");
    strictEqual(Object.keys(res.paths["/"].get.responses["200"].headers)[1], "b");
    strictEqual(Object.keys(res.paths["/"].get.responses["200"].headers)[2], "c");
  });

  it("header not in lexical order", async () => {
    const res = await openApiFor(
      `
      ${headerDefinitions}
      model Headers { ...C_Header, ...A_Header, ...B_Header };

      op read(): {@statusCode _: 200, content: string, headers: Headers};
      `
    );
    strictEqual(Object.keys(res.paths["/"].get.responses["200"].headers).length, 3);
    strictEqual(Object.keys(res.paths["/"].get.responses["200"].headers)[0], "a");
    strictEqual(Object.keys(res.paths["/"].get.responses["200"].headers)[1], "b");
    strictEqual(Object.keys(res.paths["/"].get.responses["200"].headers)[2], "c");
  });
});
