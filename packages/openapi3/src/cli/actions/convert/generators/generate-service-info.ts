import { TypeSpecServer, TypeSpecServiceInfo } from "../interfaces.js";
import { generateDocs } from "../utils/docs.js";
import { generateNamespaceName } from "../utils/generate-namespace-name.js";
import { toTspValues } from "../utils/tsp-values.js";
import { generateServers } from "./generate-servers.js";

export function generateServiceInformation(
  serviceInfo: TypeSpecServiceInfo,
  servers: TypeSpecServer[] = [],
): string {
  const definitions: string[] = [];

  const { name, doc, ...info } = serviceInfo;

  definitions.push(`
    @service(#{
      title: "${name}"
    })
    @info(${toTspValues(info)})
    `);

  if (doc) {
    definitions.push(generateDocs(doc));
  }

  if (servers.length > 0) {
    definitions.push(generateServers(servers));
  }

  definitions.push(`namespace ${generateNamespaceName(name)};`);

  return definitions.join("\n");
}
