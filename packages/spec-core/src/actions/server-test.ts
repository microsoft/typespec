import { MockMethod } from "@typespec/spec-api";
import * as fs from "fs";
import * as path from "path";
import { logger } from "../logger.js";
import { loadScenarioMockApis } from "../scenarios-resolver.js";
import { makeServiceCall, uint8ArrayToString } from "./helper.js";

class ServerTestsGenerator {
  private name: string = "";
  private endpoint: string = "";
  private mockMethod: MockMethod;
  private serverBasePath: string = "";
  private scenariosPath: string = "";

  constructor(
    name: string,
    endpoint: string,
    mockMethod: MockMethod,
    serverBasePath: string,
    scenariosPath: string,
  ) {
    this.name = name;
    this.endpoint = endpoint;
    this.mockMethod = mockMethod;
    this.serverBasePath = serverBasePath;
    this.scenariosPath = scenariosPath;
  }

  private getConfigObj(mockMethod: MockMethod) {
    let config = {};
    if (mockMethod.request.status) {
      config = {
        validateStatus: function (status: number) {
          return (status >= 200 && status < 300) || status === mockMethod.request.status;
        },
      };
    }
    if (mockMethod.request.params) {
      config = {
        ...config,
        params: mockMethod.request.params,
      };
    }
    if (mockMethod.request.headers) {
      config = {
        ...config,
        headers: mockMethod.request.headers,
      };
    }
    if (["head", "get", "delete"].includes(mockMethod.method) && mockMethod.request.body) {
      config = {
        ...config,
        data: mockMethod.request.body,
      };
    }
    return config;
  }

  public async executeScenario() {
    // for (const mockMethod of this.mockMethods) {
    logger.info(`Executing ${this.name} endpoint - Method: ${this.mockMethod.method}`);

    const response = await makeServiceCall(this.mockMethod.method, {
      endPoint: `${this.serverBasePath}${this.endpoint}`,
      options: {
        requestBody: this.mockMethod.request.body,
        config: this.getConfigObj(this.mockMethod),
      },
    });

    if (this.mockMethod.response.status !== response.status) {
      logger.error(`Status code mismatch for ${this.name} endpoint`);
      logger.error(`Expected: ${this.mockMethod.response.status} - Actual: ${response.status}`);
      throw new Error(`Status code mismatch for ${this.name} endpoint`);
    }
    if (this.mockMethod.response.body) {
      if (this.mockMethod.response.body.contentType === "application/xml") {
        if (
          JSON.stringify(this.mockMethod.response.body.rawContent) !== JSON.stringify(response.data)
        ) {
          logger.error(`Response data mismatch for ${this.name} endpoint`);
          logger.error(
            `Expected: ${this.mockMethod.response.body["rawContent"]} - Actual: ${response.data}`,
          );
          throw new Error(`Response data mismatch for ${this.name} endpoint`);
        }
      } else if (Buffer.isBuffer(this.mockMethod.response.body.rawContent)) {
        if (
          this.mockMethod.request.headers &&
          this.mockMethod.request.headers["accept"] === "application/json"
        ) {
          if (
            response.data.content !== this.mockMethod.response.body.rawContent.toString("base64")
          ) {
            throw new Error(`Response data mismatch for ${this.name} endpoint`);
          }
        } else {
          if (
            uint8ArrayToString(response.data, "utf-8") !==
            this.mockMethod.response.body.rawContent.toString()
          ) {
            throw new Error(`Response data mismatch for ${this.name} endpoint`);
          }
        }
      } else if (this.mockMethod.response.body.contentType === "text/plain") {
        if (this.mockMethod.response.body.rawContent !== response.data) {
          logger.error(`Response data mismatch for ${this.name} endpoint`);
          logger.error(`Expected: ${this.mockMethod.response.body} - Actual: ${response.data}`);
          throw new Error(`Response data mismatch for ${this.name} endpoint`);
        }
      } else {
        const responseData = JSON.stringify(response.data);
        if (
          this.mockMethod.response.body.rawContent !== responseData.replace(this.serverBasePath, "")
        ) {
          logger.error(`Response data mismatch for ${this.name} endpoint`);
          logger.error(`Expected: ${this.mockMethod.response.body} - Actual: ${response.data}`);
          throw new Error(`Response data mismatch for ${this.name} endpoint`);
        }
      }
    }
    if (this.mockMethod.response.headers) {
      for (const key in this.mockMethod.response.headers) {
        if (this.mockMethod.response.headers[key] !== response.headers[key]) {
          logger.error(`Response headers mismatch for ${this.name} endpoint`);
          logger.error(
            `Expected: ${this.mockMethod.response.headers[key]} - Actual: ${response.headers[key]}`,
          );
          throw new Error(`Response headers mismatch for ${this.name} endpoint`);
        }
      }
    }
    // }
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
      if (api.kind !== "MockApiDefinition") continue;
      if (testCasesToRun.length === 0 || testCasesToRun.includes(name)) {
        const obj: ServerTestsGenerator = new ServerTestsGenerator(
          name,
          api.uri,
          api.mockMethod,
          serverBasePath,
          scenariosPath,
        );
        await obj.executeScenario();
      }
    }
  }
}
