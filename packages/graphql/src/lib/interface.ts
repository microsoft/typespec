import {
  type DecoratorContext,
  type DecoratorFunction,
  type Model,
  type ModelProperty,
  type Program,
  validateDecoratorTarget,
  validateDecoratorUniqueOnNode,
  walkPropertiesInherited,
} from "@typespec/compiler";

import { GraphQLKeys, NAMESPACE, reportDiagnostic } from "../lib.js";
import type { Tagged } from "../types.d.ts";
import { useStateMap, useStateSet } from "./state-map.js";

// This will set the namespace for decorators implemented in this file
export const namespace = NAMESPACE;

/** An Interface is a model that has been marked as an Interface */
type Interface = Tagged<Model, "interface">;

const [getInterface, setInterface] = useStateSet<Interface>(GraphQLKeys.interface);
const [getComposition, setComposition, _getCompositionMap] = useStateMap<Model, Interface[]>(
  GraphQLKeys.compose,
);

export {
  /**
   * Get the implemented interfaces for a given model
   * @param program Program
   * @param model Model
   * @returns Composed interfaces or undefined if no interfaces are composed.
   */
  getComposition,
};

/**
 * Check if the model is defined as a schema.
 * @param program Program
 * @param model Model
 * @returns Boolean
 */
export function isInterface(program: Program, model: Model | Interface): model is Interface {
  return !!getInterface(program, model as Interface);
}

function validateImplementedsAreInterfaces(context: DecoratorContext, interfaces: Model[]) {
  let valid = true;

  for (const iface of interfaces) {
    if (!isInterface(context.program, iface)) {
      valid = false;
      reportDiagnostic(context.program, {
        code: "invalid-interface",
        format: { interface: iface.name },
        target: context.decoratorTarget,
      });
    }
  }

  return valid;
}

function validateNoCircularImplementation(
  context: DecoratorContext,
  target: Model,
  interfaces: Interface[],
) {
  const valid = !isInterface(context.program, target) || !interfaces.includes(target);
  if (!valid) {
    reportDiagnostic(context.program, {
      code: "circular-interface",
      target: context.decoratorTarget,
    });
  }
  return valid;
}

function propertiesEqual(prop1: ModelProperty, prop2: ModelProperty): boolean {
  // TODO is there some canonical way to do this?
  return (
    prop1.name === prop2.name && prop1.type === prop2.type && prop1.optional === prop2.optional
  );
}

function validateImplementsInterfaceProperties(
  context: DecoratorContext,
  modelProperties: Map<string, ModelProperty>,
  iface: Interface,
) {
  let valid = true;

  for (const prop of walkPropertiesInherited(iface)) {
    if (!modelProperties.has(prop.name)) {
      valid = false;
      reportDiagnostic(context.program, {
        code: "missing-interface-property",
        format: { interface: iface.name, property: prop.name },
        target: context.decoratorTarget,
      });
    } else if (!propertiesEqual(modelProperties.get(prop.name)!, prop)) {
      valid = false;
      reportDiagnostic(context.program, {
        code: "incompatible-interface-property",
        format: { interface: iface.name, property: prop.name },
        target: context.decoratorTarget,
      });
    }
  }

  return valid;
}

function validateImplementsInterfacesProperties(
  context: DecoratorContext,
  target: Model,
  interfaces: Interface[],
) {
  let valid = true;
  const allModelProperties = new Map(
    [...walkPropertiesInherited(target)].map((prop) => [prop.name, prop]),
  );
  for (const iface of interfaces) {
    if (!validateImplementsInterfaceProperties(context, allModelProperties, iface)) {
      valid = false;
    }
  }
  return valid;
}

export const $Interface: DecoratorFunction = (context: DecoratorContext, target: Model) => {
  validateDecoratorTarget(context, target, "@Interface", "Model"); // TODO: Is this needed? https://github.com/Azure/cadl-azure/issues/1022
  validateDecoratorUniqueOnNode(context, target, $Interface);
  setInterface(context.program, target as Interface);
};

export const $compose: DecoratorFunction = (
  context: DecoratorContext,
  target: Model,
  ...interfaces: Interface[]
) => {
  validateDecoratorTarget(context, target, "@compose", "Model"); // TODO: Is this needed? https://github.com/Azure/cadl-azure/issues/1022
  validateImplementedsAreInterfaces(context, interfaces);
  validateNoCircularImplementation(context, target, interfaces);
  validateImplementsInterfacesProperties(context, target, interfaces);
  const existingCompose = getComposition(context.program, target);
  if (existingCompose) {
    interfaces = [...existingCompose, ...interfaces];
  }
  setComposition(context.program, target, interfaces);
};
