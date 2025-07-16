import {
  normalizePath,
  NoTarget,
  printTypeSpecNode,
  type CompilerHost,
  type Diagnostic,
  type Statement,
} from "@typespec/compiler";
import {
  createSourceLoader,
  SyntaxKind,
  visitChildren,
  type IdentifierNode,
  type ImportStatementNode,
  type MemberExpressionNode,
  type TypeSpecScriptNode,
  type UsingStatementNode,
} from "@typespec/compiler/ast";

export interface ImportResult {
  /** TypeSpec Content */
  readonly content?: string;
  /** Diagnostics */
  readonly diagnostics: readonly Diagnostic[];
}

/**
 * Combine a TypeSpec project into a single file.
 * Supports importing files from http/https with limitations:
 * - directory import are not supported
 * - different files that would result in merging ambiguous using statements will have conflict
 * @param rawEntrypoint TypeSpec project entrypoint
 */
export async function combineProjectIntoFile(
  host: CompilerHost,
  rawEntrypoint: string,
): Promise<ImportResult> {
  const entrypoint =
    rawEntrypoint.startsWith("http://") || rawEntrypoint.startsWith("https://")
      ? rawEntrypoint
      : normalizePath(rawEntrypoint);

  const loader = await createSourceLoader(host, {
    externals: (path: string) => {
      return !(path === entrypoint || path.startsWith("."));
    },
  });
  await loader.importFile(entrypoint, NoTarget);

  if (loader.resolution.diagnostics.length > 0) {
    return { diagnostics: loader.resolution.diagnostics };
  }

  const diagnostics: Diagnostic[] = [];
  const libraries = new Set<string>();

  for (const [name, file] of loader.resolution.jsSourceFiles) {
    const locContext = loader.resolution.locationContexts.get(file.file)!;
    switch (locContext.type) {
      case "project":
        diagnostics.push({
          severity: "error",
          code: "no-js",
          message: `Importer doesn't support JS files in project: ${name}`,
          target: { file: file.file, pos: 0, end: 0 },
        });
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
  const usings: Record<string, UsingStatementNode> = {};
  const statements: Statement[] = [];

  for (const file of sourceFiles) {
    addNodeText(file);

    function addNodeText(node: any) {
      (node as any).rawText = file.file.text.slice(node.pos, node.end);
      visitChildren(node, addNodeText);
    }

    let currentStatements = statements;
    for (const statement of file.statements) {
      switch (statement.kind) {
        case SyntaxKind.ImportStatement:
          if (!statement.path.value.startsWith(".")) {
            imports[statement.path.value] = statement;
          }
          break;
        case SyntaxKind.UsingStatement:
          const name = printIdOrMember(statement.name);
          if (!(name in usings)) {
            usings[name] = statement;
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

  const newSourceFile = {
    kind: SyntaxKind.TypeSpecScript,
    statements: [...Object.values(imports), ...Object.values(usings), ...statements],
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
    locals: undefined as any,
  } as any as TypeSpecScriptNode;

  const content = await printTypeSpecNode(newSourceFile);

  return {
    content,
    diagnostics,
  };
}

function printIdOrMember(node: IdentifierNode | MemberExpressionNode): string {
  if (node.kind === SyntaxKind.Identifier) {
    return node.sv;
  } else {
    return `${printIdOrMember(node.base)}.${node.id.sv}`;
  }
}
