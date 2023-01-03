import {
  CompletionItem,
  CompletionItemKind,
  CompletionItemTag,
  CompletionList,
  MarkupKind,
} from "vscode-languageserver";
import {
  CadlScriptNode,
  IdentifierNode,
  Node,
  Program,
  StringLiteralNode,
  SymbolFlags,
  SyntaxKind,
  Type,
} from "../core/index.js";
import {
  getAnyExtensionFromPath,
  getBaseFileName,
  getDirectoryPath,
  hasTrailingDirectorySeparator,
  resolvePath,
} from "../core/path-utils.js";
import { findProjectRoot, loadFile } from "../core/util.js";
import { isDeprecated } from "../lib/decorators.js";
import { getTypeDetails } from "./type-details.js";

export async function resolveCompletions(
  program: Program,
  file: CadlScriptNode,
  completions: CompletionList,
  node: Node | undefined
) {
  if (node === undefined) {
    addKeywordCompletion("root", completions);
  } else {
    switch (node.kind) {
      case SyntaxKind.NamespaceStatement:
        addKeywordCompletion("namespace", completions);
        break;
      case SyntaxKind.Identifier:
        addIdentifierCompletion(program, node, completions);
        break;
      case SyntaxKind.StringLiteral:
        if (node.parent && node.parent.kind === SyntaxKind.ImportStatement) {
          await addImportCompletion(program, file, completions, node);
        }
        break;
    }
  }
}

interface KeywordArea {
  root?: boolean;
  namespace?: boolean;
  model?: boolean;
  identifier?: boolean;
}

const keywords = [
  // Root only
  ["import", { root: true }],

  // Root and namespace
  ["using", { root: true, namespace: true }],
  ["model", { root: true, namespace: true }],
  ["scalar", { root: true, namespace: true }],
  ["namespace", { root: true, namespace: true }],
  ["interface", { root: true, namespace: true }],
  ["union", { root: true, namespace: true }],
  ["enum", { root: true, namespace: true }],
  ["alias", { root: true, namespace: true }],
  ["op", { root: true, namespace: true }],
  ["dec", { root: true, namespace: true }],
  ["fn", { root: true, namespace: true }],

  // On model `model Foo <keyword> ...`
  ["extends", { model: true }],
  ["is", { model: true }],

  // On identifier`
  ["true", { identifier: true }],
  ["false", { identifier: true }],
  ["unknown", { identifier: true }],
  ["void", { identifier: true }],
  ["never", { identifier: true }],

  // Modifiers
  ["extern", { root: true, namespace: true }],
] as const;

function addKeywordCompletion(area: keyof KeywordArea, completions: CompletionList) {
  const filteredKeywords = keywords.filter(([_, x]) => area in x);
  for (const [keyword] of filteredKeywords) {
    completions.items.push({
      label: keyword,
      kind: CompletionItemKind.Keyword,
    });
  }
}

async function addLibraryImportCompletion(
  program: Program,
  file: CadlScriptNode,
  completions: CompletionList
) {
  const documentPath = file.file.path;
  const projectRoot = await findProjectRoot(program.host, documentPath);
  if (projectRoot !== undefined) {
    const [packagejson] = await loadFile(
      program.host,
      resolvePath(projectRoot, "package.json"),
      JSON.parse,
      program.reportDiagnostic
    );
    let dependencies: string[] = [];
    if (packagejson.dependencies !== undefined) {
      dependencies = dependencies.concat(Object.keys(packagejson.dependencies));
    }
    if (packagejson.peerDependencies !== undefined) {
      dependencies = dependencies.concat(Object.keys(packagejson.peerDependencies));
    }
    for (const dependency of dependencies) {
      const nodeProjectRoot = resolvePath(projectRoot, "node_modules", dependency);
      const [libPackageJson] = await loadFile(
        program.host,
        resolvePath(nodeProjectRoot, "package.json"),
        JSON.parse,
        program.reportDiagnostic
      );
      if (libPackageJson.cadlMain !== undefined) {
        completions.items.push({
          label: dependency,
          commitCharacters: [],
          kind: CompletionItemKind.Module,
        });
      }
    }
  }
}

async function addImportCompletion(
  program: Program,
  file: CadlScriptNode,
  completions: CompletionList,
  node: StringLiteralNode
) {
  if (node.value.startsWith("./") || node.value.startsWith("../")) {
    await addRelativePathCompletion(program, file, completions, node);
  } else if (!node.value.startsWith(".")) {
    await addLibraryImportCompletion(program, file, completions);
  }
}

async function addRelativePathCompletion(
  program: Program,
  file: CadlScriptNode,
  completions: CompletionList,
  node: StringLiteralNode
) {
  const documentPath = file.file.path;
  const documentFile = getBaseFileName(documentPath);
  const documentDir = getDirectoryPath(documentPath);
  const nodevalueDir = hasTrailingDirectorySeparator(node.value)
    ? node.value
    : getDirectoryPath(node.value);
  const mainCadl = resolvePath(documentDir, nodevalueDir);
  const files = (await program.host.readDir(mainCadl)).filter(
    (x) => x !== documentFile && x !== "node_modules"
  );
  for (const file of files) {
    const extension = getAnyExtensionFromPath(file);
    switch (extension) {
      case ".cadl":
      case ".js":
      case ".mjs":
        completions.items.push({
          label: file,
          commitCharacters: [],
          kind: CompletionItemKind.File,
        });
        break;
      case "":
        completions.items.push({
          label: file,
          commitCharacters: [],
          kind: CompletionItemKind.Folder,
        });
        break;
    }
  }
}

/**
 * Add completion options for an identifier.
 */
function addIdentifierCompletion(
  program: Program,
  node: IdentifierNode,
  completions: CompletionList
) {
  const result = program.checker.resolveCompletions(node);
  if (result.size === 0) {
    return;
  }
  for (const [key, { sym, label }] of result) {
    let kind: CompletionItemKind;
    let deprecated = false;
    const type = sym.type ?? program.checker.getTypeForNode(sym.declarations[0]);
    if (sym.flags & (SymbolFlags.Function | SymbolFlags.Decorator)) {
      kind = CompletionItemKind.Function;
    } else if (
      sym.flags & SymbolFlags.Namespace &&
      sym.declarations[0].kind !== SyntaxKind.NamespaceStatement
    ) {
      kind = CompletionItemKind.Module;
    } else {
      kind = getCompletionItemKind(program, type);
      deprecated = isDeprecated(program, type);
    }
    const documentation = getTypeDetails(program, type);
    const item: CompletionItem = {
      label: label ?? key,
      documentation: documentation
        ? {
            kind: MarkupKind.Markdown,
            value: documentation,
          }
        : undefined,
      kind,
      insertText: key,
    };
    if (deprecated) {
      item.tags = [CompletionItemTag.Deprecated];
    }
    completions.items.push(item);
  }

  if (node.parent?.kind === SyntaxKind.TypeReference) {
    addKeywordCompletion("identifier", completions);
  }
}

function getCompletionItemKind(program: Program, target: Type): CompletionItemKind {
  switch (target.node?.kind) {
    case SyntaxKind.EnumStatement:
    case SyntaxKind.UnionStatement:
      return CompletionItemKind.Enum;
    case SyntaxKind.EnumMember:
    case SyntaxKind.UnionVariant:
      return CompletionItemKind.EnumMember;
    case SyntaxKind.AliasStatement:
      return CompletionItemKind.Variable;
    case SyntaxKind.ModelStatement:
      return CompletionItemKind.Class;
    case SyntaxKind.ScalarStatement:
      return CompletionItemKind.Unit;
    case SyntaxKind.ModelProperty:
      return CompletionItemKind.Field;
    case SyntaxKind.OperationStatement:
      return CompletionItemKind.Method;
    case SyntaxKind.NamespaceStatement:
      return CompletionItemKind.Module;
    default:
      return CompletionItemKind.Struct;
  }
}
