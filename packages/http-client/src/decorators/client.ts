import { Interface, Namespace, Operation } from "@typespec/compiler";
import { useStateMap } from "@typespec/compiler/utils";
import {
  ClientDecorator,
  ClientDecoratorOptions,
  ClientLocationDecorator,
} from "../../generated-defs/TypeSpec.HttpClient.js";
import { createStateSymbol } from "../lib.js";

const [getExplicitClient, setExplicitClient, explicitClients] = useStateMap<
  Interface | Namespace,
  ClientDecoratorOptions
>(createStateSymbol("explicit-clients"));

export { explicitClients, getExplicitClient };

export const $client: ClientDecorator = (context, target, options: ClientDecoratorOptions = {}) => {
  setExplicitClient(context.program, target, options);
};

const [getClientLocation, setClientLocation] = useStateMap<Operation, Interface | Namespace>(
  createStateSymbol("client-locations"),
);

const [getRelocatedOperations, setRelocatedOperations] = useStateMap<
  Interface | Namespace,
  Set<Operation>
>(createStateSymbol("client-location-operations"));

export { getClientLocation, getRelocatedOperations };

export const $clientLocation: ClientLocationDecorator = (context, source, target) => {
  setClientLocation(context.program, source, target);

  // Track relationship from container to relocated operations
  let relocatedOperations = getRelocatedOperations(context.program, target);
  if (!relocatedOperations) {
    relocatedOperations = new Set();
    setRelocatedOperations(context.program, target, relocatedOperations);
  }

  relocatedOperations.add(source);
};
