import { Interface, Namespace, Operation } from "@typespec/compiler";
import { unsafe_MutatorFlow, unsafe_MutatorWithNamespace } from "@typespec/compiler/experimental";
import { useStateMap } from "@typespec/compiler/utils";
import { MutatorRecord } from "../../../compiler/dist/src/experimental/mutators.js";
import { getClientLocation, getRelocatedOperations } from "../decorators/client.js";
import { createStateSymbol } from "../lib.js";

export const clientLocationMutator: unsafe_MutatorWithNamespace = {
  name: "ClientLocationMutator",

  Interface: mutateClientLocation<Interface>(),
  Namespace: mutateClientLocation<Namespace>(),
};

const [getOperationMutations, setOperationMutations] = useStateMap<
  Interface | Namespace,
  [operationsToAdd: Set<Operation>, operationsToRemove: Set<Operation>]
>(createStateSymbol("client-location-mutations"));

function mutateClientLocation<
  TContainer extends Interface | Namespace,
>(): MutatorRecord<TContainer> {
  return {
    filter: (container, program) => {
      const operationsToAdd = getRelocatedOperations(program, container) ?? new Set();
      const operationsToRemove: Set<Operation> = new Set();

      for (const operation of container.operations.values()) {
        const clientLocation = getClientLocation(program, operation);
        if (clientLocation && clientLocation !== container) {
          operationsToRemove.add(operation);
        }
      }

      setOperationMutations(program, container, [operationsToAdd, operationsToRemove]);
      if (operationsToAdd?.size === 0 && operationsToRemove.size === 0) {
        return unsafe_MutatorFlow.DoNotMutate;
      }

      return unsafe_MutatorFlow.MutateAndRecur;
    },
    mutate: (container, clone, program) => {
      const [operationsToAdd, operationsToRemove] = getOperationMutations(program, container) ?? [
        new Set(),
        new Set(),
      ];

      for (const operation of operationsToAdd) {
        clone.operations.set(operation.name, operation);
      }

      for (const operation of operationsToRemove) {
        clone.operations.delete(operation.name);
      }
    },
  };
}
