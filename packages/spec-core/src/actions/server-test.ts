import { HttpMethod, MockMethod } from "@typespec/spec-api";
import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { logger } from "../logger.js";
import { loadScenarioMockApis } from "../scenarios-resolver.js";

class ServerTestsGenerator {
  private name: string = "";
  private endpoint: string = "";
  private mockMethods: MockMethod[] | undefined;
  private serverBasePath: string = "";
  private testFolderPath: string = "";

  constructor(
    name: string,
    endpoint: string,
    mockMethods: MockMethod[] | undefined,
    serverBasePath: string,
    testFolderPath: string,
  ) {
    this.name = name;
    this.endpoint = endpoint;
    this.mockMethods = mockMethods;
    this.serverBasePath = serverBasePath;
    this.testFolderPath = testFolderPath;
  }

  private getHeadersBlock(headers: Record<string, string>): string {
    if (headers == null) return "";
    let headersBlock = "headers: {";
    for (const [key, value] of Object.entries(headers)) {
      if (typeof value === "string") {
        headersBlock += `"${key}": "${value}",`;
      } else {
        headersBlock += `"${key}": ${value},`;
      }
    }
    headersBlock += "},";
    return headersBlock;
  }

  private getDataBlock(data: Record<string, string>): string {
    if (data == null) return "";
    let dataBlock = "data: {";
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "string") {
        dataBlock += `"${key}": "${value}",`;
      } else {
        dataBlock += `"${key}": ${value},`;
      }
    }
    dataBlock += "},";
    return dataBlock;
  }

  private getValidateStatusBlock(validStatuses: number[]): string {
    if (validStatuses == null) return "";
    let statusBlock = "";
    validStatuses.forEach((status) => {
      statusBlock += `|| status === ${status}`;
    });

    let result = `validateStatus: function (status) {`;
    result += `return (status >= 200 && status < 300) ${statusBlock};`;
    result += `},`;
    return result;
  }

  private getParamsBlock(params: Record<string, string>): string {
    if (params == null) return "";
    let paramsBlock = "params: {";
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string") {
        paramsBlock += `"${key}": \`${value}\`,`;
      } else if (Array.isArray(value)) {
        paramsBlock += `"${key}": [`;
        for (const val of [...value]) {
          if (typeof val === "string") {
            paramsBlock += `\`${val}\`,`;
          } else {
            paramsBlock += `${val},`;
          }
        }
        paramsBlock += "],";
      } else {
        paramsBlock += `"${key}": ${value},`;
      }
    }
    paramsBlock += "},";
    return paramsBlock;
  }

  private getResponseHeadersBlock(headers: Record<string, string>): string {
    let responseHeaderBlock = "";
    for (const [key, value] of Object.entries(headers)) {
      if (typeof value === "string") {
        responseHeaderBlock += `assert.strictEqual(response.headers["${key}"], "${value}");`;
      } else {
        responseHeaderBlock += `assert.strictEqual(response.headers["${key}"], ${value});`;
      }
    }
    return responseHeaderBlock;
  }

  private getRequestBodyBlock(requestBody: any, method: HttpMethod, config: any): string {
    if (method === "post" && requestBody === undefined) return "";
    if (requestBody == null) return `requestBody: {},`;

    if (
      config &&
      config.headers &&
      ["image/png", "application/octet-stream"].includes(config.headers["Content-Type"])
    ) {
      return `requestBody: readFileSync(\`\${__dirname}/${requestBody}\`),`;
    }

    if (typeof requestBody !== "object") {
      if (typeof requestBody === "string") {
        return `requestBody: \`${requestBody}\`,`;
      } else {
        return `requestBody: ${requestBody},`;
      }
    }
    return `requestBody: ${JSON.stringify(requestBody)},`;
  }

  private getImportContents(): string {
    return `
      import { assert, beforeAll, describe, it } from "vitest";
      import { fileURLToPath } from "url";
      import { readFileSync } from "fs";
      import path from "path";
      import { makeServiceCall, SERVICE_CALL_TYPE, uint8ArrayToString } from "./helper.js";
      import * as dotenv from "dotenv";
    `;
  }

  private getGlobalDeclarationContents(): string {
    return `
      dotenv.config();
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
    `;
  }

  private getDescribeContents(): string {
    return `describe("${this.name} endpoint", () => {
        let serverBasePath;
        beforeAll(() => {
          serverBasePath = process.env["SERVER_BASE_PATH"];
        });
        ${this.getTestCasesContent()}
    });`;
  }

  private getConfigContent(mockMethod: MockMethod): string {
    if (mockMethod.request.config) {
      return `config: {
        ${this.getHeadersBlock(mockMethod.request.config.headers)}
        ${this.getValidateStatusBlock(mockMethod.request.config.validStatuses)}
        ${this.getParamsBlock(mockMethod.request.config.params)}
        ${this.getDataBlock(mockMethod.request.config.data)}
      }`;
    } else {
      return `config: {}`;
    }
  }

  private getOptionsContent(mockMethod: MockMethod): string {
    return `options: {
      ${this.getRequestBodyBlock(mockMethod.request.body, mockMethod.method, mockMethod.request.config)}
      ${this.getConfigContent(mockMethod)}
    }`;
  }

  private getResponseContent(mockMethod: MockMethod): string {
    return `const response = await makeServiceCall(SERVICE_CALL_TYPE.${mockMethod.method}, {
        endPoint,
        ${this.getOptionsContent(mockMethod)}
    });`;
  }

  private getHelperCodeContent(mockMethod: MockMethod): string {
    let helperCodeContent: string = "";
    if (mockMethod.response.headers !== undefined) {
      if (mockMethod.response.headers["operation-location"] !== undefined) {
        mockMethod.response.headers = {
          ...mockMethod.response.headers,
          "operation-location": `${this.serverBasePath}${mockMethod.response.headers["operation-location"]}`,
        };
      }
    }
    if (mockMethod.response.data !== undefined) {
      if (mockMethod.response.data["nextLink"] !== undefined) {
        mockMethod.response.data = {
          ...mockMethod.response.data,
          nextLink: `${this.serverBasePath}${mockMethod.response.data["nextLink"]}`,
        };
      }
      if (mockMethod.response.data["systemData"]) {
        delete mockMethod.response.data["systemData"]["createdAt"];
        delete mockMethod.response.data["systemData"]["lastModifiedAt"];
        helperCodeContent += `delete response.data["systemData"]["createdAt"];`;
        helperCodeContent += `delete response.data["systemData"]["lastModifiedAt"];`;
      }

      if (mockMethod.response.data["value"] && Array.isArray(mockMethod.response.data["value"])) {
        helperCodeContent += `if(response.data.value !== undefined && Array.isArray(response.data.value)){
          for(const val of response.data.value){
            if(val["systemData"] !== undefined){
              delete val["systemData"]["createdAt"];
              delete val["systemData"]["lastModifiedAt"];
            }
          }
          }`;
      }
    }
    return helperCodeContent;
  }

  private getAssertContent(mockMethod: MockMethod): string {
    let assertContent = `assert.strictEqual(response.status, ${mockMethod.response.status});`;
    if (mockMethod.response.data !== undefined) {
      if (
        this.endpoint.endsWith(`response/custom-content-type`) ||
        this.endpoint.endsWith(`response/octet-stream`) ||
        (this.endpoint.endsWith(`/content-negotiation/different-body`) &&
          mockMethod.request.config &&
          mockMethod.request.config.headers &&
          mockMethod.request.config.headers["accept"] === "application/json") ||
        (mockMethod.request.config &&
          mockMethod.request.config.headers &&
          ["image/png", "image/jpeg"].includes(mockMethod.request.config.headers["accept"]))
      ) {
        assertContent += `assert.strictEqual(${mockMethod.response.data});`;
      } else if (
        mockMethod.response.data.contentType !== undefined &&
        mockMethod.response.data.contentType === "application/xml"
      ) {
        assertContent += `assert.deepEqual(response.data, \`${mockMethod.response.data.rawContent}\`);`;
      } else if (mockMethod.response.data.rawContent !== undefined) {
        assertContent += `assert.deepEqual(JSON.stringify(response.data), ${JSON.stringify(mockMethod.response.data.rawContent)});`;
      } else {
        assertContent += `assert.deepEqual((response.data), ${JSON.stringify(mockMethod.response.data)});`;
      }
    }
    if (mockMethod.response.headers !== undefined) {
      assertContent += this.getResponseHeadersBlock(mockMethod.response.headers);
    }
    return assertContent;
  }

  private getTestCaseContent(mockMethod: MockMethod): string {
    return `const endPoint = \`\${serverBasePath}${this.endpoint}\`;
      ${this.getResponseContent(mockMethod)}
      ${this.getHelperCodeContent(mockMethod)}
      ${this.getAssertContent(mockMethod)}
    `;
  }

  private getTestCasesContent(): string {
    if (!this.mockMethods) return "";
    let testCasesContent = "";
    let counter = 0;
    for (const mockMethod of this.mockMethods) {
      testCasesContent += `it("Test Case ${counter + 1}", async () => {
        ${this.getTestCaseContent(mockMethod)}
      });`;
      counter++;
    }
    return testCasesContent;
  }

  private getFileContents(): string {
    return `${this.getImportContents()}\n${this.getGlobalDeclarationContents()}\n${this.getDescribeContents()}`;
  }

  public async generateFile() {
    const fileName = `${this.testFolderPath}/${this.name}.spec.js`;
    fs.writeFileSync(fileName, `${this.getFileContents()}`, {
      encoding: "utf-8",
    });
  }
}

function createDirectory(directoryName: string) {
  directoryName = path.resolve(`./${directoryName}`);
  if (!fs.existsSync(directoryName)) {
    fs.mkdirSync(directoryName);
  }
}

function clearTestCases(directoryName: string) {
  fs.readdirSync(path.resolve(`./${directoryName}`)).forEach((file) => {
    if (file.endsWith(`.spec.js`)) {
      fs.unlinkSync(path.resolve(`./${directoryName}/${file}`));
    }
  });
}

function copyHelperFile(sourceFile: string, destinationFile: string) {
  fs.copyFileSync(path.resolve(sourceFile), path.resolve(destinationFile));
}

function copyHelperFiles(directoryName: string, scenariosPath: string) {
  copyHelperFile(
    `${scenariosPath}/../dist/http/helper-server-test.js`,
    `${directoryName}/helper.js`,
  );
  copyHelperFile(`${scenariosPath}/../assets/image.jpg`, `${directoryName}/image.jpg`);
  copyHelperFile(`${scenariosPath}/../assets/image.png`, `${directoryName}/image.png`);
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
  // 2. Check and create temp folder
  const directoryName = "temp";
  createDirectory(directoryName);
  // 3. Clear all test cases in the temp folder
  clearTestCases(directoryName);
  // 4. Load all the scenarios
  const scenarios = await loadScenarioMockApis(scenariosPath);
  // 5. For each scenario, generate the test files
  for (const [name, scenario] of Object.entries(scenarios)) {
    for (const endpoint of scenario.apis) {
      if (endpoint.method !== undefined) continue;
      if (testCasesToRun.length === 0 || testCasesToRun.includes(name)) {
        const obj: ServerTestsGenerator = new ServerTestsGenerator(
          name,
          endpoint.uri,
          endpoint.mockMethods,
          serverBasePath,
          path.resolve(`./${directoryName}`),
        );
        await obj.generateFile();
      }
    }
  }
  // 6. Copy the helper files to the temp
  copyHelperFiles(directoryName, scenariosPath);
  // 7. Execute the tests
  await executeServerTest(path.resolve(`./${directoryName}`), serverBasePath);
}

async function executeServerTest(testFolderPath: string, serverBasePath: string) {
  try {
    const command = `pnpm cross-env SERVER_BASE_PATH=${serverBasePath} TS_NODE_PROJECT=tsconfig.json vitest -r ${testFolderPath} --sequence.shuffle.tests=false run`;
    await executeCommand(command);
  } catch (error) {
    logger.error("Error executing tests", error);
    throw error;
  }
}

function executeCommand(command: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        logger.error("Error executing tests", error);
        reject(error);
      }
      if (stderr) {
        logger.error("Error executing tests", stderr);
        reject(stderr);
      }
      logger.info("Tests executed successfully");
      logger.info(`${stdout}`);
      resolve();
    });
  });
}
