import { MockApiDefinition } from "@typespec/spec-api";
import * as fs from "fs";
import * as path from "path";
import pc from "picocolors";
import { logger } from "../logger.js";
import { loadScenarioMockApis } from "../scenarios-resolver.js";
import { makeServiceCall, uint8ArrayToString } from "./helper.js";

const DEFAULT_BASE_URL = "http://localhost:3000";

export interface ServerTestDiagnostics {
  scenario_name: string;
  status: "success" | "failure";
  message: any;
}

class ServerTestsGenerator {
  private name: string = "";
  private mockApiDefinition: MockApiDefinition;
  private serverBasePath: string = "";

  constructor(name: string, mockApiDefinition: MockApiDefinition, serverBasePath: string) {
    this.name = name;
    this.mockApiDefinition = mockApiDefinition;
    this.serverBasePath = serverBasePath;
  }

  private getConfigObj() {
    let config = {};
    if (this.mockApiDefinition.request.status) {
      const validStatusCode = this.mockApiDefinition.request.status;
      config = {
        validateStatus: function (status: number) {
          return (status >= 200 && status < 300) || validStatusCode === status;
        },
      };
    }
    if (this.mockApiDefinition.request.params) {
      config = {
        ...config,
        params: this.mockApiDefinition.request.params,
      };
    }
    if (this.mockApiDefinition.request.headers) {
      config = {
        ...config,
        headers: this.mockApiDefinition.request.headers,
      };
    }
    if (
      ["head", "get", "delete"].includes(this.mockApiDefinition.method) &&
      this.mockApiDefinition.request.body
    ) {
      config = {
        ...config,
        data: this.mockApiDefinition.request.body,
      };
    }
    return config;
  }

  public async executeScenario() {
    logger.info(`Executing ${this.name} endpoint - Method: ${this.mockApiDefinition.method}`);

    const response = await makeServiceCall(this.mockApiDefinition.method, {
      endPoint: `${this.serverBasePath}${this.mockApiDefinition.uri}`,
      options: {
        requestBody: this.mockApiDefinition.request.body,
        files: this.mockApiDefinition.request.files,
        config: this.getConfigObj(),
      },
    });

    if (this.mockApiDefinition.response.status !== response.status) {
      logger.error(`Status code mismatch for ${this.name} endpoint`);
      logger.error(
        `Expected: ${this.mockApiDefinition.response.status} - Actual: ${response.status}`,
      );
      throw new Error(`Status code mismatch for ${this.name} endpoint`);
    }
    if (this.mockApiDefinition.response.body) {
      if (this.mockApiDefinition.response.body.contentType === "application/xml") {
        if (
          JSON.stringify(this.mockApiDefinition.response.body.rawContent) !==
          JSON.stringify(response.data)
        ) {
          logger.error(`Response data mismatch for ${this.name} endpoint`);
          logger.error(
            `Expected: ${this.mockApiDefinition.response.body["rawContent"]} - Actual: ${response.data}`,
          );
          throw new Error(`Response data mismatch for ${this.name} endpoint`);
        }
      } else if (Buffer.isBuffer(this.mockApiDefinition.response.body.rawContent)) {
        if (
          this.mockApiDefinition.request.headers &&
          this.mockApiDefinition.request.headers["accept"] === "application/json"
        ) {
          if (
            response.data.content !==
            this.mockApiDefinition.response.body.rawContent.toString("base64")
          ) {
            throw new Error(`Response data mismatch for ${this.name} endpoint`);
          }
        } else {
          if (
            uint8ArrayToString(response.data, "utf-8") !==
            this.mockApiDefinition.response.body.rawContent.toString()
          ) {
            throw new Error(`Response data mismatch for ${this.name} endpoint`);
          }
        }
      } else if (this.mockApiDefinition.response.body.contentType === "text/plain") {
        if (this.mockApiDefinition.response.body.rawContent !== response.data) {
          logger.error(`Response data mismatch for ${this.name} endpoint`);
          logger.error(
            `Expected: ${this.mockApiDefinition.response.body} - Actual: ${response.data}`,
          );
          throw new Error(`Response data mismatch for ${this.name} endpoint`);
        }
      } else {
        const responseData = JSON.stringify(response.data);
        if (
          this.mockApiDefinition.response.body.rawContent !==
          responseData.replace(this.serverBasePath, "")
        ) {
          logger.error(`Response data mismatch for ${this.name} endpoint`);
          logger.error(
            `Expected: ${this.mockApiDefinition.response.body} - Actual: ${response.data}`,
          );
          throw new Error(`Response data mismatch for ${this.name} endpoint`);
        }
      }
    }
    if (this.mockApiDefinition.response.headers) {
      for (const key in this.mockApiDefinition.response.headers) {
        if (
          this.mockApiDefinition.response.headers[key] !==
          response.headers[key].replace(this.serverBasePath, "")
        ) {
          logger.error(`Response headers mismatch for ${this.name} endpoint`);
          logger.error(
            `Expected: ${this.mockApiDefinition.response.headers[key]} - Actual: ${response.headers[key]}`,
          );
          throw new Error(`Response headers mismatch for ${this.name} endpoint`);
        }
      }
    }
  }
}

export interface ServerTestOptions {
  baseUrl?: string;
  runSingleScenario?: string;
  runScenariosFromFile?: string;
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(baseUrl: string) {
  logger.info(`Executing server tests with base URL: ${baseUrl}`);
  let retry = 0;

  while (retry < 3) {
    try {
      await fetch(baseUrl);
      break;
    } catch (e) {
      retry++;
      logger.info("Retrying...");
      await delay(retry * 1000);
    }
  }
  logger.info(`  ${baseUrl} is ready!`);
}

export async function serverTest(scenariosPath: string, options: ServerTestOptions = {}) {
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  await waitForServer(baseUrl);
  // 1. Get Testcases to run
  const testCasesToRun: string[] = [];
  if (options.runSingleScenario) {
    testCasesToRun.push(options.runSingleScenario);
  } else if (options.runScenariosFromFile) {
    const data = fs.readFileSync(path.resolve(options.runScenariosFromFile), "utf8");
    const lines = data.split("\n");
    lines.forEach((line) => {
      testCasesToRun.push(line.trim());
    });
  }
  // 2. Load all the scenarios
  const scenarios = await loadScenarioMockApis(scenariosPath);
  const success_diagnostics: ServerTestDiagnostics[] = [];
  const failure_diagnostics: ServerTestDiagnostics[] = [];

  // 3. Execute each scenario
  for (const [name, scenario] of Object.entries(scenarios)) {
    if (!Array.isArray(scenario.apis)) continue;
    for (const api of scenario.apis) {
      if (api.kind !== "MockApiDefinition") continue;
      if (testCasesToRun.length === 0 || testCasesToRun.includes(name)) {
        const obj: ServerTestsGenerator = new ServerTestsGenerator(name, api, baseUrl);
        try {
          await obj.executeScenario();
          success_diagnostics.push({
            scenario_name: name,
            status: "success",
            message: "executed successfully",
          });
        } catch (e: any) {
          failure_diagnostics.push({
            scenario_name: name,
            status: "failure",
            message: `code = ${e.code} \n message = ${e.message} \n name = ${e.name} \n stack = ${e.stack} \n status = ${e.status}`,
          });
        }
      }
    }
  }

  // 4. Print diagnostics
  logger.info("Server Tests Diagnostics Summary");

  if (success_diagnostics.length > 0) logger.info("Success Scenarios");
  success_diagnostics.forEach((diagnostic) => {
    logger.info(`${pc.green("✓")} Scenario: ${diagnostic.scenario_name} - ${diagnostic.message}`);
  });

  if (failure_diagnostics.length > 0) logger.error("Failure Scenarios");
  if (failure_diagnostics.length > 0) {
    logger.error("Failed Scenario details");
    failure_diagnostics.forEach((diagnostic) => {
      logger.error(`${pc.red("✘")} Scenario: ${diagnostic.scenario_name}`);
      logger.error(`${diagnostic.message}`);
    });
    process.exit(-1);
  }
}
