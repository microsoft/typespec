/**
 * The name resolver is responsible for resolving identifiers to symbols and
 * creating symbols for types that become known during this process. After name
 * resolution, we can do some limited analysis of the reference graph in order
 * to support e.g. augment decorators.
 *
 * Name resolution does not alter any AST nodes or attached symbols in order to
 * ensure AST nodes and attached symbols can be trivially reused between
 * compilations. Instead, symbols created here are either stored in augmented
 * symbol tables or as merged symbols. Any metadata about symbols and nodes are
 * stored in symbol links and node links respectively. The resolver provides
 * APIs for managing this metadata which is useful during later phases.
 *
 * While we resolve some identifiers to symbols during this phase, we often
 * cannot say for sure that an identifier does not exist. Some symbols must be
 * late-bound because the symbol does not become known until after the program
 * has been checked. A common example is members of a model template which often
 * cannot be known until the template is instantiated. Instead, we mark that the
 * reference is unknown and will resolve the symbol (or report an error if it
 * doesn't exist) in later phases. These unknown references cannot be used as
 * the target of an augment decorator.
 *
 * There are some errors we can detect because we have complete symbol
 * information, but we do not report them from here. For example, because we
 * know all namespace bindings and all the declarations inside of them, we could
 * in principle report an error when we attempt to `using` something that isn't
 * a namespace. However, giving a good error message sometimes requires knowing
 * what type was mistakenly referenced, so we merely mark that resolution has
 * failed and move on. Even in cases where we could give a good error we chose
 * not to in order to uniformly handle error reporting in the checker.
 *
 * Name resolution has three sub-phases:
 *
 * 1. Merge namespace symbols and decorator implementation/declaration symbols
 * 2. Resolve using references to namespaces and create namespace-local bindings
 *    for used symbols
 * 3. Resolve type references and bind members
 *
 * The reference resolution and member binding phase implements a deferred
 * resolution strategy. Often we cannot resolve a reference without binding
 * members, but we often cannot bind members without resolving references. In
 * such situations, we stop resolving or binding the current reference or type
 * and attempt to resolve or bind the reference or type it depends on. Once we
 * have done so, we return to the original reference or type and complete our
 * work.
 *
 * This is accomplished by doing a depth-first traversal of the reference graph.
 * On the way down, we discover any dependencies that need to be resolved or
 * bound for the current node, and recurse into the AST nodes, so that on the
 * way back up, all of our dependencies are bound and resolved and we can
 * complete. So while we start with a depth-first traversal of the ASTs in order
 * to discover work to do, most of the actual work is done while following the
 * reference graph, binding and resolving along the way. Circular references are
 * discovered during the reference graph walk and marked as such. Symbol and
 * node links are used to ensure we never resolve the same reference twice. The
 * checker implements a very similar algorithm to evaluate the types of the
 * program.
 **/

import { Mutable, mutate } from "../utils/misc.js";
import { createSymbol, createSymbolTable, getSymNode } from "./binder.js";
import { compilerAssert } from "./diagnostics.js";
import { visitChildren } from "./parser.js";
import { Program } from "./program.js";
import {
  AliasStatementNode,
  AugmentDecoratorStatementNode,
  DecoratorExpressionNode,
  EnumStatementNode,
  Expression,
  IdentifierNode,
  InterfaceStatementNode,
  IntersectionExpressionNode,
  MemberExpressionNode,
  ModelExpressionNode,
  ModelPropertyNode,
  ModelStatementNode,
  NamespaceStatementNode,
  Node,
  NodeFlags,
  NodeLinks,
  OperationStatementNode,
  ProjectionDecoratorReferenceExpressionNode,
  ProjectionStatementNode,
  ResolutionResult,
  ResolutionResultFlags,
  ScalarStatementNode,
  Sym,
  SymbolFlags,
  SymbolLinks,
  SymbolTable,
  SyntaxKind,
  TemplateParameterDeclarationNode,
  TypeReferenceNode,
  TypeSpecScriptNode,
  UnionStatementNode,
} from "./types.js";

export interface NameResolver {
  /**
   * Resolve all static symbol links in the program.
   */
  resolveProgram(): void;

  /**
   * Get the merged symbol or itself if not merged.
   * This is the case for Namespace which have multiple nodes and symbol but all reference the same merged one.
   */
  getMergedSymbol(sym: Sym): Sym;

  /**
   * Get augmented symbol table.
   */
  getAugmentedSymbolTable(table: SymbolTable): Mutable<SymbolTable>;
  /**
   * Get node links for the given syntax node.
   * This returns links to which symbol the node reference if applicable(TypeReference, Identifier nodes)
   */
  getNodeLinks(node: Node): NodeLinks;

  /** Get symbol links for the given symbol */
  getSymbolLinks(symbol: Sym): SymbolLinks;

  /** Return augment decorator nodes that are bound to this symbol */
  getAugmentDecoratorsForSym(symbol: Sym): AugmentDecoratorStatementNode[];

  /**
   * Resolve the member expression using the given symbol as base.
   * This can be used to follow the name resolution for template instance which are not statically linked.
   */
  resolveMemberExpressionForSym(
    sym: Sym,
    node: MemberExpressionNode,
    options?: ResolveTypReferenceOptions,
  ): ResolutionResult;

  /** Get the meta member by name */
  resolveMetaMemberByName(sym: Sym, name: string): ResolutionResult;

  /** Resolve the given type reference. This should only need to be called on dynamically created nodes that want to resolve which symbol they reference */
  resolveTypeReference(
    node: TypeReferenceNode | IdentifierNode | MemberExpressionNode,
  ): ResolutionResult;

  /** Built-in symbols. */
  readonly symbols: {
    /** Symbol for the global namespace */
    readonly global: Sym;

    /** Symbol for the null type */
    readonly null: Sym;
  };
}

interface ResolveTypReferenceOptions {
  resolveDecorators?: boolean;
}

// This needs to be global to be sure to not reallocate per program.
let currentNodeId = 0;
let currentSymbolId = 0;

export function createResolver(program: Program): NameResolver {
  const mergedSymbols = new Map<Sym, Sym>();
  const augmentedSymbolTables = new Map<SymbolTable, SymbolTable>();
  const nodeLinks = new Map<number, NodeLinks>();
  const symbolLinks = new Map<number, SymbolLinks>();

  const globalNamespaceNode = createGlobalNamespaceNode();
  const globalNamespaceSym = createSymbol(
    globalNamespaceNode,
    "global",
    SymbolFlags.Namespace | SymbolFlags.Declaration,
  );
  mutate(globalNamespaceNode).symbol = globalNamespaceSym;
  mutate(globalNamespaceSym.exports).set(globalNamespaceNode.id.sv, globalNamespaceSym);

  const metaTypePrototypes = createMetaTypePrototypes();

  const nullSym = createSymbol(undefined, "null", SymbolFlags.None);
  const augmentDecoratorsForSym = new Map<Sym, AugmentDecoratorStatementNode[]>();

  return {
    symbols: { global: globalNamespaceSym, null: nullSym },
    resolveProgram() {
      // Merge namespace symbols and decorator implementation/declaration symbols
      for (const file of program.jsSourceFiles.values()) {
        mergeSymbolTable(file.symbol.exports!, mutate(globalNamespaceSym.exports!));
      }

      for (const file of program.sourceFiles.values()) {
        mergeSymbolTable(file.symbol.exports!, mutate(globalNamespaceSym.exports!));
      }

      const typespecNamespaceBinding = globalNamespaceSym.exports!.get("TypeSpec");
      if (typespecNamespaceBinding) {
        mutate(typespecNamespaceBinding!.exports).set("null", nullSym);
        for (const file of program.sourceFiles.values()) {
          addUsingSymbols(typespecNamespaceBinding.exports!, file.locals);
        }
      }

      // Bind usings to namespaces, create namespace-local bindings for used symbols
      for (const file of program.sourceFiles.values()) {
        setUsingsForFile(file);
      }

      // Begin reference graph walk starting at each node to ensure we visit all possible
      // references and types that need binding.
      for (const file of program.sourceFiles.values()) {
        bindAndResolveNode(file);
      }
    },

    getMergedSymbol,
    getAugmentedSymbolTable,
    getNodeLinks,
    getSymbolLinks,

    resolveMemberExpressionForSym,
    resolveMetaMemberByName,
    resolveTypeReference,

    getAugmentDecoratorsForSym,
  };

  function getAugmentDecoratorsForSym(sym: Sym) {
    return augmentDecoratorsForSym.get(sym) ?? [];
  }

  function getMergedSymbol(sym: Sym) {
    if (!sym) return sym;
    return mergedSymbols.get(sym) || sym;
  }

  /**
   * @internal
   */
  function getNodeLinks(n: Node): NodeLinks {
    const id = getNodeId(n);

    if (nodeLinks.has(id)) {
      return nodeLinks.get(id)!;
    }

    const links = {};
    nodeLinks.set(id, links);

    return links;
  }

  function getNodeId(n: Node) {
    if (n._id === undefined) {
      mutate(n)._id = currentNodeId++;
    }
    return n._id!;
  }

  /**
   * @internal
   */
  function getSymbolLinks(s: Sym): SymbolLinks {
    const id = getSymbolId(s);

    if (symbolLinks.has(id)) {
      return symbolLinks.get(id)!;
    }

    const links = {};
    symbolLinks.set(id, links);

    return links;
  }

  function getSymbolId(s: Sym) {
    if (s.id === undefined) {
      mutate(s).id = currentSymbolId++;
    }
    return s.id!;
  }

  function resolveTypeReference(
    node: TypeReferenceNode | MemberExpressionNode | IdentifierNode,
    options: ResolveTypReferenceOptions = {},
  ): ResolutionResult {
    const links = getNodeLinks(node);
    if (links.resolutionResult) {
      return links as any;
    }

    let result = resolveTypeReferenceWorker(node, options);

    const resolvedSym = result.resolvedSymbol;
    Object.assign(links, result);

    if (resolvedSym && resolvedSym.flags & SymbolFlags.Alias) {
      // unwrap aliases
      const aliasNode = resolvedSym.declarations[0] as AliasStatementNode;
      const aliasResult = resolveAlias(aliasNode);
      // For alias if the alias itself is a template declaration then its not actually instantiating the reference
      const isTemplateInstantiation =
        aliasResult.isTemplateInstantiation && aliasNode.templateParameters.length === 0;
      if (isTemplateInstantiation) {
        links.isTemplateInstantiation = true;
      }
      if (aliasResult.finalSymbol) {
        links.finalSymbol = aliasResult.finalSymbol;
      }
      result = {
        ...aliasResult,
        finalSymbol: links.finalSymbol,
        isTemplateInstantiation: result.isTemplateInstantiation || isTemplateInstantiation,
      };
    } else if (resolvedSym && resolvedSym.flags & SymbolFlags.TemplateParameter) {
      // references to template parameters with constraints can reference the
      // constraint type members
      const templateNode = resolvedSym.declarations[0] as TemplateParameterDeclarationNode;
      if (templateNode.constraint) {
        result = resolveTemplateParameter(templateNode);
      }
    }

    // make sure we've bound and fully resolved the referenced
    // node before returning it.
    if (resolvedSym) {
      if (
        resolvedSym.flags & SymbolFlags.Declaration &&
        ~resolvedSym.flags & SymbolFlags.Namespace
      ) {
        bindAndResolveNode(resolvedSym.declarations[0]);
      }
    }

    return result;
  }

  function resolveTypeReferenceWorker(
    node: TypeReferenceNode | MemberExpressionNode | IdentifierNode,
    options: ResolveTypReferenceOptions,
  ): ResolutionResult {
    if (node.kind === SyntaxKind.TypeReference) {
      const result = resolveTypeReference(node.target, options);
      return node.arguments.length > 0 ? { ...result, isTemplateInstantiation: true } : result;
    } else if (node.kind === SyntaxKind.MemberExpression) {
      return resolveMemberExpression(node, options);
    } else if (node.kind === SyntaxKind.Identifier) {
      return resolveIdentifier(node, options);
    }

    compilerAssert(false, "Unexpected node kind");
  }

  function resolveMemberExpression(
    node: MemberExpressionNode,
    options: ResolveTypReferenceOptions,
  ): ResolutionResult {
    const baseResult = resolveTypeReference(node.base, {
      ...options,
      resolveDecorators: false, // When resolving the base it can never be a decorator
    });

    if (baseResult.resolutionResult & ResolutionResultFlags.ResolutionFailed) {
      return baseResult;
    }
    const baseSym = baseResult.finalSymbol;

    compilerAssert(baseSym, "Base symbol must be defined if resolution did not fail");
    const memberResult = resolveMemberExpressionForSym(baseSym, node, options);

    const idNodeLinks = getNodeLinks(node.id);
    idNodeLinks.resolvedSymbol = memberResult.resolvedSymbol;
    idNodeLinks.resolutionResult = memberResult.resolutionResult;
    const isTemplateInstantiation =
      baseResult.isTemplateInstantiation || memberResult.isTemplateInstantiation;
    idNodeLinks.isTemplateInstantiation = isTemplateInstantiation;
    return {
      ...memberResult,
      isTemplateInstantiation,
    };
  }

  function resolveMemberExpressionForSym(
    baseSym: Sym,
    node: MemberExpressionNode,
    options: ResolveTypReferenceOptions = {},
  ): ResolutionResult {
    if (node.selector === ".") {
      if (baseSym.flags & SymbolFlags.MemberContainer) {
        return resolveMember(baseSym, node.id);
      } else if (baseSym.flags & SymbolFlags.ExportContainer) {
        const res = resolveExport(getMergedSymbol(baseSym), node.id, options);
        return res;
      }
    } else {
      return resolveMetaMember(baseSym, node.id);
    }

    return failedResult(ResolutionResultFlags.NotFound);
  }

  function resolveMember(baseSym: Sym, id: IdentifierNode): ResolutionResult {
    const baseNode = baseSym.node ?? baseSym.declarations[0];
    compilerAssert(baseNode, "Base symbol must have an associated node");

    bindMemberContainer(baseNode);

    switch (baseNode.kind) {
      case SyntaxKind.ModelStatement:
      case SyntaxKind.ModelExpression:
      case SyntaxKind.IntersectionExpression:
        return resolveModelMember(baseSym, baseNode, id);
      case SyntaxKind.InterfaceStatement:
        return resolveInterfaceMember(baseSym, id);
      case SyntaxKind.EnumStatement:
        return resolveEnumMember(baseSym, id);
      case SyntaxKind.UnionStatement:
        return resolveUnionVariant(baseSym, id);
      case SyntaxKind.ScalarStatement:
        return resolveScalarConstructor(baseSym, id);
    }

    compilerAssert(false, "Unknown member container kind: " + SyntaxKind[baseNode.kind]);
  }

  function resolvedResult(resolvedSymbol: Sym): ResolutionResult {
    return {
      resolvedSymbol,
      finalSymbol: resolvedSymbol,
      resolutionResult: ResolutionResultFlags.Resolved,
    };
  }
  function failedResult(resolutionResult: ResolutionResultFlags): ResolutionResult {
    return {
      resolvedSymbol: undefined,
      finalSymbol: undefined,
      resolutionResult,
    };
  }

  function ambiguousResult(symbols: Sym[]): ResolutionResult {
    return {
      resolutionResult: ResolutionResultFlags.Ambiguous,
      resolvedSymbol: undefined,
      finalSymbol: undefined,
      ambiguousSymbols: symbols,
    };
  }

  function resolveModelMember(
    modelSym: Sym,
    modelNode: ModelStatementNode | ModelExpressionNode | IntersectionExpressionNode,
    id: IdentifierNode,
  ): ResolutionResult {
    // step 1: check direct members
    // spreads have already been bound
    const memberSym = tableLookup(modelSym.members!, id);
    if (memberSym) {
      return resolvedResult(memberSym);
    }

    const modelSymLinks = getSymbolLinks(modelSym);

    // step 2: check extends. Don't look up to extends references if we have
    // unknown members, and resolve any property as unknown if we extend
    // something unknown.
    const extendsRef = modelNode.kind === SyntaxKind.ModelStatement ? modelNode.extends : undefined;
    if (
      extendsRef &&
      extendsRef.kind === SyntaxKind.TypeReference &&
      !modelSymLinks.hasUnknownMembers
    ) {
      const { finalSymbol: extendsSym, resolutionResult: extendsResult } =
        resolveTypeReference(extendsRef);
      if (extendsResult & ResolutionResultFlags.Resolved) {
        return resolveMember(extendsSym!, id);
      }

      if (extendsResult & ResolutionResultFlags.Unknown) {
        modelSymLinks.hasUnknownMembers = true;
        return failedResult(ResolutionResultFlags.Unknown);
      }
    }

    // step 3: return either unknown or not found depending on whether we have
    // unknown members
    return failedResult(
      modelSymLinks.hasUnknownMembers
        ? ResolutionResultFlags.Unknown
        : ResolutionResultFlags.NotFound,
    );
  }

  function resolveInterfaceMember(ifaceSym: Sym, id: IdentifierNode): ResolutionResult {
    const slinks = getSymbolLinks(ifaceSym);
    const memberSym = tableLookup(ifaceSym.members!, id);
    if (memberSym) {
      return resolvedResult(memberSym);
    }

    return failedResult(
      slinks.hasUnknownMembers ? ResolutionResultFlags.Unknown : ResolutionResultFlags.NotFound,
    );
  }

  function resolveEnumMember(enumSym: Sym, id: IdentifierNode): ResolutionResult {
    const memberSym = tableLookup(enumSym.members!, id);
    if (memberSym) {
      return resolvedResult(memberSym);
    }

    return failedResult(ResolutionResultFlags.NotFound);
  }

  function resolveUnionVariant(unionSym: Sym, id: IdentifierNode): ResolutionResult {
    const memberSym = tableLookup(unionSym.members!, id);
    if (memberSym) {
      return resolvedResult(memberSym);
    }
    return failedResult(ResolutionResultFlags.NotFound);
  }

  function resolveScalarConstructor(scalarSym: Sym, id: IdentifierNode): ResolutionResult {
    const memberSym = tableLookup(scalarSym.members!, id);
    if (memberSym) {
      return resolvedResult(memberSym);
    }

    return failedResult(ResolutionResultFlags.NotFound);
  }

  function resolveExport(
    baseSym: Sym,
    id: IdentifierNode,
    options: ResolveTypReferenceOptions,
  ): ResolutionResult {
    const node = baseSym.declarations[0];
    compilerAssert(
      node.kind === SyntaxKind.NamespaceStatement ||
        node.kind === SyntaxKind.TypeSpecScript ||
        node.kind === SyntaxKind.JsNamespaceDeclaration,
      `Unexpected node kind ${SyntaxKind[node.kind]}`,
    );
    const exportSym = tableLookup(baseSym.exports!, id, options.resolveDecorators);
    if (!exportSym) {
      return failedResult(ResolutionResultFlags.NotFound);
    }
    return resolvedResult(exportSym);
  }

  function resolveAlias(node: AliasStatementNode): ResolutionResult {
    const symbol = node.symbol;
    const slinks = getSymbolLinks(symbol);

    if (slinks.aliasResolutionResult) {
      return {
        resolutionResult: slinks.aliasResolutionResult,
        resolvedSymbol: slinks.aliasedSymbol,
        finalSymbol: slinks.aliasedSymbol,
        isTemplateInstantiation: slinks.aliasResolutionIsTemplate,
      };
    }

    if (node.value.kind === SyntaxKind.TypeReference) {
      const result = resolveTypeReference(node.value);
      if (result.finalSymbol && result.finalSymbol.flags & SymbolFlags.Alias) {
        const aliasLinks = getSymbolLinks(result.finalSymbol);
        slinks.aliasedSymbol = aliasLinks.aliasedSymbol
          ? aliasLinks.aliasedSymbol
          : result.finalSymbol;
      } else {
        slinks.aliasedSymbol = result.finalSymbol;
      }
      slinks.aliasResolutionResult = result.resolutionResult;
      slinks.aliasResolutionIsTemplate = result.isTemplateInstantiation;
      return {
        resolvedSymbol: result.resolvedSymbol,
        finalSymbol: slinks.aliasedSymbol,
        resolutionResult: slinks.aliasResolutionResult,
        isTemplateInstantiation: result.isTemplateInstantiation,
      };
    } else if (node.value.symbol) {
      // a type literal
      slinks.aliasedSymbol = node.value.symbol;
      slinks.aliasResolutionResult = ResolutionResultFlags.Resolved;
      return resolvedResult(node.value.symbol);
    } else {
      // a computed type
      slinks.aliasResolutionResult = ResolutionResultFlags.Unknown;
      return failedResult(ResolutionResultFlags.Unknown);
    }
  }

  function resolveTemplateParameter(node: TemplateParameterDeclarationNode): ResolutionResult {
    const symbol = node.symbol;
    const slinks = getSymbolLinks(symbol);

    if (!node.constraint) {
      return resolvedResult(node.symbol);
    }

    if (slinks.constraintResolutionResult) {
      return {
        finalSymbol: slinks.constraintSymbol,
        resolvedSymbol: slinks.constraintSymbol,
        resolutionResult: slinks.constraintResolutionResult,
      };
    }

    if (node.constraint && node.constraint.kind === SyntaxKind.TypeReference) {
      const result = resolveTypeReference(node.constraint);
      slinks.constraintSymbol = result.finalSymbol;
      slinks.constraintResolutionResult = result.resolutionResult;
      return result;
    } else if (node.constraint.symbol) {
      // a type literal
      slinks.constraintSymbol = node.constraint.symbol;
      slinks.constraintResolutionResult = ResolutionResultFlags.Resolved;
      return resolvedResult(node.constraint.symbol);
    } else {
      // a computed type, just resolve to the template parameter symbol itself.
      slinks.constraintSymbol = node.symbol;
      slinks.constraintResolutionResult = ResolutionResultFlags.Resolved;
      return resolvedResult(node.symbol);
    }
  }
  function resolveExpression(node: Expression): ResolutionResult {
    if (node.kind === SyntaxKind.TypeReference) {
      return resolveTypeReference(node);
    }

    if (node.symbol) {
      return resolvedResult(node.symbol);
    }

    return failedResult(ResolutionResultFlags.Unknown);
  }

  function resolveMetaMember(baseSym: Sym, id: IdentifierNode): ResolutionResult {
    return resolveMetaMemberByName(baseSym, id.sv);
  }

  function resolveMetaMemberByName(baseSym: Sym, sv: string): ResolutionResult {
    const baseNode = getSymNode(baseSym);

    const prototype = metaTypePrototypes.get(baseNode.kind);

    if (!prototype) {
      return failedResult(ResolutionResultFlags.NotFound);
    }

    const getter = prototype.get(sv);

    if (!getter) {
      return failedResult(ResolutionResultFlags.NotFound);
    }

    return getter(baseSym);
  }

  function tableLookup(table: SymbolTable, node: IdentifierNode, resolveDecorator = false) {
    table = augmentedSymbolTables.get(table) ?? table;
    let sym;
    if (resolveDecorator) {
      sym = table.get("@" + node.sv);
    } else {
      sym = table.get(node.sv);
    }

    if (!sym) return sym;

    return getMergedSymbol(sym);
  }

  /**
   * This method will take a member container and compute all the known member
   * symbols. It will determine whether it has unknown members and set the
   * symbol link value appropriately. This is used during resolution to know if
   * member resolution should return `unknown` when a member isn't found.
   */
  function bindMemberContainer(node: Node) {
    const sym = node.symbol!;
    const symLinks = getSymbolLinks(sym);

    if (symLinks.membersBound) {
      return;
    }

    symLinks.membersBound = true;

    switch (node.kind) {
      case SyntaxKind.ModelStatement:
      case SyntaxKind.ModelExpression:
        bindModelMembers(node);
        return;
      case SyntaxKind.IntersectionExpression:
        bindIntersectionMembers(node);
        return;
      case SyntaxKind.InterfaceStatement:
        bindInterfaceMembers(node);
        return;
      case SyntaxKind.EnumStatement:
        bindEnumMembers(node);
        return;
      case SyntaxKind.UnionStatement:
        bindUnionMembers(node);
        return;
      case SyntaxKind.ScalarStatement:
        bindScalarMembers(node);
        return;
    }
  }

  // TODO: had to keep the metaTypeMembers which this pr originally tried to get rid as we need for ops parameters to be cloned and have a new reference
  function bindOperationStatementParameters(node: OperationStatementNode) {
    const targetTable = getAugmentedSymbolTable(node.symbol!.metatypeMembers!);
    if (node.signature.kind === SyntaxKind.OperationSignatureDeclaration) {
      const { finalSymbol: sym } = resolveExpression(node.signature.parameters);
      if (sym) {
        targetTable.set("parameters", sym);
      }
    } else {
      const { finalSymbol: sig } = resolveTypeReference(node.signature.baseOperation);
      if (sig) {
        const sigTable = getAugmentedSymbolTable(sig.metatypeMembers!);
        const sigParameterSym = sigTable.get("parameters")!;
        if (sigParameterSym !== undefined) {
          const parametersSym = createSymbol(
            sigParameterSym.node,
            "parameters",
            SymbolFlags.Model & SymbolFlags.MemberContainer,
          );
          getAugmentedSymbolTable(parametersSym.members!).include(
            getAugmentedSymbolTable(sigParameterSym.members!),
            parametersSym,
          );
          targetTable.set("parameters", parametersSym);
          targetTable.set("returnType", sigTable.get("returnType")!);
        }
      }
    }
  }

  function bindDeclarationIdentifier(node: Node & { id: IdentifierNode }) {
    if (node.kind === SyntaxKind.TypeSpecScript || node.kind === SyntaxKind.JsSourceFile) return;
    const links = getNodeLinks(node.id);
    let sym;
    if (node.symbol === undefined) {
      return;
    }
    if (node.symbol.flags & SymbolFlags.Member) {
      compilerAssert(node.parent, "Node should have a parent");
      const parentSym = getMergedSymbol(node.parent.symbol);
      const table = parentSym.exports ?? getAugmentedSymbolTable(parentSym.members!);
      sym = table.get(node.id.sv);
    } else {
      sym = node.symbol;
    }
    compilerAssert(sym, "Should have a symbol");
    links.resolvedSymbol = sym;
    links.resolutionResult = ResolutionResultFlags.Resolved;
  }
  function bindModelMembers(node: ModelStatementNode | ModelExpressionNode) {
    const modelSym = node.symbol!;

    const modelSymLinks = getSymbolLinks(modelSym);

    const targetTable = getAugmentedSymbolTable(modelSym.members!);

    const isRef = node.kind === SyntaxKind.ModelStatement ? node.is : undefined;
    if (isRef && isRef.kind === SyntaxKind.TypeReference) {
      const { finalSymbol: isSym, resolutionResult: isResult } = resolveTypeReference(isRef);

      setUnknownMembers(modelSymLinks, isSym, isResult);

      if (isResult & ResolutionResultFlags.Resolved && isSym!.flags & SymbolFlags.Model) {
        const sourceTable = getAugmentedSymbolTable(isSym!.members!);
        targetTable.include(sourceTable, modelSym);
      }
    }

    // here we just need to check if we're extending something with unknown symbols
    const extendsRef = node.kind === SyntaxKind.ModelStatement ? node.extends : undefined;
    if (extendsRef && extendsRef.kind === SyntaxKind.TypeReference) {
      const { finalSymbol: sym, resolutionResult: result } = resolveTypeReference(extendsRef);
      setUnknownMembers(modelSymLinks, sym, result);
    }

    // here we just need to include spread properties, since regular properties
    // were bound by the binder.
    for (const propertyNode of node.properties) {
      if (propertyNode.kind !== SyntaxKind.ModelSpreadProperty) {
        continue;
      }

      const { finalSymbol: sourceSym, resolutionResult: sourceResult } = resolveTypeReference(
        propertyNode.target,
      );

      setUnknownMembers(modelSymLinks, sourceSym, sourceResult);

      if (~sourceResult & ResolutionResultFlags.Resolved) {
        continue;
      }
      compilerAssert(sourceSym, "Spread symbol must be defined if resolution succeeded");

      if (~sourceSym.flags & SymbolFlags.Model) {
        // will be a checker error
        continue;
      }

      const sourceTable = getAugmentedSymbolTable(sourceSym.members!);
      targetTable.include(sourceTable, modelSym);
    }
  }

  function bindIntersectionMembers(node: IntersectionExpressionNode) {
    const intersectionSym = node.symbol!;
    const intersectionSymLinks = getSymbolLinks(intersectionSym);

    const targetTable = getAugmentedSymbolTable(intersectionSym.members!);

    // here we just need to include spread properties, since regular properties
    // were bound by the binder.
    for (const expr of node.options) {
      const { finalSymbol: sourceSym, resolutionResult: sourceResult } = resolveExpression(expr);

      setUnknownMembers(intersectionSymLinks, sourceSym, sourceResult);

      if (~sourceResult & ResolutionResultFlags.Resolved) {
        continue;
      }
      compilerAssert(sourceSym, "Spread symbol must be defined if resolution succeeded");

      if (~sourceSym.flags & SymbolFlags.Model) {
        // will be a checker error
        continue;
      }

      const sourceTable = getAugmentedSymbolTable(sourceSym.members!);
      targetTable.include(sourceTable, intersectionSym);
    }
  }

  function setUnknownMembers(
    targetSymLinks: SymbolLinks,
    sym: Sym | undefined,
    result: ResolutionResultFlags,
  ) {
    if (result & ResolutionResultFlags.Unknown) {
      targetSymLinks.hasUnknownMembers = true;
    } else if (result & ResolutionResultFlags.Resolved) {
      const isSymLinks = getSymbolLinks(sym!);
      if (isSymLinks.hasUnknownMembers) {
        targetSymLinks.hasUnknownMembers = true;
      }
    }
  }

  function bindInterfaceMembers(node: InterfaceStatementNode) {
    const ifaceSym = node.symbol!;
    const ifaceSymLinks = getSymbolLinks(ifaceSym);
    for (const extendsRef of node.extends) {
      const { finalSymbol: extendsSym, resolutionResult: extendsResult } =
        resolveTypeReference(extendsRef);
      setUnknownMembers(ifaceSymLinks, extendsSym, extendsResult);

      if (~extendsResult & ResolutionResultFlags.Resolved) {
        continue;
      }

      compilerAssert(extendsSym, "Extends symbol must be defined if resolution succeeded");

      if (~extendsSym.flags & SymbolFlags.Interface) {
        // will be a checker error
        continue;
      }

      const sourceTable = getAugmentedSymbolTable(extendsSym.members!);
      const targetTable = getAugmentedSymbolTable(ifaceSym.members!);
      targetTable.include(sourceTable, ifaceSym);
    }
  }

  function bindEnumMembers(node: EnumStatementNode) {
    const enumSym = node.symbol!;
    const enumSymLinks = getSymbolLinks(enumSym);
    const targetTable = getAugmentedSymbolTable(enumSym.members!);

    for (const memberNode of node.members) {
      if (memberNode.kind !== SyntaxKind.EnumSpreadMember) {
        continue;
      }

      const { finalSymbol: sourceSym, resolutionResult: sourceResult } = resolveTypeReference(
        memberNode.target,
      );

      setUnknownMembers(enumSymLinks, sourceSym, sourceResult);

      if (~sourceResult & ResolutionResultFlags.Resolved) {
        continue;
      }

      compilerAssert(sourceSym, "Spread symbol must be defined if resolution succeeded");

      if (~sourceSym.flags & SymbolFlags.Enum) {
        // will be a checker error
        continue;
      }

      const sourceTable = getAugmentedSymbolTable(sourceSym.members!);
      targetTable.include(sourceTable, enumSym);
    }
  }

  function bindUnionMembers(node: UnionStatementNode) {
    // Everything is already bound in binder.ts
  }
  function bindScalarMembers(node: ScalarStatementNode) {
    const scalarSym = node.symbol!;
    const targetTable = getAugmentedSymbolTable(scalarSym.members!);
    const scalarSymLinks = getSymbolLinks(scalarSym);

    if (node.extends) {
      const { finalSymbol: extendsSym, resolutionResult: extendsResult } = resolveTypeReference(
        node.extends,
      );
      setUnknownMembers(scalarSymLinks, extendsSym, extendsResult);

      if (~extendsResult & ResolutionResultFlags.Resolved) {
        return;
      }
      compilerAssert(extendsSym, "Scalar extends symbol must be defined if resolution succeeded");

      const sourceTable = getAugmentedSymbolTable(extendsSym.members!);
      targetTable.include(sourceTable, scalarSym);
    }
  }

  function bindTemplateParameter(node: TemplateParameterDeclarationNode) {
    const sym = node.symbol;
    const links = getSymbolLinks(sym);
    links.hasUnknownMembers = true;
  }

  function resolveIdentifier(
    node: IdentifierNode,
    options: ResolveTypReferenceOptions,
  ): ResolutionResult {
    let scope: Node | undefined = node.parent;
    let binding: Sym | undefined;

    while (scope && scope.kind !== SyntaxKind.TypeSpecScript) {
      if (scope.symbol && scope.symbol.flags & SymbolFlags.ExportContainer) {
        const mergedSymbol = getMergedSymbol(scope.symbol);
        binding = tableLookup(mergedSymbol.exports!, node, options.resolveDecorators);
        if (binding) return resolvedResult(binding);
      }

      if ("locals" in scope && scope.locals !== undefined) {
        binding = tableLookup(scope.locals, node, options.resolveDecorators);
        if (binding) {
          return resolvedResult(binding);
        }
      }

      scope = scope.parent;
    }

    if (!binding && scope && scope.kind === SyntaxKind.TypeSpecScript) {
      // check any blockless namespace decls
      for (const ns of scope.inScopeNamespaces) {
        const mergedSymbol = getMergedSymbol(ns.symbol);
        binding = tableLookup(mergedSymbol.exports!, node, options.resolveDecorators);

        if (binding) return resolvedResult(binding);
      }

      // check "global scope" declarations
      const globalBinding = tableLookup(
        globalNamespaceNode.symbol.exports!,
        node,
        options.resolveDecorators,
      );

      // check using types
      const usingBinding = tableLookup(scope.locals, node, options.resolveDecorators);

      if (globalBinding && usingBinding) {
        return ambiguousResult([globalBinding, usingBinding]);
      } else if (globalBinding) {
        return resolvedResult(globalBinding);
      } else if (usingBinding) {
        if (usingBinding.flags & SymbolFlags.DuplicateUsing) {
          return ambiguousResult([
            ...((augmentedSymbolTables.get(scope.locals)?.duplicates.get(usingBinding) as any) ??
              []),
          ]);
        }
        return resolvedResult(usingBinding.symbolSource!);
      }
    }

    return failedResult(ResolutionResultFlags.Unknown);
  }

  /**
   * We cannot inject symbols into the symbol tables hanging off syntax tree nodes as
   * syntax tree nodes can be shared by other programs. This is called as a copy-on-write
   * to inject using and late-bound symbols, and then we use the copy when resolving
   * in the table.
   */
  function getAugmentedSymbolTable(table: SymbolTable): Mutable<SymbolTable> {
    let augmented = augmentedSymbolTables.get(table);
    if (!augmented) {
      augmented = createSymbolTable(table);
      augmentedSymbolTables.set(table, augmented);
    }
    return mutate(augmented);
  }

  function mergeSymbolTable(source: SymbolTable, target: Mutable<SymbolTable>) {
    for (const [sym, duplicates] of source.duplicates) {
      const targetSet = target.duplicates.get(sym);
      if (targetSet === undefined) {
        mutate(target.duplicates).set(sym, new Set([...duplicates]));
      } else {
        for (const duplicate of duplicates) {
          mutate(targetSet).add(duplicate);
        }
      }
    }

    for (const [key, sourceBinding] of source) {
      if (sourceBinding.flags & SymbolFlags.Namespace) {
        let targetBinding = target.get(key);
        if (!targetBinding) {
          targetBinding = {
            ...sourceBinding,
            declarations: [],
            exports: createSymbolTable(),
          };
          target.set(key, targetBinding);
        }
        if (targetBinding.flags & SymbolFlags.Namespace) {
          mergedSymbols.set(sourceBinding, targetBinding);
          mutate(targetBinding.declarations).push(...sourceBinding.declarations);

          mergeSymbolTable(sourceBinding.exports!, mutate(targetBinding.exports!));
        } else {
          // this will set a duplicate error
          target.set(key, sourceBinding);
        }
      } else if (sourceBinding.flags & SymbolFlags.Decorator) {
        mergeDeclarationOrImplementation(key, sourceBinding, target, SymbolFlags.Decorator);
      } else if (sourceBinding.flags & SymbolFlags.Function) {
        mergeDeclarationOrImplementation(key, sourceBinding, target, SymbolFlags.Function);
      } else {
        target.set(key, sourceBinding);
      }
    }
  }

  function mergeDeclarationOrImplementation(
    key: string,
    sourceBinding: Sym,
    target: Mutable<SymbolTable>,
    expectTargetFlags: SymbolFlags,
  ) {
    const targetBinding = target.get(key);
    if (!targetBinding || !(targetBinding.flags & expectTargetFlags)) {
      target.set(key, sourceBinding);
      return;
    }
    const isSourceImplementation = sourceBinding.flags & SymbolFlags.Implementation;
    const isTargetImplementation = targetBinding.flags & SymbolFlags.Implementation;
    if (!isTargetImplementation && isSourceImplementation) {
      mergedSymbols.set(sourceBinding, targetBinding);
      mutate(targetBinding).value = sourceBinding.value;
      mutate(targetBinding).flags |= sourceBinding.flags;
      mutate(targetBinding.declarations).push(...sourceBinding.declarations);
    } else if (isTargetImplementation && !isSourceImplementation) {
      mergedSymbols.set(sourceBinding, targetBinding);
      mutate(targetBinding).flags |= sourceBinding.flags;
      mutate(targetBinding.declarations).unshift(...sourceBinding.declarations);
    } else {
      // this will set a duplicate error
      target.set(key, sourceBinding);
    }
  }

  function setUsingsForFile(file: TypeSpecScriptNode) {
    const usedUsing = new Map<Sym, Set<Sym>>();
    function isAlreadyAddedIn(sym: Sym, target: Sym) {
      let current: Sym | undefined = sym;
      while (current) {
        if (usedUsing.get(sym)?.has(target)) {
          return true;
        }
        current = current.parent;
      }

      let usingForScope = usedUsing.get(sym);
      if (usingForScope === undefined) {
        usingForScope = new Set();
        usedUsing.set(sym, usingForScope);
      }

      usingForScope.add(target);
      return false;
    }
    for (const using of file.usings) {
      const parentNs = using.parent!;
      const { finalSymbol: usedSym, resolutionResult: usedSymResult } = resolveTypeReference(
        using.name,
      );
      if (~usedSymResult & ResolutionResultFlags.Resolved) {
        continue; // Keep going and count on checker to report those errors.
      }

      compilerAssert(usedSym, "Used symbol must be defined if resolution succeeded");
      if (~usedSym.flags & SymbolFlags.Namespace) {
        continue; // Keep going and count on checker to report those errors.
      }

      const namespaceSym = getMergedSymbol(usedSym)!;

      if (isAlreadyAddedIn(getMergedSymbol(parentNs.symbol), namespaceSym)) {
        continue;
      }
      addUsingSymbols(namespaceSym.exports!, parentNs.locals!);
    }
  }

  function addUsingSymbols(source: SymbolTable, destination: SymbolTable): void {
    const augmented = getAugmentedSymbolTable(destination);
    for (const symbolSource of source.values()) {
      const sym: Sym = {
        flags: SymbolFlags.Using,
        declarations: [],
        name: symbolSource.name,
        symbolSource: symbolSource,
        node: undefined as any,
      };

      augmented.set(sym.name, sym);
    }
  }

  function createGlobalNamespaceNode() {
    const nsId: IdentifierNode = {
      kind: SyntaxKind.Identifier,
      pos: 0,
      end: 0,
      sv: "global",
      symbol: undefined!,
      flags: NodeFlags.Synthetic,
    };

    const nsNode: NamespaceStatementNode = {
      kind: SyntaxKind.NamespaceStatement,
      decorators: [],
      pos: 0,
      end: 0,
      id: nsId,
      symbol: undefined!,
      locals: createSymbolTable(),
      flags: NodeFlags.Synthetic,
    };

    return nsNode;
  }

  function bindAndResolveNode(node: Node) {
    switch (node.kind) {
      case SyntaxKind.TypeReference:
        resolveTypeReference(node);
        break;
      case SyntaxKind.ModelStatement:
      case SyntaxKind.ModelExpression:
      case SyntaxKind.InterfaceStatement:
      case SyntaxKind.EnumStatement:
      case SyntaxKind.ScalarStatement:
      case SyntaxKind.UnionStatement:
      case SyntaxKind.IntersectionExpression:
        bindMemberContainer(node);
        break;
      case SyntaxKind.OperationStatement:
        bindOperationStatementParameters(node);
        break;
      case SyntaxKind.AliasStatement:
        resolveAlias(node);
        break;
      case SyntaxKind.TemplateParameterDeclaration:
        bindTemplateParameter(node);
        break;
      case SyntaxKind.DecoratorExpression:
      case SyntaxKind.ProjectionDecoratorReferenceExpression:
        resolveDecoratorTarget(node);
        break;
      case SyntaxKind.AugmentDecoratorStatement:
        resolveAugmentDecorator(node);
        break;
      case SyntaxKind.CallExpression:
        resolveTypeReference(node.target);
        break;
      case SyntaxKind.ProjectionStatement:
        resolveProjection(node);
        break;
    }

    if ("id" in node && node.kind !== SyntaxKind.MemberExpression && node.id) {
      bindDeclarationIdentifier(node as any);
    }

    visitChildren(node, bindAndResolveNode);
  }

  function resolveProjection(projection: ProjectionStatementNode) {
    switch (projection.selector.kind) {
      case SyntaxKind.Identifier:
      case SyntaxKind.MemberExpression:
        resolveTypeReference(projection.selector);
    }
  }

  function resolveDecoratorTarget(
    decorator:
      | DecoratorExpressionNode
      | AugmentDecoratorStatementNode
      | ProjectionDecoratorReferenceExpressionNode,
  ) {
    resolveTypeReference(decorator.target, { resolveDecorators: true });
  }

  type SymbolGetter = (baseSym: Sym) => ResolutionResult;
  type TypePrototype = Map<string, SymbolGetter>;
  type TypePrototypes = Map<SyntaxKind, TypePrototype>;

  function createMetaTypePrototypes(): TypePrototypes {
    const nodeInterfaces: TypePrototypes = new Map();

    // model properties
    const modelPropertyPrototype: TypePrototype = new Map();
    modelPropertyPrototype.set("type", (baseSym) => {
      const node = baseSym.node as ModelPropertyNode;
      return resolveExpression(node.value);
    });
    nodeInterfaces.set(SyntaxKind.ModelProperty, modelPropertyPrototype);

    // operations
    const operationPrototype: TypePrototype = new Map();
    // For parameters it is a cloned symbol as all the params are spread
    operationPrototype.set("parameters", (baseSym) => {
      const sym = getAugmentedSymbolTable(baseSym.metatypeMembers!)?.get("parameters");
      return sym === undefined
        ? failedResult(ResolutionResultFlags.ResolutionFailed)
        : resolvedResult(sym);
    });
    // For returnType we just return the reference so we can just do it dynamically
    operationPrototype.set("returnType", (baseSym) => {
      let node = baseSym.declarations[0] as OperationStatementNode;
      while (node.signature.kind === SyntaxKind.OperationSignatureReference) {
        const baseResult = resolveTypeReference(node.signature.baseOperation);
        if (baseResult.resolutionResult & ResolutionResultFlags.Resolved) {
          node = baseSym!.declarations[0] as OperationStatementNode;
        } else {
          return baseResult;
        }
      }

      return resolveExpression(node.signature.returnType);
    });
    nodeInterfaces.set(SyntaxKind.OperationStatement, operationPrototype);

    return nodeInterfaces;
  }

  function resolveAugmentDecorator(decNode: AugmentDecoratorStatementNode) {
    resolveTypeReference(decNode.target, { resolveDecorators: true });
    const targetResult = resolveTypeReference(decNode.targetType);
    if (targetResult.resolvedSymbol && !targetResult.isTemplateInstantiation) {
      let list = augmentDecoratorsForSym.get(targetResult.resolvedSymbol);
      if (list === undefined) {
        list = [];
        augmentDecoratorsForSym.set(targetResult.resolvedSymbol, list);
      }
      list.unshift(decNode);
    }
  }
}
