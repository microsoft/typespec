import { Fail, KeyedMockResponse, MockResponse, PassByKeyScenario,  ScenarioMockApi } from "@typespec/spec-api";
import { logger } from "../logger.js";
import { CoverageReport, ScenariosMetadata, ScenarioStatus } from "@typespec/spec-coverage-sdk";
import { writeFileSync } from "fs";
import { ScenariosAndScenariosMetadata } from "../app/app.js";

export class CoverageTracker {
  private scenarios: Record<string, ScenarioMockApi> = {};
  private scenariosAndScenariosMetaData: ScenariosAndScenariosMetadata[] = [];
  private hits = new Map<string, Map<string, MockResponse[]>>();

  public constructor(private coverageFile: string) {
    process.on("exit", () => {
      logger.info("Saving coverage");
      this.saveCoverageSync();
      logger.info("Coverage saved!");
    });
  }

  public setScenarios(scenariosMetadata: ScenariosMetadata, scenarios: Record<string, ScenarioMockApi>): void;
  public setScenarios(scenariosAndScenariosMetaData: ScenariosAndScenariosMetadata[]): void;

  public setScenarios(arg1: ScenariosMetadata | ScenariosAndScenariosMetadata[], arg2?: Record<string, ScenarioMockApi>) {
    if (arg1 instanceof Array === false && arg2 !== undefined) {
      this.scenariosAndScenariosMetaData = [
        {
          scenariosMetadata: arg1,
          scenarios: arg2,
        }
      ];
    } else {
      this.scenariosAndScenariosMetaData = arg1 as ScenariosAndScenariosMetadata[];
      for (const {scenarios} of this.scenariosAndScenariosMetaData) {
        this.scenarios = {...this.scenarios, ...scenarios};
      }
    }
  }

  public async trackEndpointResponse(scenarioName: string, endpoint: string, response: MockResponse) {
    let scenarioHits = this.hits.get(scenarioName);
    if (scenarioHits === undefined) {
      scenarioHits = new Map();
      this.hits.set(scenarioName, scenarioHits);
    }

    let responses = scenarioHits.get(endpoint);
    if (responses === undefined) {
      responses = [];
      scenarioHits.set(endpoint, responses);
    }
    responses.push(response);
  }

  public computeCoverage(): CoverageReport[] {
    const coverageReports:CoverageReport[] = [];
    for(const {scenarios, scenariosMetadata} of this.scenariosAndScenariosMetaData) {
      const results: Record<string, ScenarioStatus> = {};
      for (const [name, mockApi] of Object.entries(scenarios)) {
        results[name] = this.computeScenarioStatus(name, mockApi);        
      }
      coverageReports.push({
        scenariosMetadata: scenariosMetadata,
        results,
        createdAt: new Date().toISOString(),
      })
    }
    return coverageReports;
  }

  private saveCoverageSync() {
    const coverage = this.computeCoverage();

    try {
      writeFileSync(this.coverageFile, JSON.stringify(coverage, null, 2));
    } catch (e) {
      logger.warn("Error while saving coverage", e);
    }
  }

  private computeScenarioStatus(name: string, mockApi: ScenarioMockApi): ScenarioStatus {
    const scenarioHits = this.hits.get(name);
    switch (mockApi.passCondition) {
      case "response-success":
        return checkAll((x) => x.status >= 200 && x.status < 300);
      case "status-code":
        return checkAll((x) => x.status === mockApi.code);
      case "by-key":
        return checkByKeys(mockApi);
      default:
        const _assertNever: never = mockApi;
        throw new Error("Unreachable");
    }

    function checkAll(condition: (res: MockResponse) => boolean): ScenarioStatus {
      for (const endpoint of mockApi.apis) {
        const hits = scenarioHits?.get(endpoint.uri);
        if (hits === undefined) {
          return "not-implemented";
        }

        if (!condition(hits[hits.length - 1])) {
          return "fail";
        }
      }

      return "pass";
    }

    function checkByKeys(scenario: PassByKeyScenario) {
      for (const endpoint of scenario.apis) {
        const hits = scenarioHits?.get(endpoint.uri);
        if (hits === undefined) {
          return "not-implemented";
        }
        const keys = new Set(scenario.keys);

        for (const hit of hits) {
          if (!isKeyedMockResponse(hit)) {
            continue;
          }

          if (hit.pass === Fail) {
            return "fail";
          }
          keys.delete(hit.pass);
        }

        if (keys.size === 0) {
          return "pass";
        } else {
          return "fail";
        }
      }
      return "fail";
    }
  }
}

function isKeyedMockResponse(response: MockResponse): response is KeyedMockResponse {
  return "pass" in response;
}
