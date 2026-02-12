import { OpenAPI3Server, OpenAPI3ServerVariable } from "../../../../types.js";
import { TypeSpecServer, TypeSpecServerVariable } from "../interfaces.js";

function transformServerVariables(
  variables?: Record<string, OpenAPI3ServerVariable>,
): Record<string, TypeSpecServerVariable> | undefined {
  if (!variables) return undefined;

  const result: Record<string, TypeSpecServerVariable> = {};
  for (const [name, variable] of Object.entries(variables)) {
    result[name] = {
      default: variable.default,
      description: variable.description,
      enum: variable.enum ? [...variable.enum] : undefined,
    };
  }
  return result;
}

export function transformServers(servers: OpenAPI3Server[]): TypeSpecServer[] {
  return servers.map((server) => ({
    url: server.url,
    description: server.description,
    variables: transformServerVariables(server.variables),
  }));
}
