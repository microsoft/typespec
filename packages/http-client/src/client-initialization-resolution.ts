import { Diagnostic, DiagnosticResult, Program } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
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
  const endpoints = [...resolveClientEndpoints(program, client)];
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
 * If no explicit servers are defined for the client, it will return a default endpoint to be set at client initialization.
 */
function* resolveClientEndpoints(program: Program, client: Client): Iterable<ClientEndpoint> {
  const clientService = getService(program, client);
  if (!clientService) {
    return;
  }
  const servers = getServers(program, clientService.type) ?? [];

  if (servers.length === 0) {
    yield {
      url: "{endpoint}",
      description: "No endpoints defined for this client.",
      parameters: new Map([
        [
          "endpoint",
          $(program).modelProperty.create({
            name: "endpoint",
            type: $(program).builtin.string,
            optional: false,
          }),
        ],
      ]),
    };
    return;
  }

  for (const endpoint of servers) {
    if (endpoint.parameters.size === 0) {
      yield {
        url: "{endpoint}",
        description: endpoint.description,
        parameters: new Map([
          [
            "endpoint",
            $(program).modelProperty.create({
              name: "endpoint",
              type: $(program).builtin.string,
              defaultValue: $(program).value.create(endpoint.url),
              optional: true,
            }),
          ],
        ]),
      };
      continue;
    }

    yield endpoint;
  }
}
