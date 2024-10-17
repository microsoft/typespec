import {
  Interface,
  isDeclaredInNamespace,
  isTemplateDeclaration,
  listServices,
  Namespace,
  navigateProgram,
  Operation,
  Program,
} from "@typespec/compiler";
import { getScenarioDoc, getScenarioName } from "./decorators.js";
import { reportDiagnostic } from "./lib.js";

export function $onValidate(program: Program) {
  const services = listServices(program);
  navigateProgram(program, {
    operation: (operation) => {
      if (
        (operation.interface && isTemplateDeclaration(operation.interface)) ||
        isTemplateDeclaration(operation)
      ) {
        return;
      }
      //  If the scenario is not defined in one of the scenario service then we can ignore it.
      if (!services.some((x) => isDeclaredInNamespace(operation, x.type))) {
        return;
      }
      const scenarioType = checkIsInScenario(program, operation);
      if (!scenarioType) {
        reportDiagnostic(program, { code: "missing-scenario", target: operation });
      } else {
        const doc = getScenarioDoc(program, scenarioType);
        if (doc === undefined) {
          reportDiagnostic(program, { code: "missing-scenario-doc", target: scenarioType });
        }
      }
    },
  });
}

function checkIsInScenario(
  program: Program,
  type: Operation | Interface | Namespace,
): Operation | Interface | Namespace | undefined {
  if (getScenarioName(program, type)) {
    return type;
  }
  if (type.kind === "Operation" && type.interface) {
    return checkIsInScenario(program, type.interface);
  }
  if (type.namespace === undefined) {
    return undefined;
  }
  return checkIsInScenario(program, type.namespace);
}
