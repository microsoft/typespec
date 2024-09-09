try {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await import("source-map-support/register.js");
} catch {
  // package only present in dev.
}

import {
  createSourceLoader,
  logDiagnostics,
  NodeHost,
  normalizePath,
  printTypeSpecNode,
  SyntaxKind,
  type ImportStatementNode,
  type Statement,
  type TypeSpecScriptNode,
} from "@typespec/compiler";
import { resolve } from "path";
import pc from "picocolors";
import { parseArgs } from "util";
import { ImporterHost } from "./importer-host.js";

function log(...args: any[]) {
  // eslint-disable-next-line no-console
  console.log(...args);
}
const args = parseArgs({
  options: {},
  args: process.argv.slice(2),
  allowPositionals: true,
});

const rawEntrypoint = args.positionals[0];
const entrypoint =
  rawEntrypoint.startsWith("http://") || rawEntrypoint.startsWith("https://")
    ? rawEntrypoint
    : normalizePath(resolve(rawEntrypoint));

const loader = await createSourceLoader(ImporterHost);
await loader.importFile(entrypoint);

if (loader.resolution.diagnostics.length > 0) {
  logDiagnostics(loader.resolution.diagnostics, NodeHost.logSink);
  process.exit(1);
}

const errors = [];
const libraries = new Set<string>();

for (const [name, file] of loader.resolution.jsSourceFiles) {
  const locContext = loader.resolution.locationContexts.get(file.file)!;
  switch (locContext.type) {
    case "project":
      errors.push(`Importer doesn't support JS files in project: ${name}`);
      break;
    case "library":
      libraries.add(locContext.metadata.name);
      break;
    case "compiler":
    // do nothing
  }
}

const sourceFiles: TypeSpecScriptNode[] = [];
for (const file of loader.resolution.sourceFiles.values()) {
  const locContext = loader.resolution.locationContexts.get(file.file)!;
  switch (locContext.type) {
    case "project":
      sourceFiles.push(file);
      break;
    case "library":
      libraries.add(locContext.metadata.name);
      break;
    case "compiler":
    // do nothing
  }
}

const imports: Record<string, ImportStatementNode> = {};
const statements: Statement[] = [];

for (const file of sourceFiles) {
  let currentStatements = statements;
  for (const statement of file.statements) {
    switch (statement.kind) {
      case SyntaxKind.ImportStatement:
        if (!statement.path.value.startsWith(".")) {
          imports[statement.path.value] = statement;
        }
        break;
      case SyntaxKind.NamespaceStatement:
        let current = statement;
        const ids = [statement.id];
        while (current.statements && "kind" in current.statements) {
          current = current.statements;
          ids.push(current.id);
        }
        if (current.statements === undefined) {
          currentStatements = [];
          statements.push({ ...current, statements: currentStatements, ...({ ids } as any) });
        } else {
          currentStatements.push({ ...current, ...({ ids } as any) });
        }
        break;
      default:
        currentStatements.push(statement);
    }
  }
}

const newSourceFile: TypeSpecScriptNode = {
  kind: SyntaxKind.TypeSpecScript,
  statements: [...Object.values(imports), ...statements],
  comments: [],
  file: undefined as any,
  pos: 0,
  end: 0,
  parseOptions: sourceFiles[0].parseOptions,
  // Binder items
  usings: [],
  inScopeNamespaces: [],
  namespaces: [],
  parseDiagnostics: [],
  printable: true,
  id: undefined as any,
  flags: 0,
  symbol: undefined as any,
  locals: undefined as any,
};

const result = await printTypeSpecNode(newSourceFile);
console.log("Result:----\n", result);

if (errors.length > 0) {
  for (const error of errors) {
    log(pc.red(error));
  }
  process.exit(1);
}
