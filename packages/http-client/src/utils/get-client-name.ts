import { Program } from "@typespec/compiler";
import { Client, ClientNamePolicy } from "../interfaces.js";

export function applyNamePolicy(
  program: Program,
  client: Client,
  options: { clientNamePolicy?: ClientNamePolicy } = {},
): string {
  const clientName = client.type?.name ?? client.name;

  const clientNamer = options.clientNamePolicy;
  if (clientNamer === undefined) {
    return clientName;
  }

  return clientNamer(client);
}
