import { createContext, useContext } from "@alloy-js/core";
import {
  EmitContext,
  Mutator,
  MutatorFlow,
  Operation,
  Type,
  getDoc,
  isIntrinsicType,
  mutateSubgraph,
} from "@typespec/compiler";
import { getShortName, hasShortName, isInvertable, isPositional, listClis } from "./decorators.js";

export const HelperContext = createContext<ReturnType<typeof getStateHelpers>>();

export function useHelpers() {
  return useContext(HelperContext)!;
}

export function getStateHelpers(context: EmitContext) {
  return {
    string: {
      is(type: Type) {
        if (type.kind !== "Scalar") return false;
        return isIntrinsicType(context.program, type, "string");
      },
    },
    option: {
      hasShortName: hasShortName.bind(undefined, context),
      getShortName: getShortName.bind(undefined, context),
      isPositional: isPositional.bind(undefined, context),
      isInvertable: isInvertable.bind(undefined, context),
    },
    boolean: {
      is(type: Type) {
        if (type.kind !== "Scalar") return false;
        return isIntrinsicType(context.program, type, "boolean");
      },
    },
    getDoc: getDoc.bind(undefined, context.program),
    listClis: listClis.bind(undefined, context),
    toOptionsBag(type: Operation) {
      return mutateSubgraph(context.program, [optionsBagMutator], type);
    },
  };
}

const optionsBagMutator: Mutator = {
  name: "Optionals in options bag",
  Model: {
    filter() {
      return MutatorFlow.DontRecurse;
    },
    mutate(m, clone, program, realm) {
      const optionals = [...clone.properties.values()].filter((p) => p.optional);

      if (optionals.length === 0) {
        return;
      }

      const optionsBag = realm.typeFactory.model("", optionals);
      const optionsProp = realm.typeFactory.modelProperty("options", optionsBag, {
        optional: true,
      });

      for (const [key, prop] of clone.properties) {
        if (prop.optional) {
          clone.properties.delete(key);
        }
      }

      clone.properties.set("options", optionsProp);
    },
  },
};
