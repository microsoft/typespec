import { mutate } from "../utils/misc.js";
import { compilerAssert } from "./diagnostics.js";
import { getLocationContext } from "./helpers/location-context.js";
import { visitChildren } from "./parser.js";
import type { Program } from "./program.js";
import {
  AliasStatementNode,
  ConstStatementNode,
  Declaration,
  DecoratorDeclarationStatementNode,
  EnumStatementNode,
  FileLibraryMetadata,
  FunctionDeclarationStatementNode,
  FunctionParameterNode,
  InterfaceStatementNode,
  JsNamespaceDeclarationNode,
  JsSourceFileNode,
  ModelExpressionNode,
  ModelStatementNode,
  NamespaceStatementNode,
  Node,
  NodeFlags,
  OperationStatementNode,
  ProjectionLambdaExpressionNode,
  ProjectionLambdaParameterDeclarationNode,
  ProjectionNode,
  ProjectionParameterDeclarationNode,
  ProjectionStatementNode,
  ScalarStatementNode,
  ScopeNode,
  Sym,
  SymbolFlags,
  SymbolTable,
  SyntaxKind,
  TemplateParameterDeclarationNode,
  TypeSpecScriptNode,
  UnionStatementNode,
  UsingStatementNode,
} from "./types.js";

// Use a regular expression to define the prefix for TypeSpec-exposed functions
// defined in JavaScript modules
const DecoratorFunctionPattern = /^\$/;
const SymbolTable = class extends Map<string, Sym> implements SymbolTable {
  duplicates = new Map<Sym, Set<Sym>>();

  constructor(source?: SymbolTable) {
    super();
    if (source) {
      for (const [key, value] of source) {
        // Note: shallow copy of value here so we can mutate flags on set.
        super.set(key, { ...value });
      }
      for (const [key, value] of source.duplicates) {
        this.duplicates.set(key, new Set(value));
      }
    }
  }

  // First set for a given key wins, but record all duplicates for diagnostics.
  set(key: string, value: Sym) {
    const existing = super.get(key);
    if (existing === undefined) {
      super.set(key, value);
    } else {
      if (existing.flags & SymbolFlags.Using) {
        mutate(existing).flags |= SymbolFlags.DuplicateUsing;
      }

      const duplicateArray = this.duplicates.get(existing);
      if (duplicateArray) {
        duplicateArray.add(value);
      } else {
        this.duplicates.set(existing, new Set([existing, value]));
      }
    }
    return this;
  }
};

export interface Binder {
  bindSourceFile(script: TypeSpecScriptNode): void;
  bindJsSourceFile(sourceFile: JsSourceFileNode): void;
  /**
   * @internal
   */
  bindNode(node: Node): void;
}

export function createSymbolTable(source?: SymbolTable): SymbolTable {
  return new SymbolTable(source);
}

export function createBinder(program: Program): Binder {
  let currentFile: TypeSpecScriptNode;
  let parentNode: Node | undefined;
  let fileNamespace: NamespaceStatementNode | undefined;
  let scope: ScopeNode;

  // tracks which selectors were used with which projection symbols
  // for reporting duplicates
  const projectionSymbolSelectors = new Map<Sym, Set<string>>();

  return {
    bindSourceFile,
    bindJsSourceFile,
    bindNode,
  };

  function isFunctionName(name: string): boolean {
    return DecoratorFunctionPattern.test(name);
  }

  function getFunctionName(name: string): string {
    return name.replace(DecoratorFunctionPattern, "");
  }

  function bindJsSourceFile(sourceFile: JsSourceFileNode) {
    // cast because it causes TS to make the type of .symbol never other
    if ((sourceFile.symbol as any) !== undefined) {
      return;
    }
    const tracer = program.tracer.sub("bind.js");

    fileNamespace = undefined;
    mutate(sourceFile).symbol = createSymbol(
      sourceFile,
      sourceFile.file.path,
      SymbolFlags.SourceFile
    );
    const rootNs = sourceFile.esmExports["namespace"];

    for (const [key, member] of Object.entries(sourceFile.esmExports)) {
      let name: string;
      let kind: "decorator" | "function";
      let containerSymbol = sourceFile.symbol;
      if (key === "$flags") {
        const context = getLocationContext(program, sourceFile);
        if (context.type === "library" || context.type === "project") {
          mutate(context).flags = member as any;
        }
      } else if (typeof member === "function") {
        // lots of 'any' casts here because control flow narrowing `member` to Function
        // isn't particularly useful it turns out.
        if (isFunctionName(key)) {
          name = getFunctionName(key);
          kind = "decorator";
          if (name === "onValidate") {
            const context = getLocationContext(program, sourceFile);
            const metadata =
              context.type === "library"
                ? context.metadata
                : ({ type: "file" } satisfies FileLibraryMetadata);
            program.onValidate(member as any, metadata);
            continue;
          } else if (name === "onEmit") {
            // nothing to do here this is loaded as emitter.
            continue;
          }
        } else {
          name = key;
          kind = "function";
        }

        const nsParts = resolveJSMemberNamespaceParts(rootNs, member);
        for (const part of nsParts) {
          const existingBinding = containerSymbol.exports!.get(part);
          const jsNamespaceNode: JsNamespaceDeclarationNode = {
            kind: SyntaxKind.JsNamespaceDeclaration,
            id: {
              kind: SyntaxKind.Identifier,
              sv: part,
              pos: 0,
              end: 0,
              flags: NodeFlags.None,
              symbol: undefined!,
            },
            pos: sourceFile.pos,
            end: sourceFile.end,
            parent: sourceFile,
            flags: NodeFlags.None,
            symbol: undefined!,
          };
          const sym = createSymbol(jsNamespaceNode, part, SymbolFlags.Namespace, containerSymbol);
          mutate(jsNamespaceNode).symbol = sym;
          if (existingBinding) {
            if (existingBinding.flags & SymbolFlags.Namespace) {
              // since the namespace was "declared" as part of this source file,
              // we can simply re-use it.
              containerSymbol = existingBinding;
            } else {
              // we have some conflict, lets report a duplicate binding error.
              mutate(containerSymbol.exports)!.set(part, sym);
            }
          } else {
            mutate(sym).exports = createSymbolTable();
            mutate(containerSymbol.exports!).set(part, sym);
            containerSymbol = sym;
          }
        }
        let sym;
        if (kind === "decorator") {
          tracer.trace(
            "decorator",
            `Bound decorator "@${name}" in namespace "${nsParts.join(".")}".`
          );
          sym = createSymbol(
            sourceFile,
            "@" + name,
            SymbolFlags.Decorator | SymbolFlags.Implementation,
            containerSymbol
          );
        } else {
          tracer.trace("function", `Bound function "${name}" in namespace "${nsParts.join(".")}".`);
          sym = createSymbol(
            sourceFile,
            name,
            SymbolFlags.Function | SymbolFlags.Implementation,
            containerSymbol
          );
        }
        mutate(sym).value = member as any;
        mutate(containerSymbol.exports)!.set(sym.name, sym);
      }
    }
  }

  function resolveJSMemberNamespaceParts(rootNs: string | undefined, member: any) {
    const memberNs: string = member.namespace;
    const nsParts = [];
    if (rootNs) {
      nsParts.push(...rootNs.split("."));
    }

    if (memberNs) {
      nsParts.push(...memberNs.split("."));
    }
    return nsParts;
  }

  function bindSourceFile(script: TypeSpecScriptNode) {
    if (script.locals !== undefined) {
      return;
    }

    mutate(script).locals = createSymbolTable();
    mutate(script).symbol = createSymbol(script, script.file.path, SymbolFlags.SourceFile);
    mutate(script.symbol).exports = createSymbolTable();
    fileNamespace = undefined;
    currentFile = script;
    scope = script;
    bindNode(script);
  }

  function bindNode(node: Node) {
    if (!node) return;
    // set the node's parent since we're going for a walk anyway
    mutate(node).parent = parentNode;

    switch (node.kind) {
      case SyntaxKind.ModelStatement:
        bindModelStatement(node);
        break;
      case SyntaxKind.ModelExpression:
        bindModelExpression(node);
        break;
      case SyntaxKind.ScalarStatement:
        bindScalarStatement(node);
        break;
      case SyntaxKind.InterfaceStatement:
        bindInterfaceStatement(node);
        break;
      case SyntaxKind.UnionStatement:
        bindUnionStatement(node);
        break;
      case SyntaxKind.AliasStatement:
        bindAliasStatement(node);
        break;
      case SyntaxKind.ConstStatement:
        bindConstStatement(node);
        break;
      case SyntaxKind.EnumStatement:
        bindEnumStatement(node);
        break;
      case SyntaxKind.NamespaceStatement:
        bindNamespaceStatement(node);
        break;
      case SyntaxKind.OperationStatement:
        bindOperationStatement(node);
        break;
      case SyntaxKind.TemplateParameterDeclaration:
        bindTemplateParameterDeclaration(node);
        break;
      case SyntaxKind.UsingStatement:
        bindUsingStatement(node);
        break;
      case SyntaxKind.DecoratorDeclarationStatement:
        bindDecoratorDeclarationStatement(node);
        break;
      case SyntaxKind.FunctionDeclarationStatement:
        bindFunctionDeclarationStatement(node);
        break;
      case SyntaxKind.FunctionParameter:
        bindFunctionParameter(node);
        break;
      case SyntaxKind.Projection:
        bindProjection(node);
        break;
      case SyntaxKind.ProjectionStatement:
        bindProjectionStatement(node);
        break;
      case SyntaxKind.ProjectionParameterDeclaration:
        bindProjectionParameterDeclaration(node);
        break;
      case SyntaxKind.ProjectionLambdaParameterDeclaration:
        bindProjectionLambdaParameterDeclaration(node);
        break;
      case SyntaxKind.ProjectionLambdaExpression:
        bindProjectionLambdaExpression(node);
    }

    const prevParent = parentNode;
    // set parent node when we walk into children
    parentNode = node;

    if (hasScope(node)) {
      const prevScope = scope;
      scope = node;
      visitChildren(node, bindNode);

      if ("locals" in node) {
        program.reportDuplicateSymbols(node.locals);
      }

      scope = prevScope;
    } else {
      visitChildren(node, bindNode);
    }

    // restore parent node
    parentNode = prevParent;
  }

  function bindProjection(node: ProjectionNode) {
    mutate(node).locals = createSymbolTable();
  }

  /**
   * Binding projection statements is interesting because there may be
   * multiple declarations spread across various source files that all
   * contribute to the same symbol because they declare the same
   * projection on different selectors.
   *
   * There is presently an issue where we do not check for duplicate
   * projections when they're applied to a specific type. This could
   * be done with ease in the checker during evaluation, but could
   * probably instead be done in a post-bind phase - we just need
   * all the symbols in place so we know if a projection was declared
   * multiple times for the same symbol.
   *
   */
  function bindProjectionStatement(node: ProjectionStatementNode) {
    const name = node.id.sv;
    const table: SymbolTable = (scope as NamespaceStatementNode | TypeSpecScriptNode).symbol
      .exports!;
    let sym: Sym;
    if (table.has(name)) {
      sym = table.get(name)!;
      if (!(sym.flags & SymbolFlags.Projection)) {
        // clashing with some other decl, report duplicate symbol
        declareSymbol(node, SymbolFlags.Projection);
        return;
      }
      mutate(sym.declarations).push(node);
    } else {
      sym = createSymbol(node, name, SymbolFlags.Projection, scope.symbol);
      mutate(table).set(name, sym);
    }

    mutate(node).symbol = sym;

    if (
      node.selector.kind !== SyntaxKind.Identifier &&
      node.selector.kind !== SyntaxKind.MemberExpression
    ) {
      let selectorString: string;
      switch (node.selector.kind) {
        case SyntaxKind.ProjectionModelSelector:
          selectorString = "model";
          break;
        case SyntaxKind.ProjectionModelPropertySelector:
          selectorString = "modelproperty";
          break;
        case SyntaxKind.ProjectionScalarSelector:
          selectorString = "scalar";
          break;
        case SyntaxKind.ProjectionOperationSelector:
          selectorString = "op";
          break;
        case SyntaxKind.ProjectionUnionSelector:
          selectorString = "union";
          break;
        case SyntaxKind.ProjectionUnionVariantSelector:
          selectorString = "unionvariant";
          break;
        case SyntaxKind.ProjectionEnumSelector:
          selectorString = "enum";
          break;
        case SyntaxKind.ProjectionEnumMemberSelector:
          selectorString = "enummember";
          break;
        case SyntaxKind.ProjectionInterfaceSelector:
          selectorString = "interface";
          break;
        default:
          const _never: never = node.selector;
          compilerAssert(false, "Unreachable");
      }

      let existingSelectors = projectionSymbolSelectors.get(sym);
      if (!existingSelectors) {
        existingSelectors = new Set();
        projectionSymbolSelectors.set(sym, existingSelectors);
      }
      if (existingSelectors.has(selectorString)) {
        // clashing with a like-named decl with this selector, so throw.
        declareSymbol(node, SymbolFlags.Projection);
        return;
      }

      existingSelectors.add(selectorString);
    }
  }

  function bindProjectionParameterDeclaration(node: ProjectionParameterDeclarationNode) {
    declareSymbol(node, SymbolFlags.ProjectionParameter);
  }

  function bindProjectionLambdaParameterDeclaration(
    node: ProjectionLambdaParameterDeclarationNode
  ) {
    declareSymbol(node, SymbolFlags.FunctionParameter);
  }

  function bindProjectionLambdaExpression(node: ProjectionLambdaExpressionNode) {
    mutate(node).locals = new SymbolTable();
  }

  function bindTemplateParameterDeclaration(node: TemplateParameterDeclarationNode) {
    declareSymbol(node, SymbolFlags.TemplateParameter);
  }

  function bindModelStatement(node: ModelStatementNode) {
    declareSymbol(node, SymbolFlags.Model);
    // Initialize locals for type parameters
    mutate(node).locals = new SymbolTable();
  }

  function bindModelExpression(node: ModelExpressionNode) {
    bindSymbol(node, SymbolFlags.Model);
  }

  function bindScalarStatement(node: ScalarStatementNode) {
    declareSymbol(node, SymbolFlags.Scalar);
    // Initialize locals for type parameters
    mutate(node).locals = new SymbolTable();
  }

  function bindInterfaceStatement(node: InterfaceStatementNode) {
    declareSymbol(node, SymbolFlags.Interface);
    mutate(node).locals = new SymbolTable();
  }

  function bindUnionStatement(node: UnionStatementNode) {
    declareSymbol(node, SymbolFlags.Union);
    mutate(node).locals = new SymbolTable();
  }

  function bindAliasStatement(node: AliasStatementNode) {
    declareSymbol(node, SymbolFlags.Alias);
    // Initialize locals for type parameters
    mutate(node).locals = new SymbolTable();
  }
  function bindConstStatement(node: ConstStatementNode) {
    declareSymbol(node, SymbolFlags.Const);
  }

  function bindEnumStatement(node: EnumStatementNode) {
    declareSymbol(node, SymbolFlags.Enum);
  }

  function bindNamespaceStatement(statement: NamespaceStatementNode) {
    const effectiveScope = fileNamespace ?? scope;
    // check if there's an existing symbol for this namespace
    const existingBinding = effectiveScope.symbol.exports!.get(statement.id.sv);
    if (existingBinding && existingBinding.flags & SymbolFlags.Namespace) {
      mutate(statement).symbol = existingBinding;
      // locals are never shared.
      mutate(statement).locals = createSymbolTable();
      mutate(existingBinding.declarations).push(statement);
    } else {
      // Initialize locals for non-exported symbols
      mutate(statement).locals = createSymbolTable();
      declareSymbol(statement, SymbolFlags.Namespace);
    }

    currentFile.namespaces.push(statement);

    if (statement.statements === undefined) {
      fileNamespace = statement;
      let current: TypeSpecScriptNode | NamespaceStatementNode = statement;
      while (current.kind !== SyntaxKind.TypeSpecScript) {
        (currentFile.inScopeNamespaces as NamespaceStatementNode[]).push(current);
        current = current.parent!;
      }
    }
  }

  function bindUsingStatement(statement: UsingStatementNode) {
    mutate(currentFile.usings).push(statement);
  }

  function bindOperationStatement(statement: OperationStatementNode) {
    if (scope.kind !== SyntaxKind.InterfaceStatement) {
      declareSymbol(statement, SymbolFlags.Operation);
    }
    mutate(statement).locals = createSymbolTable();
  }

  function bindDecoratorDeclarationStatement(node: DecoratorDeclarationStatementNode) {
    declareSymbol(node, SymbolFlags.Decorator | SymbolFlags.Declaration, `@${node.id.sv}`);
  }

  function bindFunctionDeclarationStatement(node: FunctionDeclarationStatementNode) {
    declareSymbol(node, SymbolFlags.Function | SymbolFlags.Declaration);
  }

  function bindFunctionParameter(node: FunctionParameterNode) {
    const symbol = createSymbol(node, node.id.sv, SymbolFlags.FunctionParameter, scope.symbol);
    mutate(node).symbol = symbol;
  }

  /**
   * Declare a symbole for the given node in the current scope.
   * @param node Node
   * @param flags Symbol flags
   * @param name Optional symbol name, default to the node id.
   * @returns Created Symbol
   */
  function declareSymbol(node: Declaration, flags: SymbolFlags, name?: string) {
    switch (scope.kind) {
      case SyntaxKind.NamespaceStatement:
        return declareNamespaceMember(node, flags, name);
      case SyntaxKind.TypeSpecScript:
      case SyntaxKind.JsSourceFile:
        return declareScriptMember(node, flags, name);
      default:
        const key = name ?? node.id.sv;
        const symbol = createSymbol(node, key, flags, scope?.symbol);
        mutate(node).symbol = symbol;
        mutate(scope.locals!).set(key, symbol);
        return symbol;
    }
  }

  function bindSymbol(node: Node, flags: SymbolFlags): Sym {
    const symbol = createSymbol(node, "-", flags, scope?.symbol);
    mutate(node).symbol = symbol;
    return symbol;
  }

  function declareNamespaceMember(node: Declaration, flags: SymbolFlags, name?: string) {
    if (
      flags & SymbolFlags.Namespace &&
      mergeNamespaceDeclarations(node as NamespaceStatementNode, scope)
    ) {
      return;
    }
    const key = name ?? node.id.sv;
    const symbol = createSymbol(node, key, flags, scope.symbol);
    mutate(node).symbol = symbol;
    mutate(scope.symbol.exports)!.set(key, symbol);
    return symbol;
  }

  function declareScriptMember(node: Declaration, flags: SymbolFlags, name?: string) {
    const effectiveScope = fileNamespace ?? scope;
    if (
      flags & SymbolFlags.Namespace &&
      mergeNamespaceDeclarations(node as NamespaceStatementNode, effectiveScope)
    ) {
      return;
    }
    const key = name ?? node.id.sv;
    const symbol = createSymbol(node, key, flags, fileNamespace?.symbol);
    mutate(node).symbol = symbol;
    mutate(effectiveScope.symbol.exports!).set(key, symbol);
    return symbol;
  }

  function mergeNamespaceDeclarations(node: NamespaceStatementNode, scope: ScopeNode) {
    // we are declaring a namespace in either global scope, or a blockless namespace.
    const existingBinding = scope.symbol.exports!.get(node.id.sv);
    if (existingBinding && existingBinding.flags & SymbolFlags.Namespace) {
      // we have an existing binding, so just push this node to its declarations
      mutate(existingBinding!.declarations).push(node);
      mutate(node).symbol = existingBinding;
      return true;
    }
    return false;
  }
}

function hasScope(node: Node): node is ScopeNode {
  switch (node.kind) {
    case SyntaxKind.ModelStatement:
    case SyntaxKind.ScalarStatement:
    case SyntaxKind.ConstStatement:
    case SyntaxKind.AliasStatement:
    case SyntaxKind.TypeSpecScript:
    case SyntaxKind.InterfaceStatement:
    case SyntaxKind.OperationStatement:
    case SyntaxKind.UnionStatement:
    case SyntaxKind.Projection:
    case SyntaxKind.ProjectionLambdaExpression:
      return true;
    case SyntaxKind.NamespaceStatement:
      return node.statements !== undefined;
    default:
      return false;
  }
}

export function createSymbol(
  node: Node | undefined,
  name: string,
  flags: SymbolFlags,
  parent?: Sym,
  value?: any
): Sym {
  let exports: SymbolTable | undefined;
  if (flags & SymbolFlags.ExportContainer) {
    exports = createSymbolTable();
  }
  let members: SymbolTable | undefined;
  if (flags & SymbolFlags.MemberContainer) {
    members = createSymbolTable();
  }

  return {
    declarations: node ? [node] : [],
    name,
    exports,
    members,
    flags,
    value,
    parent,
    metatypeMembers: createSymbolTable(),
  };
}
