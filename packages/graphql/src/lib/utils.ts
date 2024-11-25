import {
  walkPropertiesInherited,
  type Model,
  type ModelProperty,
  type Operation,
} from "@typespec/compiler";

export function propertiesEqual(
  prop1: ModelProperty,
  prop2: ModelProperty,
  ignoreNames: boolean = false,
): boolean {
  if (!ignoreNames && prop1.name !== prop2.name) {
    return false;
  }
  return prop1.type === prop2.type && prop1.optional === prop2.optional;
}

export function modelsEqual(model1: Model, model2: Model, ignoreNames: boolean = false): boolean {
  if (!ignoreNames && model1.name !== model2.name) {
    return false;
  }
  const model1Properties = new Set(walkPropertiesInherited(model1));
  const model2Properties = new Set(walkPropertiesInherited(model2));
  if (model1Properties.size !== model2Properties.size) {
    return false;
  }
  if (
    [...model1Properties].some(
      (prop) => ![...model2Properties].some((p) => propertiesEqual(prop, p, false)),
    )
  ) {
    return false;
  }
  return true;
}

export function operationsEqual(
  op1: Operation,
  op2: Operation,
  ignoreNames: boolean = false,
): boolean {
  if (!ignoreNames && op1.name !== op2.name) {
    return false;
  }
  return op1.returnType === op2.returnType && modelsEqual(op1.parameters, op2.parameters, true);
}
