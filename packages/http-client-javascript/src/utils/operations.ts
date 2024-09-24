import { ModelProperty, Operation } from "@typespec/compiler";
import {
  unsafe_mutateSubgraph as mutateSubgraph,
  unsafe_Mutator as Mutator,
  unsafe_MutatorFlow as MutatorFlow,
} from "@typespec/compiler/experimental";
import { $ } from "@typespec/compiler/typekit";

/**
 * Prepares operation for client representation. This includes adding an options bag for optional parameters.
 * @param operation operation to be prepared
 * @returns the prepared operation
 */
export function prepareOperation(operation: Operation): Operation {
  return mutateSubgraph($.program, [httpParamsMutator], operation).type as Operation;
}

/**
 * Mutates the operation so that the parameters model is split into required and optional parameters.
 */
const httpParamsMutator: Mutator = {
  name: "Http parameters",
  Operation: {
    filter() {
      return MutatorFlow.DoNotRecurse;
    },
    mutate(o, clone, _program, realm) {
      const httpOperation = $.httpOperation.get(o);
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

      if (Object.entries(optionals).length === 0) {
        return;
      }

      const optionsBag = $.model.create({
        properties: optionals,
      });

      const optionsProp = $.modelProperty.create({
        name: "options",
        type: optionsBag,
        optional: true,
      });

      for (const [key, prop] of clone.parameters.properties) {
        if (prop.optional) {
          clone.parameters.properties.delete(key);
        }
      }

      clone.parameters.properties.set("options", optionsProp);
    },
  },
};
