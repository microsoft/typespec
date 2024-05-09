import {
  CompletionItem,
  CompletionItemKind,
  CompletionItemTag,
  CompletionList,
  CompletionParams,
  MarkupKind,
  TextEdit,
} from "vscode-languageserver";
import { CharCode } from "../core/charcode.js";
import { getDeprecationDetails } from "../core/deprecation.js";
import {
  CompilerHost,
  DecoratorExpressionNode,
  IdentifierNode,
  ModelExpressionNode,
  ModelStatementNode,
  Node,
  NodeFlags,
  NodePackage,
  Program,
  StringLiteralNode,
  SymbolFlags,
  SyntaxKind,
  Type,
  TypeSpecScriptNode,
  getFirstAncestor,
} from "../core/index.js";
import {
  getAnyExtensionFromPath,
  getBaseFileName,
  getDirectoryPath,
  hasTrailingDirectorySeparator,
  resolvePath,
} from "../core/path-utils.js";
import { printId } from "../formatter/print/printer.js";
import { findProjectRoot, loadFile, resolveTspMain } from "../utils/misc.js";
import { getSymbolDetails } from "./type-details.js";

export type CompletionContext = {
  program: Program;
  params: CompletionParams;
  file: TypeSpecScriptNode;
  completions: CompletionList;
};

export async function resolveCompletion(
  context: CompletionContext,
  node: Node | undefined
): Promise<CompletionList> {
  if (
    node === undefined ||
    node.kind === SyntaxKind.InvalidStatement ||
    (node.kind === SyntaxKind.Identifier &&
      (node.parent?.kind === SyntaxKind.TypeSpecScript ||
        node.parent?.kind === SyntaxKind.NamespaceStatement))
  ) {
    addKeywordCompletion("root", context.completions);
  } else {
    switch (node.kind) {
      case SyntaxKind.NamespaceStatement:
        addKeywordCompletion("namespace", context.completions);
        break;
      case SyntaxKind.ScalarStatement:
        addKeywordCompletion("scalar", context.completions);
        break;
      case SyntaxKind.Identifier:
        addDirectiveCompletion(context, node);
        addIdentifierCompletion(context, node);
        break;
      case SyntaxKind.StringLiteral:
        if (node.parent && node.parent.kind === SyntaxKind.ImportStatement) {
          await addImportCompletion(context, node);
        }
        break;
      case SyntaxKind.ModelStatement:
        // we can provide completions for overrides when the model has base model
        if (node.extends) {
          addModelCompletion(context, node);
        }
        break;
      case SyntaxKind.ModelExpression:
        // check for following scenario:
        // a model expresssion as a decorator argument like `@dec({ | })`
        let decNode: DecoratorExpressionNode | undefined = undefined;
        if (node.parent?.kind === SyntaxKind.DecoratorExpression) {
          decNode = node.parent;
        } else {
          const argNode = getFirstAncestor(
            node,
            (n) =>
              n.kind === SyntaxKind.ModelExpression &&
              n.parent?.kind === SyntaxKind.DecoratorExpression
          );
          decNode = argNode?.parent as DecoratorExpressionNode;
        }
        if (decNode) {
          addModelCompletion(context, node);
        }
        break;
    }
  }

  return context.completions;
}

interface KeywordArea {
  root?: boolean;
  namespace?: boolean;
  model?: boolean;
  identifier?: boolean;
  scalar?: boolean;
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
  ["const", { root: true, namespace: true }],

  // On model `model Foo <keyword> ...`
  ["extends", { model: true }],
  ["is", { model: true }],

  // On identifier
  ["true", { identifier: true }],
  ["false", { identifier: true }],
  ["unknown", { identifier: true }],
  ["void", { identifier: true }],
  ["never", { identifier: true }],

  // Modifiers
  ["extern", { root: true, namespace: true }],

  // Scalars
  ["init", { scalar: true }],
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

async function loadPackageJson(host: CompilerHost, path: string): Promise<NodePackage> {
  const [libPackageJson] = await loadFile(host, path, JSON.parse, () => {});
  return libPackageJson;
}
/** Check if the folder given has a package.json which has a tspMain. */
async function isTspLibraryPackage(host: CompilerHost, dir: string) {
  const libPackageJson = await loadPackageJson(host, resolvePath(dir, "package.json"));

  return resolveTspMain(libPackageJson) !== undefined;
}

async function addLibraryImportCompletion(
  { program, file, completions }: CompletionContext,
  node: StringLiteralNode
) {
  const documentPath = file.file.path;
  const projectRoot = await findProjectRoot(program.host.stat, documentPath);
  if (projectRoot !== undefined) {
    const packagejson = await loadPackageJson(
      program.host,
      resolvePath(projectRoot, "package.json")
    );
    let dependencies: string[] = [];
    if (packagejson.dependencies !== undefined) {
      dependencies = dependencies.concat(Object.keys(packagejson.dependencies));
    }
    if (packagejson.peerDependencies !== undefined) {
      dependencies = dependencies.concat(Object.keys(packagejson.peerDependencies));
    }
    for (const dependency of dependencies) {
      const dependencyDir = resolvePath(projectRoot, "node_modules", dependency);
      if (await isTspLibraryPackage(program.host, dependencyDir)) {
        const range = {
          start: file.file.getLineAndCharacterOfPosition(node.pos + 1),
          end: file.file.getLineAndCharacterOfPosition(node.end - 1),
        };
        completions.items.push({
          textEdit: TextEdit.replace(range, dependency),
          label: dependency,
          kind: CompletionItemKind.Module,
        });
      }
    }
  }
}

async function addImportCompletion(context: CompletionContext, node: StringLiteralNode) {
  if (node.value.startsWith("./") || node.value.startsWith("../")) {
    await addRelativePathCompletion(context, node);
  } else if (!node.value.startsWith(".")) {
    await addLibraryImportCompletion(context, node);
  }
}

async function tryListItemInDir(host: CompilerHost, path: string): Promise<string[]> {
  try {
    return await host.readDir(path);
  } catch (e: any) {
    if (e.code === "ENOENT") {
      return [];
    }
    throw e;
  }
}

async function addRelativePathCompletion(
  { program, completions, file }: CompletionContext,
  node: StringLiteralNode
) {
  const documentPath = file.file.path;
  const documentFile = getBaseFileName(documentPath);
  const documentDir = getDirectoryPath(documentPath);
  const currentRelativePath = hasTrailingDirectorySeparator(node.value)
    ? node.value
    : getDirectoryPath(node.value);
  const currentAbsolutePath = resolvePath(documentDir, currentRelativePath);
  const files = (await tryListItemInDir(program.host, currentAbsolutePath)).filter(
    (x) => x !== documentFile && x !== "node_modules"
  );

  const lastSlash = node.value.lastIndexOf("/");
  const offset = lastSlash === -1 ? 0 : lastSlash + 1;
  const range = {
    start: file.file.getLineAndCharacterOfPosition(node.pos + 1 + offset),
    end: file.file.getLineAndCharacterOfPosition(node.end - 1),
  };
  for (const file of files) {
    const extension = getAnyExtensionFromPath(file);

    switch (extension) {
      case ".tsp":
      case ".js":
      case ".mjs":
        completions.items.push({
          label: file,
          kind: CompletionItemKind.File,
          textEdit: TextEdit.replace(range, file),
        });
        break;
      case "":
        completions.items.push({
          label: file,
          kind: CompletionItemKind.Folder,
          textEdit: TextEdit.replace(range, file),
        });
        break;
    }
  }
}

function addModelCompletion(
  context: CompletionContext,
  node: ModelStatementNode | ModelExpressionNode
) {
  // skip the scenario like `{ ... }|`
  const { line, character } = context.file.file.getLineAndCharacterOfPosition(node.end);
  if (line === context.params.position.line && character === context.params.position.character) {
    const endChar = context.file.file.text.charCodeAt(node.end - 1);
    if (endChar === CharCode.CloseBrace) {
      return;
    }
  }
  // create a fake identifier node in the model to further resolve the completions
  const fakeProp = {
    kind: SyntaxKind.ModelProperty,
    flags: NodeFlags.None,
    parent: node,
  };
  const fakeId = {
    kind: SyntaxKind.Identifier,
    sv: "",
    flags: NodeFlags.None,
    parent: fakeProp,
  };
  addIdentifierCompletion(context, fakeId as IdentifierNode);
}

/**
 * Add completion options for an identifier.
 */
function addIdentifierCompletion(
  { program, completions }: CompletionContext,
  node: IdentifierNode
) {
  const result = program.checker.resolveCompletions(node);
  if (result.size === 0) {
    return;
  }
  for (const [key, { sym, label, suffix }] of result) {
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
    } else if (sym.declarations[0]?.kind === SyntaxKind.AliasStatement) {
      kind = CompletionItemKind.Variable;
      deprecated = getDeprecationDetails(program, sym.declarations[0]) !== undefined;
    } else {
      kind = getCompletionItemKind(program, type);
      deprecated = getDeprecationDetails(program, type) !== undefined;
    }
    const documentation = getSymbolDetails(program, sym);
    const item: CompletionItem = {
      label: label ?? key,
      documentation: documentation
        ? {
            kind: MarkupKind.Markdown,
            value: documentation,
          }
        : undefined,
      kind,
      insertText: printId(key) + (suffix ?? ""),
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

const directiveNames = ["suppress", "deprecated"];
function addDirectiveCompletion({ completions }: CompletionContext, node: IdentifierNode) {
  if (!(node.parent?.kind === SyntaxKind.DirectiveExpression && node.parent.target === node)) {
    return;
  }
  for (const directive of directiveNames) {
    completions.items.push({
      label: directive,
      kind: CompletionItemKind.Keyword,
    });
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
