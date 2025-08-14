import { TypeSpecServer } from "../interfaces.js";

export function generateServers(servers: TypeSpecServer[]): string {
  if (!servers || servers.length === 0) {
    return "";
  }
  const definitions = servers.map((server) => {
    return `@server("${server.url}")`;
  });
  return definitions.join("\n");
}
