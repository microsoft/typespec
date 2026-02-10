import { getTypeName, listOperationsIn, listServices, type Program } from "@typespec/compiler";
import pc from "picocolors";

export interface ServiceSummary {
  name: string;
  title?: string;
  operations: string[];
}

export interface ProgramSummary {
  services: ServiceSummary[];
  operations: string[];
  counts: {
    services: number;
    operations: number;
  };
}

export function summarizeProgram(program: Program): ProgramSummary {
  const services = listServices(program).map((service) => {
    return {
      name: getTypeName(service.type),
      title: service.title,
      operations: listOperationsIn(service.type).map((op) => getTypeName(op)),
    };
  });

  const operations = listOperationsIn(program.getGlobalNamespaceType()).map((op) =>
    getTypeName(op),
  );

  return {
    services,
    operations,
    counts: {
      services: services.length,
      operations: operations.length,
    },
  };
}

export function formatSummary(summary: ProgramSummary, pretty = true): string {
  const bold = pretty ? pc.bold : (value: string) => value;
  const dim = pretty ? pc.dim : (value: string) => value;
  const lines: string[] = [];

  lines.push(`${bold("Services")} (${summary.counts.services})`);
  if (summary.services.length === 0) {
    lines.push(`- ${dim("(none)")}`);
  } else {
    for (const service of summary.services) {
      const displayName = service.title
        ? `${service.title} ${dim(`(${service.name})`)}`
        : service.name;
      lines.push(`- ${displayName} ${dim(`[${service.operations.length} ops]`)}`);
    }
  }

  lines.push("");
  lines.push(`${bold("Operations")} (${summary.counts.operations})`);
  if (summary.operations.length === 0) {
    lines.push(`- ${dim("(none)")}`);
  } else {
    for (const operation of summary.operations) {
      lines.push(`- ${operation}`);
    }
  }

  return lines.join("\n");
}
