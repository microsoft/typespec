import type {
  KeyedMockApiDefinition,
  MockApiDefinition,
  PassByKeyScenario,
  PassOnCodeScenario,
  PassOnSuccessScenario,
} from "./types.js";

/**
 * Builds a scenario requiring a recorded 2xx response for every endpoint URI.
 * Coverage uses the latest recorded response for each URI.
 * @param apis Endpoint or list of endpoints to register for the scenario.
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
 * Builds a scenario whose endpoint's latest recorded response must have the given HTTP status.
 * Use this for expected error responses as well as success responses.
 * @param code Required HTTP response status.
 * @param apis Endpoint to register for the scenario.
 */
export function passOnCode(code: number, apis: MockApiDefinition): PassOnCodeScenario {
  return {
    passCondition: "status-code",
    code,
    apis: Array.isArray(apis) ? apis : [apis],
  };
}

/** Binds required coverage keys to a single endpoint whose handler reports those keys. */
export interface WithKeysScenarioExpect<K extends string> {
  /** Creates scenario metadata for the endpoint without wrapping or invoking its handler. */
  pass(api: KeyedMockApiDefinition<K>): PassByKeyScenario<K>;
}
/**
 * Starts a keyed scenario definition. Handlers report individual keys through their
 * responses' `pass` field; returning Fail explicitly marks a keyed failure.
 * Call `.pass(api)` on the returned builder to attach the endpoint.
 * @param keys Required coverage keys, retained by reference in the resulting scenario.
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

/** Binds required coverage keys to one or more keyed endpoints for a service scenario. */
export interface WithServiceKeysScenarioExpect<K extends string> {
  /** Creates scenario metadata, retaining a supplied endpoint array rather than copying it. */
  pass(api: KeyedMockApiDefinition<K> | KeyedMockApiDefinition<K>[]): PassByKeyScenario<K>;
}

/**
 * Starts a keyed scenario definition that can register multiple service endpoints.
 * Call `.pass(api)` or `.pass(apis)` to attach handlers that return coverage keys.
 * @param keys Required coverage keys, retained by reference in the resulting scenario.
 */
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
