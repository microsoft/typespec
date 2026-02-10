import pc from "picocolors";
import type { ProgramSummary } from "./summary.js";

export function formatSummary(summary: ProgramSummary, pretty = true): string {
  const bold = pretty ? pc.bold : (value: string) => value;
  const dim = pretty ? pc.dim : (value: string) => value;
  const header = pretty ? pc.blue : (value: string) => value;
  const count = pretty ? pc.yellow : (value: string) => value;
  const lines: string[] = [];

  lines.push(`${bold(header("Services"))} (${count(String(summary.counts.services))})`);
  if (summary.services.length === 0) {
    lines.push(`- ${dim("(none)")}`);
  } else {
    for (const service of summary.services) {
      const displayName = service.title
        ? `${service.title} ${dim(`(${service.name})`)}`
        : service.name;
      lines.push(`- ${displayName} ${dim(`[${count(String(service.operations.length))} ops]`)}`);
    }
  }

  addGroup(lines, "Operations", summary.operations, dim, count, header);
  addGroup(lines, "Models", summary.types.models, dim, count, header);
  addGroup(lines, "Enums", summary.types.enums, dim, count, header);
  addGroup(lines, "Unions", summary.types.unions, dim, count, header);
  addGroup(lines, "Scalars", summary.types.scalars, dim, count, header);
  addGroup(lines, "Interfaces", summary.types.interfaces, dim, count, header);
  addGroup(lines, "Namespaces", summary.types.namespaces, dim, count, header);

  return lines.join("\n");
}

function addGroup(
  lines: string[],
  label: string,
  types: string[],
  dim: (value: string) => string,
  count: (value: string) => string,
  titleColor: (value: string) => string,
) {
  lines.push(`${titleColor(label)} (${count(String(types.length))})`);
  if (types.length === 0) {
    lines.push(`- ${dim("(none)")}`);
    return;
  }
  for (const type of types) {
    lines.push(`- ${type}`);
  }
}
