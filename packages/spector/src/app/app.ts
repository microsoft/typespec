import {
  MockApiDefinition,
  MockBody,
  MockMultipartBody,
  MockRequest,
  RequestExt,
  ScenarioMockApi,
} from "@typespec/spec-api";
import { ScenariosMetadata } from "@typespec/spec-coverage-sdk";
import { Response, Router } from "express";
import { getScenarioMetadata } from "../coverage/common.js";
import { CoverageTracker } from "../coverage/coverage-tracker.js";
import { logger } from "../logger.js";
import { internalRouter } from "../routes/index.js";
import { loadScenarioMockApis } from "../scenarios-resolver.js";
import { MockApiServer } from "../server/index.js";
import { ApiMockAppConfig } from "./config.js";
import { processRequest } from "./request-processor.js";

export interface ScenariosAndScenariosMetadata {
  scenarios: Record<string, ScenarioMockApi>;
  scenariosMetadata: ScenariosMetadata;
}

export class MockApiApp {
  private router = Router();
  private server: MockApiServer;
  private coverageTracker: CoverageTracker;

  constructor(private config: ApiMockAppConfig) {
    this.server = new MockApiServer({ port: config.port });
    this.coverageTracker = new CoverageTracker(config.coverageFile);
  }

  public async start(): Promise<void> {
    this.server.use("/", internalRouter);

    const ScenariosAndScenariosMetadata: ScenariosAndScenariosMetadata[] = [];
    if (Array.isArray(this.config.scenarioPath)) {
      for (let idx = 0; idx < this.config.scenarioPath.length; idx++) {
        const scenarios = await loadScenarioMockApis(this.config.scenarioPath[idx]);
        const scenariosMetadata = await getScenarioMetadata(this.config.scenarioPath[idx]);
        ScenariosAndScenariosMetadata.push({ scenarios, scenariosMetadata });
      }
    } else {
      const scenarios = await loadScenarioMockApis(this.config.scenarioPath);
      const scenariosMetadata = await getScenarioMetadata(this.config.scenarioPath);
      ScenariosAndScenariosMetadata.push({ scenarios, scenariosMetadata });
    }

    this.coverageTracker.setScenarios(ScenariosAndScenariosMetadata);

    for (const { scenarios } of ScenariosAndScenariosMetadata) {
      for (const [name, scenario] of Object.entries(scenarios)) {
        this.registerScenario(name, scenario);
      }
    }

    this.router.get("/.coverage", (req, res) => {
      res.json(this.coverageTracker.computeCoverage());
    });

    this.server.use("/", this.router);
    this.server.start();
  }

  private registerScenario(name: string, scenario: ScenarioMockApi) {
    for (const endpoint of scenario.apis) {
      if (!endpoint.handler) {
        endpoint.handler = createHandler(endpoint);
      }
      this.router.route(endpoint.uri)[endpoint.method]((req: RequestExt, res: Response) => {
        processRequest(this.coverageTracker, name, endpoint.uri, req, res, endpoint.handler!).catch(
          (e) => {
            logger.error("Unexpected request error", e);
            res.status(500).end();
          },
        );
      });
    }
  }
}

function validateBody(req: MockRequest, body: MockBody | MockMultipartBody) {
  if ("kind" in body) {
    // custom handler for now.
  } else {
    if (Buffer.isBuffer(body.rawContent)) {
      req.expect.rawBodyEquals(body.rawContent);
    } else {
      switch (body.contentType) {
        case "application/json":
          req.expect.coercedBodyEquals(JSON.parse(body.rawContent as any));
          break;
        case "application/xml":
          req.expect.xmlBodyEquals(
            (body.rawContent as any).replace(`<?xml version='1.0' encoding='UTF-8'?>`, ""),
          );
          break;
        default:
          req.expect.rawBodyEquals(body.rawContent);
      }
    }
  }
}

function createHandler(apiDefinition: MockApiDefinition) {
  return (req: MockRequest) => {
    const body = apiDefinition.request?.body;
    // Validate body if present in the request
    if (body) {
      validateBody(req, body);
    }

    // Validate headers if present in the request
    if (apiDefinition.request?.headers) {
      Object.entries(apiDefinition.request.headers).forEach(([key, value]) => {
        if (key.toLowerCase() !== "content-type") {
          if (Array.isArray(value)) {
            req.expect.deepEqual(req.headers[key], value);
          } else {
            req.expect.containsHeader(key.toLowerCase(), String(value));
          }
        }
      });
    }

    if (apiDefinition.request?.query) {
      Object.entries(apiDefinition.request.query).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          req.expect.deepEqual(req.query[key], value);
        } else {
          req.expect.containsQueryParam(key, String(value));
        }
      });
    }

    // Validations are done. Now return the response
    return {
      status: apiDefinition.response.status,
      body: apiDefinition.response.body,
      headers: apiDefinition.response.headers,
    };
  };
}
