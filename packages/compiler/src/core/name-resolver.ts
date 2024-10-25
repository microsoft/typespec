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
import { createSymbol, createSymbolTable } from "./binder.js";
import {
  AliasStatementNode,
  AugmentDecoratorStatementNode,
  DecoratorExpressionNode,
  EnumStatementNode,
  Expression,
  InterfaceStatementNode,
  ModelExpressionNode,
  ModelPropertyNode,
  ModelStatementNode,
  OperationStatementNode,
  ResolutionResult,
  TemplateParameterDeclarationNode,
  UnionStatementNode,
  compilerAssert,
  visitChildren,
} from "./index.js";
import { inspectSymbol } from "./inspector.js";
import { createDiagnostic } from "./messages.js";
import { Program } from "./program.js";
import {
  IdentifierNode,
  MemberExpressionNode,
  NamespaceStatementNode,
  Node,
  NodeFlags,
  NodeLinks,
  ResolutionResultFlags,
  Sym,
  SymbolFlags,
  SymbolLinks,
  SymbolTable,
  SyntaxKind,
  TypeReferenceNode,
  TypeSpecScriptNode,
} from "./types.js";

export interface NameResolver {
  // TODO: add docs
  resolveProgram(): void;
  getMergedSymbol(sym: Sym): Sym;

  getAugmentedSymbolTable(table: SymbolTable): Mutable<SymbolTable>;
  getNodeLinks(n: Node): NodeLinks;
  getSymbolLinks(s: Sym): SymbolLinks;
  getGlobalNamespaceSymbol(): Sym;

  // TODO: do we need this one, should that be the signature.
  resolveMemberExpressionForSym(sym: Sym, node: MemberExpressionNode): ResolutionResult;
  resolveMetaMemberByName(sym: Sym, name: string): ResolutionResult;

  readonly intrinsicSymbols: {
    readonly null: Sym;
  };
}

interface ResolveTypReferenceOptions {
  resolveDecorators?: boolean;
}

export function createResolver(program: Program): NameResolver {
  const mergedSymbols = new Map<Sym, Sym>();
  const augmentedSymbolTables = new Map<SymbolTable, SymbolTable>();
  const nodeLinks = new Map<number, NodeLinks>();
  let currentNodeId = 0;
  const symbolLinks = new Map<number, SymbolLinks>();
  let currentSymbolId = 0;

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
  return {
    intrinsicSymbols: { null: nullSym },
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
        // TODO:?
        // initializeTypeSpecIntrinsics();
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

    getGlobalNamespaceSymbol() {
      return globalNamespaceSym;
    },
    resolveMemberExpressionForSym,
    resolveMetaMemberByName,
  };

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
      return [links.resolvedSymbol, links.resolutionResult];
    }

    let result = resolveTypeReferenceWorker(node, options);

    const [resolvedSym, resolvedSymResult, nextSym] = result;

    if (resolvedSym) {
      links.resolvedSymbol = resolvedSym;
    }
    if (nextSym) {
      links.nextSymbol = nextSym;
    }
    links.resolutionResult = resolvedSymResult;

    if (resolvedSym && resolvedSym.flags & SymbolFlags.Alias) {
      // unwrap aliases
      const aliasNode = resolvedSym.declarations[0];
      links.nextSymbol = resolvedSym;
      const [resolveAliasSym, resolveAliasResult] = resolveAlias(aliasNode as AliasStatementNode);
      result = [resolveAliasSym, resolveAliasResult, resolvedSym];
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
      if (resolvedSym.flags & SymbolFlags.Declaration) {
        bindAndResolveNode(resolvedSym.declarations[0]);
      }
      // todo: non-declarations
    }

    return result;
  }

  function resolveTypeReferenceWorker(
    node: TypeReferenceNode | MemberExpressionNode | IdentifierNode,
    options: ResolveTypReferenceOptions,
  ): ResolutionResult {
    if (node.kind === SyntaxKind.TypeReference) {
      return resolveTypeReference(node.target, options);
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
    const [baseSym, baseResult] = resolveTypeReference(node.base, options);
    if (baseResult & ResolutionResultFlags.ResolutionFailed) {
      return [undefined, baseResult];
    }

    compilerAssert(baseSym, "Base symbol must be defined if resolution did not fail");
    return resolveMemberExpressionForSym(baseSym, node);
  }

  function resolveMemberExpressionForSym(
    baseSym: Sym,
    node: MemberExpressionNode,
  ): ResolutionResult {
    if (node.selector === ".") {
      if (baseSym.flags & SymbolFlags.MemberContainer) {
        return resolveMember(baseSym, node.id);
      } else if (baseSym.flags & SymbolFlags.ExportContainer) {
        return resolveExport(getMergedSymbol(baseSym), node.id);
      }
    } else {
      return resolveMetaMember(baseSym, node.id);
    }

    throw new Error("NYI rme " + inspectSymbol(baseSym));
  }

  function resolveMember(baseSym: Sym, id: IdentifierNode): ResolutionResult {
    const baseNode = baseSym.node ?? baseSym.declarations[0];
    compilerAssert(baseNode, "Base symbol must have an associated node");

    bindMemberContainer(baseNode);

    switch (baseNode.kind) {
      case SyntaxKind.ModelStatement:
      case SyntaxKind.ModelExpression:
        return resolveModelMember(baseSym, baseNode, id);
      case SyntaxKind.InterfaceStatement:
        return resolveInterfaceMember(baseSym, id);
      case SyntaxKind.EnumStatement:
        return resolveEnumMember(baseSym, id);
      case SyntaxKind.UnionStatement:
        return resolveUnionVariant(baseSym, id);
    }

    compilerAssert(false, "Unknown member container kind: " + SyntaxKind[baseNode.kind]);
  }

  function resolveModelMember(
    modelSym: Sym,
    modelNode: ModelStatementNode | ModelExpressionNode,
    id: IdentifierNode,
  ): ResolutionResult {
    const modelSymLinks = getSymbolLinks(modelSym);

    // step 1: check direct members
    // spreads have already been bound
    const memberSym = tableLookup(modelSym.members!, id);
    if (memberSym) {
      return [memberSym, ResolutionResultFlags.Resolved];
    }

    // step 2: check extends. Don't look up to extends references if we have
    // unknown members, and resolve any property as unknown if we extend
    // something unknown.
    const extendsRef = modelNode.kind === SyntaxKind.ModelStatement ? modelNode.extends : undefined;
    if (
      extendsRef &&
      extendsRef.kind === SyntaxKind.TypeReference &&
      !modelSymLinks.hasUnknownMembers
    ) {
      const [extendsSym, extendsResult] = resolveTypeReference(extendsRef);
      if (extendsResult & ResolutionResultFlags.Resolved) {
        return resolveMember(extendsSym!, id);
      }

      if (extendsResult & ResolutionResultFlags.Unknown) {
        modelSymLinks.hasUnknownMembers = true;
        return [undefined, ResolutionResultFlags.Unknown];
      }
    }

    // step 3: return either unknown or not found depending on whether we have
    // unknown members
    return [
      undefined,
      modelSymLinks.hasUnknownMembers
        ? ResolutionResultFlags.Unknown
        : ResolutionResultFlags.NotFound,
    ];
  }

  function resolveInterfaceMember(ifaceSym: Sym, id: IdentifierNode): ResolutionResult {
    const slinks = getSymbolLinks(ifaceSym);
    const memberSym = tableLookup(ifaceSym.members!, id);
    if (memberSym) {
      return [memberSym, ResolutionResultFlags.Resolved];
    }

    return [
      undefined,
      slinks.hasUnknownMembers ? ResolutionResultFlags.Unknown : ResolutionResultFlags.NotFound,
    ];
  }

  function resolveEnumMember(enumSym: Sym, id: IdentifierNode): ResolutionResult {
    const memberSym = tableLookup(enumSym.members!, id);
    if (memberSym) {
      return [memberSym, ResolutionResultFlags.Resolved];
    }

    return [undefined, ResolutionResultFlags.NotFound];
  }

  function resolveUnionVariant(unionSym: Sym, id: IdentifierNode): ResolutionResult {
    const memberSym = tableLookup(unionSym.members!, id);
    if (memberSym) {
      return [memberSym, ResolutionResultFlags.Resolved];
    }

    return [undefined, ResolutionResultFlags.NotFound];
  }

  function resolveExport(baseSym: Sym, id: IdentifierNode): ResolutionResult {
    const node = baseSym.declarations[0];
    compilerAssert(
      node.kind === SyntaxKind.NamespaceStatement ||
        node.kind === SyntaxKind.TypeSpecScript ||
        node.kind === SyntaxKind.JsNamespaceDeclaration,
      `Unexpected node kind ${SyntaxKind[node.kind]}`,
    );

    const exportSym = tableLookup(baseSym.exports!, id);
    if (!exportSym) {
      return [undefined, ResolutionResultFlags.NotFound];
    }

    return [exportSym, ResolutionResultFlags.Resolved];
  }

  function resolveAlias(node: AliasStatementNode): ResolutionResult {
    const symbol = node.symbol;
    const slinks = getSymbolLinks(symbol);

    if (slinks.aliasResolutionResult) {
      return [slinks.aliasedSymbol, slinks.aliasResolutionResult];
    }

    if (node.value.kind === SyntaxKind.TypeReference) {
      const result = resolveTypeReference(node.value);
      if (result[0] && result[0].flags & SymbolFlags.Alias) {
        const aliasLinks = getSymbolLinks(result[0]);
        slinks.aliasedSymbol = aliasLinks.aliasedSymbol ? aliasLinks.aliasedSymbol : result[0];
      } else {
        slinks.aliasedSymbol = result[0];
      }
      slinks.aliasResolutionResult = result[1];
      return [slinks.aliasedSymbol, slinks.aliasResolutionResult];
    } else if (node.value.symbol) {
      // a type literal
      slinks.aliasedSymbol = node.value.symbol;
      slinks.aliasResolutionResult = ResolutionResultFlags.Resolved;
      return [node.value.symbol, ResolutionResultFlags.Resolved];
    } else {
      // a computed type
      slinks.aliasResolutionResult = ResolutionResultFlags.Unknown;
      return [undefined, ResolutionResultFlags.Unknown];
    }
  }

  function resolveTemplateParameter(node: TemplateParameterDeclarationNode): ResolutionResult {
    const symbol = node.symbol;
    const slinks = getSymbolLinks(symbol);

    if (!node.constraint) {
      return [node.symbol, ResolutionResultFlags.Resolved];
    }

    if (slinks.constraintResolutionResult) {
      return [slinks.constraintSymbol, slinks.constraintResolutionResult];
    }

    if (node.constraint && node.constraint.kind === SyntaxKind.TypeReference) {
      const result = resolveTypeReference(node.constraint);
      slinks.constraintSymbol = result[0];
      slinks.constraintResolutionResult = result[1];
      return result;
    } else if (node.constraint.symbol) {
      // a type literal
      slinks.constraintSymbol = node.constraint.symbol;
      slinks.constraintResolutionResult = ResolutionResultFlags.Resolved;
      return [node.constraint.symbol, ResolutionResultFlags.Resolved];
    } else {
      // a computed type, just resolve to the template parameter symbol itself.
      slinks.constraintSymbol = node.symbol;
      slinks.constraintResolutionResult = ResolutionResultFlags.Resolved;
      return [node.symbol, ResolutionResultFlags.Resolved];
    }
  }
  function resolveExpression(node: Expression): ResolutionResult {
    if (node.kind === SyntaxKind.TypeReference) {
      return resolveTypeReference(node);
    }

    if (node.symbol) {
      return [node.symbol, ResolutionResultFlags.Resolved];
    }

    return [undefined, ResolutionResultFlags.Unknown];
  }

  function resolveMetaMember(baseSym: Sym, id: IdentifierNode): ResolutionResult {
    return resolveMetaMemberByName(baseSym, id.sv);
  }

  function resolveMetaMemberByName(baseSym: Sym, sv: string): ResolutionResult {
    const baseNode = getSymNode(baseSym);

    const prototype = metaTypePrototypes.get(baseNode.kind);

    if (!prototype) {
      return [undefined, ResolutionResultFlags.NotFound];
    }

    const getter = prototype.get(sv);

    if (!getter) {
      return [undefined, ResolutionResultFlags.NotFound];
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
      case SyntaxKind.InterfaceStatement:
        bindInterfaceMembers(node);
        return;
      case SyntaxKind.EnumStatement:
        bindEnumMembers(node);
        return;
      case SyntaxKind.UnionStatement:
        bindUnionMembers(node);
        return;
    }
  }

  // TODO: had to keep the metaTypeMembers which this pr originally tried to get rid as we need for ops parameters to be cloned and have a new reference
  function bindOperationStatementParameters(node: OperationStatementNode) {
    const targetTable = getAugmentedSymbolTable(node.symbol!.metatypeMembers!);
    if (node.signature.kind === SyntaxKind.OperationSignatureDeclaration) {
      const [sym] = resolveExpression(node.signature.parameters);
      if (sym) {
        targetTable.set("parameters", sym);
      }
    } else {
      const [sig] = resolveTypeReference(node.signature.baseOperation);
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
          );
          targetTable.set("parameters", parametersSym);
          targetTable.set("returnType", sigTable.get("returnType")!);
        }
      }
    }
  }

  function bindModelMembers(node: ModelStatementNode | ModelExpressionNode) {
    const modelSym = node.symbol!;
    const modelSymLinks = getSymbolLinks(modelSym);

    const targetTable = getAugmentedSymbolTable(modelSym.members!);

    const isRef = node.kind === SyntaxKind.ModelStatement ? node.is : undefined;
    if (isRef && isRef.kind === SyntaxKind.TypeReference) {
      const [isSym, isResult] = resolveTypeReference(isRef);

      setUnknownMembers(modelSymLinks, isSym, isResult);

      if (isResult & ResolutionResultFlags.Resolved && isSym!.flags & SymbolFlags.Model) {
        const sourceTable = getAugmentedSymbolTable(isSym!.members!);
        targetTable.include(sourceTable);
      }
    }

    // here we just need to check if we're extending something with unknown symbols
    const extendsRef = node.kind === SyntaxKind.ModelStatement ? node.extends : undefined;
    if (extendsRef && extendsRef.kind === SyntaxKind.TypeReference) {
      const [sym, result] = resolveTypeReference(extendsRef);
      setUnknownMembers(modelSymLinks, sym, result);
    }

    // here we just need to include spread properties, since regular properties
    // were bound by the binder.
    for (const propertyNode of node.properties) {
      if (propertyNode.kind !== SyntaxKind.ModelSpreadProperty) {
        continue;
      }

      const [sourceSym, sourceResult] = resolveTypeReference(propertyNode.target);

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
      targetTable.include(sourceTable);
    }
  }

  function setUnknownMembers(targetSymLinks: SymbolLinks, ...[sym, result]: ResolutionResult) {
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
      const [extendsSym, extendsResult] = resolveTypeReference(extendsRef);
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
      targetTable.include(sourceTable);
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

      const [sourceSym, sourceResult] = resolveTypeReference(memberNode.target);

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
      targetTable.include(sourceTable);
    }
  }

  function bindUnionMembers(node: UnionStatementNode) {
    const unionSym = node.symbol!;
    const targetTable = getAugmentedSymbolTable(unionSym.members!);

    for (const variantNode of node.options) {
      if (!variantNode.id) {
        continue;
      }

      targetTable.set(
        variantNode.id.sv,
        createSymbol(variantNode, variantNode.id.sv, SymbolFlags.Member),
      );
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
        if (binding) return [binding, ResolutionResultFlags.Resolved];
      }

      if ("locals" in scope && scope.locals !== undefined) {
        binding = tableLookup(scope.locals, node, options.resolveDecorators);
        if (binding) {
          return [binding, ResolutionResultFlags.Resolved];
        }
      }

      scope = scope.parent;
    }

    if (!binding && scope && scope.kind === SyntaxKind.TypeSpecScript) {
      // check any blockless namespace decls
      for (const ns of scope.inScopeNamespaces) {
        const mergedSymbol = getMergedSymbol(ns.symbol);
        binding = tableLookup(mergedSymbol.exports!, node, options.resolveDecorators);

        if (binding) return [binding, ResolutionResultFlags.Resolved];
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
        return [undefined, ResolutionResultFlags.Ambiguous];
      } else if (globalBinding) {
        return [globalBinding, ResolutionResultFlags.Resolved];
      } else if (usingBinding) {
        if (usingBinding.flags & SymbolFlags.DuplicateUsing) {
          return [undefined, ResolutionResultFlags.Ambiguous];
        }
        return [usingBinding, ResolutionResultFlags.Resolved];
      }
    }

    return [undefined, ResolutionResultFlags.Unknown];
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
    const usedUsing = new Set<Sym>();
    for (const using of file.usings) {
      const parentNs = using.parent!;
      const [usedSym, usedSymResult] = resolveTypeReference(using.name);
      if (~usedSymResult & ResolutionResultFlags.Resolved) {
        continue;
      }
      compilerAssert(usedSym, "Used symbol must be defined if resolution succeeded");
      if (~usedSym.flags & SymbolFlags.Namespace) {
        reportCheckerDiagnostic(createDiagnostic({ code: "using-invalid-ref", target: using }));
        continue;
      }

      const namespaceSym = getMergedSymbol(usedSym)!;

      if (usedUsing.has(namespaceSym)) {
        reportCheckerDiagnostic(
          createDiagnostic({
            code: "duplicate-using",
            format: { usingName: memberExpressionToString(using.name) },
            target: using,
          }),
        );
        continue;
      }
      usedUsing.add(namespaceSym);

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

  function memberExpressionToString(expr: IdentifierNode | MemberExpressionNode) {
    let current = expr;
    const parts = [];

    while (current.kind === SyntaxKind.MemberExpression) {
      parts.push(current.id.sv);
      current = current.base;
    }

    parts.push(current.sv);

    return parts.reverse().join(".");
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
      case SyntaxKind.UnionStatement:
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
      case SyntaxKind.AugmentDecoratorStatement:
        resolveDecoratorTarget(node);
        break;
      case SyntaxKind.CallExpression:
        resolveTypeReference(node.target); // TODO: should this not have been a type reference
        break;
    }

    visitChildren(node, bindAndResolveNode);
  }

  function resolveDecoratorTarget(
    decorator: DecoratorExpressionNode | AugmentDecoratorStatementNode,
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
    operationPrototype.set("parameters", (baseSym) => {
      const sym = getAugmentedSymbolTable(baseSym.metatypeMembers!)?.get("parameters");
      return [
        sym,
        sym === undefined ? ResolutionResultFlags.ResolutionFailed : ResolutionResultFlags.Resolved,
      ];
    });
    nodeInterfaces.set(SyntaxKind.OperationStatement, operationPrototype);

    return nodeInterfaces;
  }
}
function reportCheckerDiagnostic(arg0: any) {
  throw new Error("Function not implemented.");
}

// TODO: better place?
export function getSymNode(sym: Sym): Node {
  return sym.flags & SymbolFlags.Declaration ? sym.declarations[0] : sym.node;
}
