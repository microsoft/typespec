import {
  CompletionItem,
  CompletionItemKind,
  CompletionList,
  CompletionParams,
  MarkupKind,
  TextEdit,
} from "vscode-languageserver";
import { getDeprecationDetails } from "../core/deprecation.js";
import {
  CompilerHost,
  IdentifierNode,
  Node,
  NodeFlags,
  NodePackage,
  PositionDetail,
  Program,
  StringLiteralNode,
  SymbolFlags,
  SyntaxKind,
  Type,
  TypeSpecScriptNode,
  compilerAssert,
  getFirstAncestor,
  positionInRange,
  printIdentifier,
} from "../core/index.js";
import {
  getAnyExtensionFromPath,
  getBaseFileName,
  getDirectoryPath,
  hasTrailingDirectorySeparator,
  resolvePath,
} from "../core/path-utils.js";
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
  posDetail: PositionDetail,
): Promise<CompletionList> {
  let node: Node | undefined = posDetail.node;

  if (!node) {
    if (
      posDetail.triviaStartPosition === 0 ||
      !addCompletionByLookingBackward(posDetail, context)
    ) {
      addKeywordCompletion("root", context.completions);
    }
  } else {
    // look back first to see whether we can get some completion from the previous statement, e.g. `model Foo |`
    if (!addCompletionByLookingBackward(posDetail, context)) {
      if (posDetail.inTrivia) {
        // If we're not immediately after an identifier character, then advance
        // the position past any trivia. This is done because a zero-width
        // inserted missing identifier that the user is now trying to complete
        // starts after the trivia following the cursor.
        node = posDetail.getPositionDetailAfterTrivia().node;
      }
      await AddCompletionNonTrivia(node, context, posDetail);
    } else {
      if (!posDetail.inTrivia) {
        await AddCompletionNonTrivia(node, context, posDetail);
      }
    }
  }

  return context.completions;
}

function addCompletionByLookingBackward(
  posDetail: PositionDetail,
  context: CompletionContext,
): boolean {
  if (posDetail.triviaStartPosition === 0) {
    return false;
  }
  const preDetail = posDetail.getPositionDetailBeforeTrivia();
  if (!preDetail.node) {
    return false;
  }

  const node = getFirstAncestor(
    preDetail.node,
    (n) =>
      n.kind === SyntaxKind.ModelStatement ||
      n.kind === SyntaxKind.ScalarStatement ||
      n.kind === SyntaxKind.OperationStatement ||
      n.kind === SyntaxKind.InterfaceStatement ||
      n.kind === SyntaxKind.TemplateParameterDeclaration,
    true /*includeSelf*/,
  );

  return node !== undefined && addCompletionByLookingBackwardNode(node, posDetail, context);
}

function addCompletionByLookingBackwardNode(
  preNode: Node,
  posDetail: PositionDetail,
  context: CompletionContext,
): boolean {
  const getIdentifierEndPos = (n: IdentifierNode) => {
    // n.pos === n.end, it means it's a missing identifier, just return -1;
    return n.pos === n.end ? -1 : n.end;
  };
  const map: { [key in SyntaxKind]?: keyof KeywordArea } = {
    [SyntaxKind.ModelStatement]: "modelHeader",
    [SyntaxKind.ScalarStatement]: "scalarHeader",
    [SyntaxKind.OperationStatement]: "operationHeader",
    [SyntaxKind.InterfaceStatement]: "interfaceHeader",
  };
  switch (preNode?.kind) {
    case SyntaxKind.ModelStatement:
    case SyntaxKind.ScalarStatement:
    case SyntaxKind.OperationStatement:
    case SyntaxKind.InterfaceStatement:
      const idEndPos =
        preNode.templateParametersRange.end >= 0
          ? preNode.templateParametersRange.end
          : getIdentifierEndPos(preNode.id);
      if (posDetail.triviaStartPosition === idEndPos) {
        const key = map[preNode.kind];
        if (!key) {
          compilerAssert(false, "KeywordArea missing in keyarea map.");
        }
        addKeywordCompletion(key, context.completions);
        return true;
      }
      break;
    case SyntaxKind.TemplateParameterDeclaration:
      if (posDetail.triviaStartPosition === getIdentifierEndPos(preNode.id)) {
        addKeywordCompletion("templateParameter", context.completions);
        return true;
      } else if (preNode.parent?.templateParametersRange.end === posDetail.triviaStartPosition) {
        return addCompletionByLookingBackwardNode(preNode.parent, posDetail, context);
      }
      break;
  }
  return false;
}

async function AddCompletionNonTrivia(
  node: Node | undefined,
  context: CompletionContext,
  posDetail: PositionDetail,
  lookBackward: boolean = true,
) {
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
        if (positionInRange(posDetail.position, node.bodyRange)) {
          addKeywordCompletion("scalarBody", context.completions);
        }
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
      case SyntaxKind.ObjectLiteral:
      case SyntaxKind.ModelExpression:
        addModelCompletion(context, posDetail);
        break;
    }
  }
}

interface KeywordArea {
  root?: boolean;
  namespace?: boolean;
  modelHeader?: boolean;
  identifier?: boolean;
  scalarHeader?: boolean;
  scalarBody?: boolean;
  templateParameter?: boolean;
  operationHeader?: boolean;
  interfaceHeader?: boolean;
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
  [
    "extends",
    { modelHeader: true, scalarHeader: true, templateParameter: true, interfaceHeader: true },
  ],
  ["is", { modelHeader: true, operationHeader: true }],

  // On identifier
  ["true", { identifier: true }],
  ["false", { identifier: true }],
  ["unknown", { identifier: true }],
  ["void", { identifier: true }],
  ["never", { identifier: true }],

  // Modifiers
  ["extern", { root: true, namespace: true }],

  // Scalars
  ["init", { scalarBody: true }],
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
  node: StringLiteralNode,
) {
  const documentPath = file.file.path;
  const projectRoot = await findProjectRoot(program.host.stat, documentPath);
  if (projectRoot !== undefined) {
    const packagejson = await loadPackageJson(
      program.host,
      resolvePath(projectRoot, "package.json"),
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
  node: StringLiteralNode,
) {
  const documentPath = file.file.path;
  const documentFile = getBaseFileName(documentPath);
  const documentDir = getDirectoryPath(documentPath);
  const currentRelativePath = hasTrailingDirectorySeparator(node.value)
    ? node.value
    : getDirectoryPath(node.value);
  const currentAbsolutePath = resolvePath(documentDir, currentRelativePath);
  const files = (await tryListItemInDir(program.host, currentAbsolutePath)).filter(
    (x) => x !== documentFile && x !== "node_modules",
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

function addModelCompletion(context: CompletionContext, posDetail: PositionDetail) {
  const node = posDetail.node;
  if (
    !node ||
    (node.kind !== SyntaxKind.ModelStatement &&
      node.kind !== SyntaxKind.ModelExpression &&
      node.kind !== SyntaxKind.ObjectLiteral)
  ) {
    return;
  }

  if (posDetail.position === node.bodyRange.end) {
    // skip the scenario like `{ ... }|`
    return;
  } else {
    // create a fake identifier node to further resolve the completions for the model/object
    // it's a little tricky but can help to keep things clean and simple while the cons. is limited
    // TODO: consider adding support in resolveCompletions for non-identifier-node directly when we find more scenario and worth the cost
    const fakeProp = {
      kind:
        node.kind === SyntaxKind.ObjectLiteral
          ? SyntaxKind.ObjectLiteralProperty
          : SyntaxKind.ModelProperty,
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
}

/**
 * Add completion options for an identifier.
 */
function addIdentifierCompletion(
  { program, completions }: CompletionContext,
  node: IdentifierNode,
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
      insertText: printIdentifier(key) + (suffix ?? ""),
    };
    if (deprecated) {
      // hide these deprecated items to discourage the usage
      // not using CompletionItemTag.Deprecated because the strike-through is a little confusing
      // and also it's not supported in vs extension
      continue;
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
