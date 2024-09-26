import { MockApiDefinition, MockMethod } from "@typespec/spec-api";
import * as fs from "fs";
import * as path from "path";
import { logger } from "../logger.js";
import { loadScenarioMockApis } from "../scenarios-resolver.js";
import { makeServiceCall, uint8ArrayToString } from "./helper.js";

class ServerTestsGenerator {
  private name: string = "";
  private endpoint: string = "";
  private mockMethods: MockMethod[] | undefined;
  private serverBasePath: string = "";
  private scenariosPath: string = "";

  constructor(
    name: string,
    endpoint: string,
    mockMethods: MockMethod[] | undefined,
    serverBasePath: string,
    scenariosPath: string,
  ) {
    this.name = name;
    this.endpoint = endpoint;
    this.mockMethods = mockMethods;
    this.serverBasePath = serverBasePath;
    this.scenariosPath = scenariosPath;
  }

  public async executeScenario() {
    if (!this.mockMethods) return;
    for (const mockMethod of this.mockMethods) {
      logger.info(`Executing ${this.name} endpoint - Method: ${mockMethod.method}`);

      if (mockMethod.request.config?.validStatus) {
        mockMethod.request.config = {
          ...mockMethod.request.config,
          validateStatus: function (status: number) {
            return (
              (status >= 200 && status < 300) || status === mockMethod.request.config?.validStatus
            );
          },
        };
      }
      if (mockMethod.response.data && mockMethod.response.data["nextLink"]) {
        mockMethod.response.data = {
          ...mockMethod.response.data,
          nextLink: `${this.serverBasePath}${mockMethod.response.data["nextLink"]}`,
        };
      }

      const response = await makeServiceCall(mockMethod.method, {
        endPoint: `${this.serverBasePath}${this.endpoint}`,
        options: {
          requestBody: mockMethod.request.body,
          config: mockMethod.request.config,
        },
      });
      if (mockMethod.response.status !== response.status) {
        logger.error(`Status code mismatch for ${this.name} endpoint`);
        logger.error(`Expected: ${mockMethod.response.status} - Actual: ${response.status}`);
        throw new Error(`Status code mismatch for ${this.name} endpoint`);
      }
      if (mockMethod.response.data) {
        if (mockMethod.response.data["contentType"] === "application/xml") {
          if (
            JSON.stringify(mockMethod.response.data["rawContent"]) !== JSON.stringify(response.data)
          ) {
            logger.error(`Response data mismatch for ${this.name} endpoint`);
            logger.error(
              `Expected: ${mockMethod.response.data["rawContent"]} - Actual: ${response.data}`,
            );
            throw new Error(`Response data mismatch for ${this.name} endpoint`);
          }
        } else if (Buffer.isBuffer(mockMethod.response.data)) {
          if (
            mockMethod.request.config?.headers &&
            mockMethod.request.config.headers["accept"] === "application/json"
          ) {
            if (response.data.content !== mockMethod.response.data.toString("base64")) {
              throw new Error(`Response data mismatch for ${this.name} endpoint`);
            }
          } else {
            if (
              uint8ArrayToString(response.data, "utf-8") !== mockMethod.response.data.toString()
            ) {
              throw new Error(`Response data mismatch for ${this.name} endpoint`);
            }
          }
        } else {
          if (JSON.stringify(mockMethod.response.data) !== JSON.stringify(response.data)) {
            logger.error(`Response data mismatch for ${this.name} endpoint`);
            logger.error(`Expected: ${mockMethod.response.data} - Actual: ${response.data}`);
            throw new Error(`Response data mismatch for ${this.name} endpoint`);
          }
        }
      }
      if (mockMethod.response.config?.headers) {
        if (
          JSON.stringify(mockMethod.response.config.headers) !==
          JSON.stringify(response.config.headers)
        ) {
          throw new Error(`Response headers mismatch for ${this.name} endpoint`);
        }
      }
    }
  }
}

export async function serverTest(
  scenariosPath: string,
  serverBasePath: string,
  scenariosConfig: {
    runSingleScenario: string | undefined;
    runScenariosFromFile: string | undefined;
  },
) {
  // 1. Get Testcases to run
  const testCasesToRun: string[] = [];
  if (scenariosConfig.runSingleScenario) {
    testCasesToRun.push(scenariosConfig.runSingleScenario);
  } else if (scenariosConfig.runScenariosFromFile) {
    const data = fs.readFileSync(path.resolve(scenariosConfig.runScenariosFromFile), "utf8");
    const lines = data.split("\n");
    lines.forEach((line) => {
      testCasesToRun.push(line.trim());
    });
  }
  // 2. Load all the scenarios
  const scenarios = await loadScenarioMockApis(scenariosPath);
  // 3. Execute each scenario
  for (const [name, scenario] of Object.entries(scenarios)) {
    if (!Array.isArray(scenario.apis)) continue;
    for (const api of scenario.apis) {
      if ((api as any as MockApiDefinition).mockMethods === undefined) continue;
      if (testCasesToRun.length === 0 || testCasesToRun.includes(name)) {
        const obj: ServerTestsGenerator = new ServerTestsGenerator(
          name,
          api.uri,
          (api as any as MockApiDefinition).mockMethods,
          serverBasePath,
          scenariosPath,
        );
        await obj.executeScenario();
      }
    }
  }
}
