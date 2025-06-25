import "../dist/src/lib/tsp-index.js";

using TypeSpec.Reflection;

namespace TypeSpec.Spector;

alias ScenarioServiceOptions = {
  /**
   * Version enum that would be used on the $versioned decorator
   */
  versioned?: Enum;
};

/**
 * Setup the boilerplate for a scenario service(server endpoint, etc.)
 */
extern dec scenarioService(
  target: Namespace,
  route: valueof string,
  options?: ScenarioServiceOptions
);

/**
 * Mark an operation, interface or namespace as a scenario. All containing operations will be part of the same scenario.
 */
extern dec `scenario`(target: Namespace | Interface | Operation, name?: valueof string);

/**
 * Specify documentation on how to implement this scenario.
 * @param doc Documentation
 * @param formatArgs Format arguments
 */
extern dec scenarioDoc(
  target: Namespace | Interface | Operation,
  doc: valueof string,
  formatArgs?: Model
);
