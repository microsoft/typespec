import { mutateSubgraph, Mutator, MutatorFlow, Operation } from "@typespec/compiler";
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
      return MutatorFlow.DontRecurse;
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

      const optionals = [...clone.parameters.properties.values()].filter((p) => p.optional);

      if (optionals.length === 0) {
        return;
      }

      const optionsBag = realm.typeFactory.model("", optionals);
      const optionsProp = realm.typeFactory.modelProperty("options", optionsBag, {
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
