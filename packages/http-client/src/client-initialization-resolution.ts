import { Diagnostic, DiagnosticResult, Program } from "@typespec/compiler";
import { getServers } from "@typespec/http";
import { Client, ClientEndpoint, ClientInitialization } from "./interfaces.js";
import { resolveClientAuthentication } from "./utils/auth-resolution.js";
import { getService } from "./utils/client-server-helpers.js";

export function resolveClientInitialization(
  program: Program,
  client: Client,
): DiagnosticResult<ClientInitialization> {
  const diagnostics: Diagnostic[] = [];
  const authentication = resolveClientAuthentication(program, client);
  const endpoints = resolveClientEndpoints(program, client);
  return [
    {
      kind: "ClientInitialization",
      endpoints,
      authentication,
    },
    diagnostics,
  ];
}

/**
 * Resolves the Servers for a client. Servers have the information about the endpoint and any parameters they need.
 */
function resolveClientEndpoints(program: Program, client: Client): ClientEndpoint[] | undefined {
  const clientService = getService(program, client);
  if (!clientService) {
    return undefined;
  }
  const endpoints = getServers(program, clientService.type) ?? [];

  if (endpoints.length === 0) {
    endpoints.push({
      url: "{endpoint}",
      description: "No endpoints defined for this client.",
      parameters: new Map(),
    });
  }
  return endpoints;
}
