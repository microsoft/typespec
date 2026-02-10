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
  DecoratorImplementations,
  EnumMemberNode,
  EnumStatementNode,
  FileLibraryMetadata,
  FunctionDeclarationStatementNode,
  FunctionParameterNode,
  InterfaceStatementNode,
  IntersectionExpressionNode,
  JsNamespaceDeclarationNode,
  JsSourceFileNode,
  ModelExpressionNode,
  ModelPropertyNode,
  ModelStatementNode,
  MutableSymbolTable,
  NamespaceStatementNode,
  Node,
  NodeFlags,
  OperationStatementNode,
  ScalarConstructorNode,
  ScalarStatementNode,
  ScopeNode,
  Sym,
  SymbolFlags,
  SymbolTable,
  SyntaxKind,
  TemplateParameterDeclarationNode,
  TypeSpecScriptNode,
  UnionStatementNode,
  UnionVariantNode,
  UsingStatementNode,
} from "./types.js";

// Use a regular expression to define the prefix for TypeSpec-exposed functions
// defined in JavaScript modules
const DecoratorFunctionPattern = /^\$/;
const SymbolTable = class extends Map<string, Sym> implements MutableSymbolTable {
  duplicates = new Map<Sym, Set<Sym>>();

  constructor(source?: SymbolTable) {
    super();
    if (source) {
      this.include(source);
    }
  }

  /** {@inheritdoc MutableSymboleTable} */
  include(source: SymbolTable, parentSym?: Sym) {
    for (const [key, value] of source) {
      super.set(key, { ...value, parent: parentSym ?? value.parent });
    }
    for (const [key, value] of source.duplicates) {
      this.duplicates.set(key, new Set(value));
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

    fileNamespace = undefined;
    mutate(sourceFile).symbol = createSymbol(
      sourceFile,
      sourceFile.file.path,
      SymbolFlags.SourceFile | SymbolFlags.Declaration,
    );
    const rootNs = sourceFile.esmExports["namespace"];

    for (const [key, member] of Object.entries(sourceFile.esmExports)) {
      let name: string;
      let kind: "decorator" | "function";
      if (key === "$flags") {
        const context = getLocationContext(program, sourceFile);
        if (context.type === "library" || context.type === "project") {
          mutate(context).flags = member as any;
        }
      } else if (key === "$decorators") {
        const value: DecoratorImplementations = member as any;
        for (const [namespaceName, decorators] of Object.entries(value)) {
          for (const [decoratorName, decorator] of Object.entries(decorators)) {
            bindFunctionImplementation(
              namespaceName === "" ? [] : namespaceName.split("."),
              "decorator",
              decoratorName,
              decorator,
              sourceFile,
            );
          }
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
        bindFunctionImplementation(nsParts, kind, name, member as any, sourceFile);
      }
    }
  }

  function bindFunctionImplementation(
    nsParts: string[],
    kind: "decorator" | "function",
    name: string,
    fn: (...args: any[]) => any,
    sourceFile: JsSourceFileNode,
  ) {
    let containerSymbol = sourceFile.symbol;

    const tracer = program.tracer.sub("bind.js");

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
      const sym = createSymbol(
        jsNamespaceNode,
        part,
        SymbolFlags.Namespace | SymbolFlags.Declaration,
        containerSymbol,
      );
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
      tracer.trace("decorator", `Bound decorator "@${name}" in namespace "${nsParts.join(".")}".`);
      sym = createSymbol(
        sourceFile,
        "@" + name,
        SymbolFlags.Decorator | SymbolFlags.Declaration | SymbolFlags.Implementation,
        containerSymbol,
      );
    } else {
      tracer.trace("function", `Bound function "${name}" in namespace "${nsParts.join(".")}".`);
      sym = createSymbol(
        sourceFile,
        name,
        SymbolFlags.Function | SymbolFlags.Declaration | SymbolFlags.Implementation,
        containerSymbol,
      );
    }
    mutate(sym).value = fn;
    mutate(containerSymbol.exports)!.set(sym.name, sym);
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
      case SyntaxKind.ModelProperty:
        bindModelProperty(node);
        break;
      case SyntaxKind.IntersectionExpression:
        bindIntersectionExpression(node);
        break;
      case SyntaxKind.ScalarStatement:
        bindScalarStatement(node);
        break;
      case SyntaxKind.ScalarConstructor:
        bindScalarConstructor(node);
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
      case SyntaxKind.EnumMember:
        bindEnumMember(node);
        break;
      case SyntaxKind.UnionVariant:
        bindUnionVariant(node);
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

      if (prevScope?.kind === SyntaxKind.TypeSpecScript && fileNamespace) {
        scope = fileNamespace;
      } else {
        scope = prevScope;
      }
    } else {
      visitChildren(node, bindNode);
    }

    // restore parent node
    parentNode = prevParent;
  }

  function bindTemplateParameterDeclaration(node: TemplateParameterDeclarationNode) {
    declareSymbol(node, SymbolFlags.TemplateParameter | SymbolFlags.Declaration);
  }

  function bindModelStatement(node: ModelStatementNode) {
    declareSymbol(node, SymbolFlags.Model | SymbolFlags.Declaration);
    // Initialize locals for type parameters
    mutate(node).locals = new SymbolTable();
  }

  function bindModelExpression(node: ModelExpressionNode) {
    if (node.id) {
      // When the model expression has a name, declare it in the enclosing namespace/script scope
      // so it can be referenced by name (e.g. from augment decorators).
      const prevScope = scope;
      scope = getEnclosingDeclarationScope();
      declareSymbol(node as unknown as Declaration, SymbolFlags.Model | SymbolFlags.Declaration);
      scope = prevScope;
    } else {
      bindSymbol(node, SymbolFlags.Model);
    }
  }

  function getEnclosingDeclarationScope(): ScopeNode {
    let current: Node | undefined = parentNode;
    while (current) {
      if (
        current.kind === SyntaxKind.TypeSpecScript ||
        current.kind === SyntaxKind.NamespaceStatement
      ) {
        return current as ScopeNode;
      }
      current = current.parent;
    }
    return scope;
  }

  function bindModelProperty(node: ModelPropertyNode) {
    declareMember(node, SymbolFlags.Member, node.id.sv);
  }

  function bindIntersectionExpression(node: IntersectionExpressionNode) {
    bindSymbol(node, SymbolFlags.Model);
  }

  function bindScalarStatement(node: ScalarStatementNode) {
    declareSymbol(node, SymbolFlags.Scalar | SymbolFlags.Declaration);
    // Initialize locals for type parameters
    mutate(node).locals = new SymbolTable();
  }

  function bindScalarConstructor(node: ScalarConstructorNode) {
    declareMember(node, SymbolFlags.Member, node.id.sv);
  }

  function bindInterfaceStatement(node: InterfaceStatementNode) {
    declareSymbol(node, SymbolFlags.Interface | SymbolFlags.Declaration);
    mutate(node).locals = new SymbolTable();
  }

  function bindUnionStatement(node: UnionStatementNode) {
    declareSymbol(node, SymbolFlags.Union | SymbolFlags.Declaration);
    mutate(node).locals = new SymbolTable();
  }

  function bindAliasStatement(node: AliasStatementNode) {
    declareSymbol(node, SymbolFlags.Alias | SymbolFlags.Declaration);
    // Initialize locals for type parameters
    mutate(node).locals = new SymbolTable();
  }
  function bindConstStatement(node: ConstStatementNode) {
    declareSymbol(node, SymbolFlags.Const | SymbolFlags.Declaration);
  }

  function bindEnumStatement(node: EnumStatementNode) {
    declareSymbol(node, SymbolFlags.Enum | SymbolFlags.Declaration);
  }

  function bindEnumMember(node: EnumMemberNode) {
    declareMember(node, SymbolFlags.Member, node.id.sv);
  }
  function bindUnionVariant(node: UnionVariantNode) {
    // cannot bind non named variant `union A { "a", "b"}`
    if (node.id) {
      declareMember(node, SymbolFlags.Member, node.id.sv);
    }
  }

  function bindNamespaceStatement(statement: NamespaceStatementNode) {
    const effectiveScope = scope;
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
      declareSymbol(statement, SymbolFlags.Namespace | SymbolFlags.Declaration);
    }

    currentFile.namespaces.push(statement);

    if (statement.statements === undefined) {
      fileNamespace = statement;
      scope = statement;
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
    if (scope.kind === SyntaxKind.InterfaceStatement) {
      declareMember(
        statement,
        SymbolFlags.Operation | SymbolFlags.Member | SymbolFlags.Declaration,
        statement.id.sv,
      );
    } else {
      declareSymbol(statement, SymbolFlags.Operation | SymbolFlags.Declaration);
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
    const symbol = createSymbol(
      node,
      node.id.sv,
      SymbolFlags.FunctionParameter | SymbolFlags.Declaration,
      scope.symbol,
    );
    mutate(node).symbol = symbol;
  }

  /**
   * Declare a symbol for the given node in the current scope.
   * @param node Node
   * @param flags Symbol flags
   * @param name Optional symbol name, default to the node id.
   * @returns Created Symbol
   */
  function declareSymbol(node: Declaration, flags: SymbolFlags, name?: string) {
    compilerAssert(flags & SymbolFlags.Declaration, `Expected declaration symbol: ${name}`, node);
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
    const effectiveScope = scope;
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

  /**
   * Declare a member of a model, enum, union, or interface.
   * @param node node of the member
   * @param flags symbol flags
   * @param name name of the symbol
   */
  function declareMember(
    node:
      | ModelPropertyNode
      | OperationStatementNode
      | EnumMemberNode
      | UnionVariantNode
      | ScalarConstructorNode,
    flags: SymbolFlags,
    name: string,
  ) {
    const symbol = createSymbol(node, name, flags, scope.symbol);
    mutate(node).symbol = symbol;
    mutate(scope.symbol.members!).set(name, symbol);
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
    case SyntaxKind.ModelExpression:
    case SyntaxKind.ScalarStatement:
    case SyntaxKind.ConstStatement:
    case SyntaxKind.AliasStatement:
    case SyntaxKind.TypeSpecScript:
    case SyntaxKind.InterfaceStatement:
    case SyntaxKind.OperationStatement:
    case SyntaxKind.UnionStatement:
    case SyntaxKind.EnumStatement:
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
  value?: any,
): Sym {
  let exports: SymbolTable | undefined;
  if (flags & SymbolFlags.ExportContainer) {
    exports = createSymbolTable();
  }
  let members: SymbolTable | undefined;
  if (flags & SymbolFlags.MemberContainer) {
    members = createSymbolTable();
  }

  compilerAssert(
    !(flags & SymbolFlags.Declaration) || node !== undefined,
    "Declaration without node",
  );

  return {
    declarations: flags & SymbolFlags.Declaration ? [node!] : [],
    node: !(flags & SymbolFlags.Declaration) ? node : (undefined as any),
    name,
    exports,
    members,
    flags,
    value,
    parent,
    metatypeMembers: createSymbolTable(),
  };
}

/**
 * Get the node attached to this symbol.
 * If a declaration symbol get the first one `.declarations[0]`
 * Otherwise get `.node`
 */
export function getSymNode(sym: Sym): Node {
  return sym.flags & SymbolFlags.Declaration ? sym.declarations[0] : sym.node;
}
