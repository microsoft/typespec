import { Model, ModelProperty, Operation, Union } from "@typespec/compiler";
import {
  unsafe_mutateSubgraph as mutateSubgraph,
  unsafe_Mutator as Mutator,
  unsafe_MutatorFlow as MutatorFlow,
  unsafe_MutatorRecord,
} from "@typespec/compiler/experimental";
import { $ } from "@typespec/compiler/experimental/typekit";

/**
 * Prepares operation for client representation. This includes adding an options bag for optional parameters.
 * @param operation operation to be prepared
 * @returns the prepared operation
 */
export function prepareOperation(operation: Operation): Operation {
  return mutateSubgraph($.program, [httpParamsMutator], operation).type as Operation;
}

/**
 * Mutates anonymous types to be named.
 */
const anonymousMutatorRecord: unsafe_MutatorRecord<Model | Union> = {
  filter(t) {
    return MutatorFlow.MutateAndRecur;
  },
  mutate(t, clone) {
    if (!clone.name) {
      clone.name = $.type.getPlausibleName(clone);
    }
  },
};

export const anonymousMutator: Mutator = {
  name: "Anonymous types",
  Model: anonymousMutatorRecord,
  Union: anonymousMutatorRecord,
};

/**
 * Mutates the operation so that the parameters model is split into required and optional parameters.
 */
export const httpParamsMutator: Mutator = {
  name: "Http parameters",
  Operation: {
    filter() {
      return MutatorFlow.DoNotRecur;
    },
    mutate(o, clone, _program, realm) {
      const httpOperation = $.httpOperation.get(o);
      const returnType = $.httpOperation.getReturnType(httpOperation);
      clone.returnType = returnType;
      const params = $.httpRequest.getParameters(httpOperation, [
        "query",
        "header",
        "path",
        "body",
        "contentType",
      ]);

      if (!params) {
        return;
      }

      clone.parameters = params;

      const optionals = [...clone.parameters.properties.values()]
        .filter((p) => p.optional)
        .reduce(
          (acc, prop) => {
            acc[prop.name] = prop;
            return acc;
          },
          {} as Record<string, ModelProperty>,
        );

      const optionsBag = $.model.create({
        properties: optionals,
      });

      const optionsProp = $.modelProperty.create({
        name: "options",
        type: optionsBag,
        optional: true,
      });

      for (const [key, prop] of clone.parameters.properties) {
        if (prop.optional || isConstantHeader(prop)) {
          clone.parameters.properties.delete(key);
        }
      }

      if (Object.keys(optionals).length > 0) {
        clone.parameters.properties.set("options", optionsProp);
      }
    },
  },
};

export function isConstantHeader(modelProperty: ModelProperty) {
  if (!$.modelProperty.isHttpHeader(modelProperty)) {
    return false;
  }

  if ("value" in modelProperty.type && modelProperty.type.value !== undefined) {
    return true;
  }

  return false;
}
