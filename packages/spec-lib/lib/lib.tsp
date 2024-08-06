import "../dist/index.js";

using TypeSpec.Reflection;

alias ScenarioServiceOptions = {
  /**
   * Version enum that would be used on the $versioned decorator
   */
  versioned?: Enum;
};

/**
 * Setup the boilerplate for a scenario service(server endpoint, etc.)
 */
extern dec scenarioService(target: Namespace, route: string, options?: ScenarioServiceOptions);

/**
 * Mark an operation, interface or namespace as a scenario. All containing operations will be part of the same scenario.
 */
extern dec scenario(target: Namespace | Interface | Operation, name?: string);

/**
 * Specify which workflow this scenario is meant to be supported by
 */
extern dec supportedBy(target: Namespace, value: string);

/**
 * Specify documentation on how to implement this scenario.
 * @param doc Documentation
 * @param formatArgs Format arguments
 */
extern dec scenarioDoc(target: Namespace | Interface | Operation, doc: string, formatArgs?: {});
