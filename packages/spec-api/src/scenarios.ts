import {
  KeyedMockApiDefinition,
  MockApiDefinition,
  PassByKeyScenario,
  PassOnCodeScenario,
  PassOnSuccessScenario,
} from "./types.js";

/**
 * Specify that the scenario should be a `pass` if all the endpoints are called and the API response with 2xx exit code.
 * @param apis Endpoint or List of endpoints for this scenario
 */
export function passOnSuccess(
  apis: MockApiDefinition | readonly MockApiDefinition[],
): PassOnSuccessScenario {
  return {
    passCondition: "response-success",
    apis: Array.isArray(apis) ? apis : [apis],
  };
}
/**
 * Specify that the scenario should be a `pass` if all the endpoints are called and the API response with the given exit code.
 * @param code Status code all endpoint should return
 * @param apis Endpoint or List of endpoints for this scenario
 */
export function passOnCode(code: number, apis: MockApiDefinition): PassOnCodeScenario {
  return {
    passCondition: "status-code",
    code,
    apis: Array.isArray(apis) ? apis : [apis],
  };
}

export interface WithKeysScenarioExpect<K extends string> {
  pass(api: KeyedMockApiDefinition<K>): PassByKeyScenario<K>;
}
/**
 * Specify a list of keys that must be hit to this scenario to pass
 * @param keys List of keys
 * @param api Mock api that in the MockResponse can return a pass key.
 */
export function withKeys<const K extends string>(keys: K[]): WithKeysScenarioExpect<K> {
  return {
    pass: (api) => {
      return {
        passCondition: "by-key",
        keys,
        apis: [api],
      };
    },
  };
}

export interface WithServiceKeysScenarioExpect<K extends string> {
  pass(api: KeyedMockApiDefinition<K> | KeyedMockApiDefinition<K>[]): PassByKeyScenario<K>;
}

export function withServiceKeys<const K extends string>(
  keys: K[],
): WithServiceKeysScenarioExpect<K> {
  return {
    pass: (api: KeyedMockApiDefinition<K> | KeyedMockApiDefinition<K>[]) => {
      return {
        passCondition: "by-key",
        keys,
        apis: Array.isArray(api) ? api : [api],
      };
    },
  };
}
