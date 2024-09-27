import {
  json,
  MockRequest,
  passOnSuccess,
  ScenarioMockApi,
  ValidationError,
} from "@typespec/spec-api";
import { jpgFile, pngFile } from "../../helper.js";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function sameBodyHandler(req: MockRequest) {
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
      throw new ValidationError(
        "Unsupported Accept header",
        `"image/png" | "image/jpeg"`,
        req.headers["accept"],
      );
  }
}

function differentBodyHandler(req: MockRequest) {
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
}

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
        data: pngFile,
        status: 200,
      },
      handler: sameBodyHandler,
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
        data: jpgFile,
        status: 200,
      },
      handler: sameBodyHandler,
    },
    {
      method: "get",
      request: {
        config: {
          validStatus: 400,
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
      handler: sameBodyHandler,
    },
  ],
  kind: "MockApiDefinition",
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
        data: pngFile,
      },
      handler: differentBodyHandler,
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
        data: pngFile,
      },
      handler: differentBodyHandler,
    },
    {
      method: "get",
      request: {
        config: {
          validStatus: 400,
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
      handler: differentBodyHandler,
    },
  ],
  kind: "MockApiDefinition",
});
