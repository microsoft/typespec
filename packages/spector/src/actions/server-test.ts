import { MockApiDefinition, MockBody, ValidationError } from "@typespec/spec-api";
import deepEqual from "deep-equal";
import micromatch from "micromatch";
import { inspect } from "node:util";
import pc from "picocolors";
import { logger } from "../logger.js";
import { loadScenarioMockApis } from "../scenarios-resolver.js";
import { makeServiceCall } from "./helper.js";

const DEFAULT_BASE_URL = "http://localhost:3000";

export interface ServerTestDiagnostics {
  scenarioName: string;
  message: string;
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

  public async executeScenario() {
    log(`Executing ${this.name} endpoint - Method: ${this.mockApiDefinition.method}`);

    const response = await makeServiceCall({
      method: this.mockApiDefinition.method,
      url: `${this.serverBasePath}${this.mockApiDefinition.uri}`,
      body: this.mockApiDefinition.request?.body,
      headers: this.mockApiDefinition.request?.headers,
      query: this.mockApiDefinition.request?.query,
      pathParams: this.mockApiDefinition.request?.pathParams,
    });

    if (this.mockApiDefinition.response.status !== response.status) {
      throw new ValidationError(
        "Status code mismatch",
        this.mockApiDefinition.response.status,
        response.status,
      );
    }

    if (this.mockApiDefinition.response.body) {
      await this.#validateBody(response, this.mockApiDefinition.response.body);
    }

    if (this.mockApiDefinition.response.headers) {
      for (const key in this.mockApiDefinition.response.headers) {
        if (
          this.mockApiDefinition.response.headers[key] !==
          response.headers.get(key)?.replace(this.serverBasePath, "")
        ) {
          throw new ValidationError(
            `Response headers mismatch`,
            this.mockApiDefinition.response.headers[key],
            response.headers.get(key),
          );
        }
      }
    }
  }

  async #validateBody(response: Response, body: MockBody) {
    if (Buffer.isBuffer(body.rawContent)) {
      const responseData = Buffer.from(await response.arrayBuffer());
      if (!deepEqual(responseData, body.rawContent)) {
        throw new ValidationError(`Raw body mismatch`, body.rawContent, responseData);
      }
    } else {
      const responseData = await response.text();
      if (typeof body.rawContent !== "string") {
        throw new Error(` bodyContent should be string`);
      }

      switch (body.contentType) {
        case "application/xml":
        case "text/plain":
          if (body.rawContent !== responseData) {
            throw new ValidationError("Response data mismatch", body.rawContent, responseData);
          }
          break;
        case "application/json":
          const expected = JSON.parse(body.rawContent);
          const actual = JSON.parse(responseData);
          if (!deepEqual(actual, expected, { strict: true })) {
            throw new ValidationError("Response data mismatch", expected, actual);
          }
      }
    }
  }
}

export interface ServerTestOptions {
  baseUrl?: string;
  filter?: string;
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(baseUrl: string) {
  logger.debug(`Executing server tests with base URL: ${baseUrl}`);
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
  const scenarios = await loadScenarioMockApis(scenariosPath);
  const successfullScenarios: { name: string }[] = [];
  const failureDiagnostics: ServerTestDiagnostics[] = [];

  const allScenarioEntries = Object.entries(scenarios);
  const scenarioEntries = allScenarioEntries.filter(([name]) => {
    const pathlikeName = name.replaceAll("_", "/").toLowerCase();
    const filter = options.filter?.toLowerCase();
    if (filter && !micromatch.isMatch(pathlikeName, filter)) {
      logger.debug(`Skipping scenario: ${pathlikeName}, does not match filter: ${filter}`);
      return false;
    }
    return true;
  });
  // 3. Execute each scenario
  for (const [name, scenario] of scenarioEntries) {
    if (!Array.isArray(scenario.apis)) continue;
    for (const api of scenario.apis) {
      if (api.kind !== "MockApiDefinition") continue;
      const obj: ServerTestsGenerator = new ServerTestsGenerator(name, api, baseUrl);
      try {
        await obj.executeScenario();
        successfullScenarios.push({
          name,
        });
      } catch (e: any) {
        if (e instanceof ValidationError) {
          failureDiagnostics.push({
            scenarioName: name,
            message: [
              `Validation failed: ${e.message}:`,
              ` Expected:\n    ${inspect(e.expected)}`,
              ` Actual:\n    ${inspect(e.actual)}`,
            ].join("\n"),
          });
        } else {
          failureDiagnostics.push({
            scenarioName: name,
            message: `code = ${e.code} \n message = ${e.message} \n name = ${e.name} \n stack = ${e.stack} \n status = ${e.status}`,
          });
        }
      }
    }
  }

  // 4. Print diagnostics
  log("");
  log("Server Tests Diagnostics Summary");

  if (successfullScenarios.length === 0 && failureDiagnostics.length === 0) {
    logger.error("No scenarios were executed");
    process.exit(-1);
  }

  if (successfullScenarios.length > 0) log("Successfull scenarios");
  successfullScenarios.forEach((diagnostic) => {
    log(`${pc.green("✓")} Scenario: ${pc.cyan(diagnostic.name)}`);
  });

  if (failureDiagnostics.length > 0) {
    log("Failed scenarios");
    failureDiagnostics.forEach((diagnostic) => {
      log(`${pc.red("✘")} Scenario: ${pc.cyan(diagnostic.scenarioName)}`);
      log(`${diagnostic.message}`);
    });
  }
  log(pc.bold(pc.green(`✓ ${scenarioEntries.length} passed`)));
  if (failureDiagnostics.length > 0) {
    log(pc.red(`✘ ${failureDiagnostics.length} failed`));
  }

  process.exit(failureDiagnostics.length > 0 ? 1 : 0);
}

function log(message: string) {
  // eslint-disable-next-line no-console
  console.log(message);
}
