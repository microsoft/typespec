import {
  json,
  MockRequest,
  ScenarioMockApi,
  ValidationError,
  withServiceKeys,
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

Scenarios.Payload_ContentNegotiation_SameBody = withServiceKeys(["image/png", "image/jpeg"]).pass([
  {
    uri: "/content-negotiation/same-body",
    method: "get",
    request: {
      headers: {
        accept: "image/png",
      },
    },
    response: {
      body: {
        contentType: "image/png",
        rawContent: pngFile,
      },
      status: 200,
    },
    handler: (req) => sameBodyHandler(req),
    kind: "MockApiDefinition",
  },
  {
    uri: "/content-negotiation/same-body",
    method: "get",
    request: {
      headers: {
        accept: "image/jpeg",
      },
    },
    response: {
      body: {
        contentType: "image/jpeg",
        rawContent: jpgFile,
      },
      status: 200,
    },
    handler: (req) => sameBodyHandler(req),
    kind: "MockApiDefinition",
  },
  {
    uri: "/content-negotiation/same-body",
    method: "get",
    request: {
      status: 400,
      headers: {
        accept: "wrongAccept",
      },
    },
    response: {
      status: 400,
      body: json({
        message: "Unsupported Accept header",
        expected: `"image/png" | "image/jpeg"`,
        actual: "wrongAccept",
      }),
    },
    handler: sameBodyHandler,
    kind: "MockApiDefinition",
  },
]);

Scenarios.Payload_ContentNegotiation_DifferentBody = withServiceKeys([
  "image/png",
  "application/json",
]).pass([
  {
    uri: "/content-negotiation/different-body",
    method: "get",
    request: {
      headers: {
        accept: "image/png",
      },
    },
    response: {
      status: 200,
      body: {
        contentType: "image/png",
        rawContent: pngFile,
      },
    },
    handler: differentBodyHandler,
    kind: "MockApiDefinition",
  },
  {
    uri: "/content-negotiation/different-body",
    method: "get",
    request: {
      headers: {
        accept: "application/json",
      },
    },
    response: {
      status: 200,
      body: json({
        content: pngFile.toString("base64"),
      }),
    },
    handler: differentBodyHandler,
    kind: "MockApiDefinition",
  },
  {
    uri: "/content-negotiation/different-body",
    method: "get",
    request: {
      status: 400,
      headers: {
        accept: "wrongAccept",
      },
    },
    response: {
      status: 400,
      body: json({
        message: "Unsupported Accept header",
        expected: `"image/png" | "application/json"`,
        actual: "wrongAccept",
      }),
    },
    handler: differentBodyHandler,
    kind: "MockApiDefinition",
  },
]);
