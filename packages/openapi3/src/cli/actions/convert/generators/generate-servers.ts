import { TypeSpecServer, TypeSpecServerVariable } from "../interfaces.js";
import { generateDocs } from "../utils/docs.js";
import { stringLiteral } from "./common.js";

function generateServerVariable(variableName: string, variable: TypeSpecServerVariable): string {
  const { default: defaultValue, description, enum: enumValues } = variable;
  const enumString = enumValues ? `${enumValues.map((x) => `"${x}"`).join(" | ")}` : "";
  return `
    ${description ? generateDocs(description) + "\n" : ""}
    ${variableName}: ${enumString || "string"}${defaultValue ? ` = "${defaultValue}"` : ""},
  `;
}
function generateServerVariables(variables: Record<string, TypeSpecServerVariable>): string {
  return Object.entries(variables)
    .map(([name, variable]) => generateServerVariable(name, variable))
    .join("\n");
}

export function generateServers(servers: TypeSpecServer[]): string {
  if (!servers || servers.length === 0) {
    return "";
  }
  const definitions = servers.map((server) => {
    const variables =
      server.variables && Object.keys(server.variables).length > 0
        ? `, {
        ${generateServerVariables(server.variables)}
      }`
        : "";
    const description = server.description
      ? `, ${stringLiteral(server.description)}`
      : variables
        ? `, ""`
        : "";
    return `@server(${stringLiteral(server.url)}${description}${variables})`;
  });
  return definitions.join("\n");
}
