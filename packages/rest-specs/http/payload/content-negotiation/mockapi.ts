import { mockapi, ValidationError, json, withKeys, passOnSuccess } from "@typespec/spec-api";
import { ScenarioMockApi } from "@typespec/spec-api";
import { pngFile, jpgFile } from "../../helper.js";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Payload_ContentNegotiation_SameBody = withKeys(["image/png", "image/jpeg"]).pass(
  mockapi.get("/content-negotiation/same-body", (req) => {
    switch (req.headers["accept"]) {
      case "image/png":
        return {
          pass: "image/png",
          status: 200,
          body: {
            contentType: "image/png",
            rawContent: pngFile,
          },
        } as const;
      case "image/jpeg":
        return {
          pass: "image/jpeg",

          status: 200,
          body: {
            contentType: "image/jpeg",
            rawContent: jpgFile,
          },
        } as const;
      default:
        throw new ValidationError("Unsupported Accept header", `"image/png" | "image/jpeg"`, req.headers["accept"]);
    }
  }),
);

Scenarios.Payload_ContentNegotiation_DifferentBody = withKeys(["image/png", "application/json"]).pass(
  mockapi.get("/content-negotiation/different-body", (req) => {
    switch (req.headers["accept"]) {
      case "image/png":
        return {
          pass: "image/png",
          status: 200,
          body: {
            contentType: "image/png",
            rawContent: pngFile,
          },
        } as const;
      case "application/json":
        return {
          pass: "application/json",
          status: 200,
          body: json({
            content: pngFile.toString("base64"),
          }),
        } as const;
      default:
        throw new ValidationError(
          "Unsupported Accept header",
          `"image/png" | "application/json"`,
          req.headers["accept"],
        );
    }
  }),
);

Scenarios.Payload_Content_Negotiation_SameBody = passOnSuccess({
  uri: "/content-negotiation/same-body",
  mockMethods: [
    {
      method: "get",
      request: {
        config: {
          headers: {
            accept: "image/png",
          },
        },
      },
      response: {
        data: `uint8ArrayToString(response.data, "utf-8"),readFileSync(\`\${__dirname}/image.png\`).toString()`,
        status: 200,
      },
    },
    {
      method: "get",
      request: {
        config: {
          headers: {
            accept: "image/jpeg",
          },
        },
      },
      response: {
        data: `uint8ArrayToString(response.data, "utf-8"),readFileSync(\`\${__dirname}/image.jpg\`).toString()`,
        status: 200,
      },
    },
    {
      method: "get",
      request: {
        config: {
          validStatuses: [400],
          headers: {
            accept: "wrongAccept",
          },
        },
      },
      response: {
        status: 400,
        data: {
          message: "Unsupported Accept header",
          expected: `"image/png" | "image/jpeg"`,
          actual: "wrongAccept",
        },
      },
    },
  ],
});

Scenarios.Payload_Content_Negotiation_DifferentBody = passOnSuccess({
  uri: "/content-negotiation/different-body",
  mockMethods: [
    {
      method: "get",
      request: {
        config: {
          headers: {
            accept: "image/png",
          },
        },
      },
      response: {
        status: 200,
        data: `uint8ArrayToString(response.data, "utf-8"),readFileSync(\`\${__dirname}/image.png\`).toString()`,
      },
    },
    {
      method: "get",
      request: {
        config: {
          headers: {
            accept: "application/json",
          },
        },
      },
      response: {
        status: 200,
        data: `response.data.content,readFileSync(\`\${__dirname}/image.png\`).toString("base64")`,
      },
    },
    {
      method: "get",
      request: {
        config: {
          validStatuses: [400],
          headers: {
            accept: "wrongAccept",
          },
        },
      },
      response: {
        status: 400,
        data: {
          message: "Unsupported Accept header",
          expected: `"image/png" | "application/json"`,
          actual: "wrongAccept",
        },
      },
    },
  ],
});
