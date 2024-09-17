import {
  KeyedMockApi,
  MockApi,
  PassByKeyScenario,
  PassOnCodeScenario,
  PassOnSuccessScenario,
} from "./types.js";

/**
 * Specify that the scenario should be a `pass` if all the endpoints are called and the API response with 2xx exit code.
 * @param apis Endpoint or List of endpoints for this scenario
 */
export function passOnSuccess(apis: MockApi | readonly MockApi[]): PassOnSuccessScenario {
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
export function passOnCode(code: number, apis: MockApi | readonly MockApi[]): PassOnCodeScenario {
  return {
    passCondition: "status-code",
    code,
    apis: Array.isArray(apis) ? apis : [apis],
  };
}

export interface WithKeysScenarioExpect<K extends string> {
  pass(api: KeyedMockApi<K>): PassByKeyScenario<K>;
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
