import { Diagnostic, DiagnosticResult, ModelProperty, Program } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { getServers } from "@typespec/http";
import { ClientInitialization, ClientV2 } from "./interfaces.js";
import { getService } from "./utils/client-server-helpers.js";

export function resolveClientInitialization(
  program: Program,
  client: ClientV2,
): DiagnosticResult<ClientInitialization> {
  const diagnostics: Diagnostic[] = [];

  const parameters: ModelProperty[] = [];

  parameters.push(...resolveEndpoint(program, client));

  return [
    {
      kind: "ClientInitialization",
      parameters,
    },
    diagnostics,
  ];
}

/**
 * Resolves the endpoint parameters for a client.
 * If the client has a server, it will use the server's URL as the default value
 * and include any server parameters.
 * If there is no server, it will add an `endpoint` parameter that must be provided
 * when initializing the client.
 * @param program
 * @param client
 * @returns
 */
function resolveEndpoint(program: Program, client: ClientV2): ModelProperty[] {
  const clientService = getService(program, client);
  const parameters: ModelProperty[] = [];

  const servers = clientService ? getServers(program, clientService.type) : undefined;
  if (!servers) {
    // When there is no server, clients need to take an endpoint parameter
    parameters.push(
      $(program).modelProperty.create({ name: "endpoint", type: $(program).builtin.string }),
    );
  } else {
    for (const server of servers) {
      parameters.push(
        $(program).modelProperty.create({
          name: "endpoint",
          type: $(program).builtin.string,
          defaultValue: $(program).value.createString(server.url),
          optional: true,
        }),
      );

      parameters.push(...server.parameters.values());
    }
  }

  return parameters;
}
