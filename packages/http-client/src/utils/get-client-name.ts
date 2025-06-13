import { Program } from "@typespec/compiler";
import { ClientNamePolicy, ClientV2 } from "../interfaces.js";
import { StateKeys } from "../lib.js";

export function getClientName(
  program: Program,
  client: ClientV2,
  options: { clientNamePolicy?: ClientNamePolicy } = {},
): string {
  const explicitClientState = program.stateMap(StateKeys.explicitClient);
  const clientName = explicitClientState.get(client.type)?.name ?? client.name;

  const clientNamer = options.clientNamePolicy;
  if (clientNamer === undefined) {
    return clientName;
  }

  return clientNamer(client);
}
