import { TypeSpecServer, TypeSpecServiceInfo, TypeSpecTagMetadata } from "../interfaces.js";
import { generateDocs } from "../utils/docs.js";
import { generateNamespaceName } from "../utils/generate-namespace-name.js";
import { toTspValues } from "../utils/tsp-values.js";
import { generateServers } from "./generate-servers.js";
import { generateTags } from "./generate-tags.js";

export function generateServiceInformation(
  serviceInfo: TypeSpecServiceInfo,
  servers: TypeSpecServer[] = [],
  tags: TypeSpecTagMetadata[] = [],
  namespaceName?: string,
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
  if (tags.length > 0) {
    definitions.push(generateTags(tags));
  }

  // Use provided namespace name, or fall back to generating from service name
  const namespace = (namespaceName && generateNamespaceName(namespaceName)) || generateNamespaceName(name);
  definitions.push(`namespace ${namespace};`);

  return definitions.join("\n");
}
