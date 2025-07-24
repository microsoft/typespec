import { Interface, Namespace, Program } from "@typespec/compiler";
import { useStateMap, useStateSet } from "@typespec/compiler/utils";
import {
  ClientDecorator,
  ClientDecoratorOptions,
} from "../../generated-defs/TypeSpec.HttpClient.js";
import { createStateSymbol } from "../lib.js";
import { setClientName } from "./client-name.js";

export const explicitClientsStateSymbol = createStateSymbol("explicit-clients");
const [isExplicitClient, addExplicitclient, explicitClientsSet] = useStateSet<
  Interface | Namespace
>(explicitClientsStateSymbol);

export const explicitClientsScopes = createStateSymbol("explicit-clients-scopes");
const [getExplicitClientScopes, setExplicitClientScopes] = useStateMap<
  Namespace | Interface,
  Set<string>
>(explicitClientsScopes);

export { isExplicitClient as getExplicitClient, getExplicitClientScopes };

export function listExplicitClients(
  program: Program,
  options: { emitterScope?: string } = {},
): (Namespace | Interface)[] {
  const explicitClients: (Namespace | Interface)[] = [];

  for (const explicitClient of explicitClientsSet(program)) {
    const scopes = getExplicitClientScopes(program, explicitClient);
    if (!scopes || scopes.size === 0 || scopes.has(options.emitterScope ?? "")) {
      explicitClients.push(explicitClient);
    }
  }

  return explicitClients;
}

export const $client: ClientDecorator = (context, target, options: ClientDecoratorOptions = {}) => {
  addExplicitclient(context.program, target);

  // Set the scope filters
  if (options.emitterScope) {
    const existingScopes = getExplicitClientScopes(context.program, target);
    if (existingScopes) {
      // Update the existing scopes
      existingScopes.add(options.emitterScope);
    } else {
      setExplicitClientScopes(context.program, target, new Set([options.emitterScope]));
    }
  }

  // Set the client name if provided
  if (options.name) {
    setClientName(context.program, target, options.emitterScope, options.name);
  }
};
