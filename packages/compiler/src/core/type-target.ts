import { getLocationContext } from "./helpers/location-context.js";
import type { Program } from "./program.js";
import {
  SymbolFlags,
  SyntaxKind,
  type LocationContext,
  type Model,
  type ModelProperty,
  type Node,
  type Operation,
  type OperationSignatureDeclarationNode,
  type Sym,
  type TemplateParameterDeclarationNode,
  type Type,
  type TypeReferenceNode,
  type TypeTarget,
  type TypeTargetEdge,
  type TypeTargetEdgeResult,
} from "./types.js";

/**
 * Create a diagnostic target for `type`, or for the type reached by following `edge` from it.
 * Follow further edges with {@link TypeTarget.pipe} and {@link TypeTarget.property}.
 *
 * The target is located at the syntax that expresses the path in the root's code, instead of where the
 * reached type is declared. When the path enters a declaration from another package (e.g. a library model
 * spread into a project operation), it stays on the last syntax in the root's package.
 *
 * @param program Program the types belong to.
 * @param type Type the path starts from, usually the declaration being validated.
 * @param edge Optional first edge to follow.
 *
 * @example
 * ```ts
 * // `never` in `op getUser(): never`, rather than the declaration of `never`
 * typeTarget(program, op, "returnType");
 * // `SharedQuery` in `op list(...SharedQuery): void`, when `SharedQuery` is declared in a library
 * typeTarget(program, op, "parameters").property("top");
 * // `uuid` in `w: Wrapper<uuid>`
 * typeTarget(program, prop, "type").property("value")?.pipe("type");
 * ```
 */
export function typeTarget<T extends Type>(program: Program, type: T): TypeTarget<T>;
export function typeTarget<T extends Type, E extends TypeTargetEdge<T>>(
  program: Program,
  type: T,
  edge: E,
): TypeTargetEdgeResult<T, E>;
export function typeTarget(program: Program, type: Type, edge?: string): TypeTarget | undefined {
  const walker: Walker = {
    program,
    root: type,
    rootContext: getLocationContext(program, type),
  };
  const root = createTarget(walker, {
    type,
    cursor: type.node && { node: type.node, env: emptyEnv },
    reported: type.node,
    path: [],
  });
  return edge === undefined ? root : (root.pipe as (edge: string) => TypeTarget | undefined)(edge);
}

/** Argument written for a template parameter, with the arguments in scope where it was written. */
interface Binding {
  readonly node: Node;
  readonly env: Env;
}
type Env = ReadonlyMap<TemplateParameterDeclarationNode, Binding>;
const emptyEnv: Env = new Map();

/** Syntax along the path, with the template arguments needed to read it. */
type Cursor = Binding;

interface Walker {
  readonly program: Program;
  readonly root: Type;
  readonly rootContext: LocationContext;
}

interface State {
  readonly type: Type;
  /** Syntax expressing `type`, used to follow further edges. */
  readonly cursor: Cursor | undefined;
  /** Deepest syntax of the path in the root's package. */
  readonly reported: Node | undefined;
  readonly path: readonly string[];
}

function createTarget<T extends Type>(walker: Walker, state: State): TypeTarget<T> {
  const target: TypeTarget<T> = {
    targetKind: "type",
    type: state.type as T,
    root: walker.root,
    path: state.path,
    node: state.reported ?? state.type.node,
    pipe: ((edge: string) => {
      const next = followEdge(walker, state, edge);
      return next && createTarget(walker, next);
    }) as TypeTarget<T>["pipe"],
    property: (name: string) => {
      const next = followProperty(walker, state, name);
      return next && createTarget(walker, next);
    },
  };
  return target;
}

function followEdge(walker: Walker, state: State, edge: string): State | undefined {
  const { program } = walker;
  const type = state.type;
  switch (type.kind) {
    case "Operation":
      switch (edge) {
        case "returnType":
          return followSignature(walker, state, type, type.returnType, edge, (x) => x.returnType);
        case "parameters":
          return followSignature(walker, state, type, type.parameters, edge, (x) => x.parameters);
        case "sourceOperation": {
          if (type.sourceOperation === undefined) return undefined;
          const declaration = enter(program, state.cursor, type);
          const signature =
            declaration?.node.kind === SyntaxKind.OperationStatement
              ? declaration.node.signature
              : undefined;
          return step(
            walker,
            state,
            type.sourceOperation,
            edge,
            signature?.kind === SyntaxKind.OperationSignatureReference
              ? { node: signature.baseOperation, env: declaration!.env }
              : undefined,
          );
        }
      }
      return undefined;
    case "Model": {
      const declaration = enter(program, state.cursor, type);
      const statement =
        declaration?.node.kind === SyntaxKind.ModelStatement ? declaration.node : undefined;
      switch (edge) {
        case "baseModel":
          return (
            type.baseModel &&
            step(walker, state, type.baseModel, edge, syntax(statement?.extends, declaration))
          );
        case "sourceModel":
          return (
            type.sourceModel &&
            step(walker, state, type.sourceModel, edge, syntax(statement?.is, declaration))
          );
        case "indexerValue":
          return (
            type.indexer &&
            step(
              walker,
              state,
              type.indexer.value,
              edge,
              getIndexerValueSyntax(program, state, type),
            )
          );
      }
      return undefined;
    }
    case "ModelProperty":
    case "UnionVariant": {
      if (edge !== "type") return undefined;
      const node = state.cursor?.node;
      return step(
        walker,
        state,
        type.type,
        edge,
        node?.kind === SyntaxKind.ModelProperty || node?.kind === SyntaxKind.UnionVariant
          ? { node: node.value, env: state.cursor!.env }
          : undefined,
      );
    }
    case "Scalar": {
      if (edge !== "baseScalar" || type.baseScalar === undefined) return undefined;
      const declaration = enter(program, state.cursor, type);
      return step(
        walker,
        state,
        type.baseScalar,
        edge,
        declaration?.node.kind === SyntaxKind.ScalarStatement
          ? syntax(declaration.node.extends, declaration)
          : undefined,
      );
    }
    default:
      return undefined;
  }
}

/** Follow `select` on the operation signature, going through `op is` references to the declared signature. */
function followSignature(
  walker: Walker,
  state: State,
  operation: Operation,
  type: Type,
  edge: string,
  select: (signature: OperationSignatureDeclarationNode) => Node,
): State {
  let reported = state.reported;
  let current: Operation | undefined = operation;
  let declaration = enter(walker.program, state.cursor, operation);
  while (current && declaration?.node.kind === SyntaxKind.OperationStatement) {
    const signature = declaration.node.signature;
    if (signature.kind === SyntaxKind.OperationSignatureDeclaration) {
      return step(walker, { ...state, reported }, type, edge, {
        node: select(signature),
        env: declaration.env,
      });
    }
    const reference = resolveArgument({
      node: signature.baseOperation,
      env: declaration.env,
    });
    reported = report(walker, reference.node, reported);
    current = current.sourceOperation;
    declaration = current && enter(walker.program, reference, current);
  }
  return { type, cursor: undefined, reported, path: [...state.path, edge] };
}

function followProperty(walker: Walker, state: State, name: string): State | undefined {
  const model = state.type;
  const property = model.kind === "Model" ? model.properties.get(name) : undefined;
  if (property === undefined) return undefined;

  let reported = state.reported;
  const cursor = locateProperty(
    walker.program,
    property,
    enter(walker.program, state.cursor, model as Model),
    (node) => (reported = report(walker, node, reported)),
  );
  return { type: property, cursor, reported, path: [...state.path, name] };
}

/**
 * Find the declaration of `property` from the syntax of its model, visiting every spread, `is` and intersection
 * operand that brought it into the model, read with the template arguments of this path.
 */
function locateProperty(
  program: Program,
  property: ModelProperty,
  model: Cursor | undefined,
  visit: (node: Node) => void,
): Cursor | undefined {
  let current = property;
  let context = model;
  // Bounded by the depth of composition; guard against unexpected cycles.
  for (let depth = 0; depth < 100; depth++) {
    const source = current.sourceProperty;
    if (source === undefined) {
      if (context === undefined || current.node?.kind !== SyntaxKind.ModelProperty) {
        return undefined;
      }
      visit(current.node);
      return { node: current.node, env: context.env };
    }
    const composition = current.model?.sourceModels.find((x) => declaresProperty(x.model, source));
    if (composition) {
      if (composition.node === undefined || context === undefined) {
        context = undefined;
      } else {
        const reference = resolveArgument({ node: composition.node, env: context.env });
        visit(reference.node);
        context = enterBaseModel(
          program,
          enter(program, reference, composition.model),
          composition.model,
          source.model,
          visit,
        );
      }
    }
    // Without a composition, the property was cloned with its whole model by `op is` and the syntax of the
    // base signature is already the current context.
    current = source;
  }
  return undefined;
}

function declaresProperty(model: Model, property: ModelProperty): boolean {
  for (let current: Model | undefined = model; current; current = current.baseModel) {
    if (current.properties.get(property.name) === property) return true;
  }
  return false;
}

/** Move from the syntax of `model` to the syntax of its base `target`, through `extends` clauses. */
function enterBaseModel(
  program: Program,
  cursor: Cursor | undefined,
  model: Model,
  target: Model | undefined,
  visit: (node: Node) => void,
): Cursor | undefined {
  let current = model;
  while (cursor && current !== target && current.baseModel) {
    const base = cursor.node.kind === SyntaxKind.ModelStatement ? cursor.node.extends : undefined;
    if (base === undefined) return undefined;
    const reference = resolveArgument({ node: base, env: cursor.env });
    visit(reference.node);
    cursor = enter(program, reference, current.baseModel);
    current = current.baseModel;
  }
  return cursor;
}

function getIndexerValueSyntax(program: Program, state: State, model: Model): Cursor | undefined {
  if (state.cursor === undefined) return undefined;
  const expression = resolveArgument(state.cursor);
  if (expression.node.kind === SyntaxKind.ArrayExpression) {
    return { node: expression.node.elementType, env: expression.env };
  }
  // `Record<T>`, `Array<T>` or any template whose indexer value is one of its template arguments.
  const declaration = enter(program, expression, model);
  if (declaration === undefined || model.templateMapper === undefined) return undefined;
  for (const [parameter, argument] of model.templateMapper.map) {
    if (argument === model.indexer?.value && parameter.node) {
      return declaration.env.get(parameter.node);
    }
  }
  return undefined;
}

function step(
  walker: Walker,
  state: State,
  type: Type,
  edge: string,
  cursor: Cursor | undefined,
): State {
  const resolved = cursor && resolveArgument(cursor);
  return {
    type,
    cursor: resolved,
    reported: resolved ? report(walker, resolved.node, state.reported) : state.reported,
    path: [...state.path, edge],
  };
}

function syntax(node: Node | undefined, cursor: Cursor | undefined): Cursor | undefined {
  return node && cursor && { node, env: cursor.env };
}

/** Keep `node` as the reported syntax when it is in the same package as the root. */
function report(walker: Walker, node: Node, reported: Node | undefined): Node | undefined {
  const context = getLocationContext(walker.program, node);
  const root = walker.rootContext;
  const samePackage =
    context.type === root.type && (context.type !== "library" || context === root);
  return samePackage ? node : reported;
}

/**
 * Given syntax expressing `type` (a reference or an expression), return the syntax of the type itself:
 * the expression, or the declaration the reference points to with its template arguments bound.
 */
function enter(program: Program, cursor: Cursor | undefined, type: Type): Cursor | undefined {
  if (cursor === undefined) return undefined;
  const resolved = resolveArgument(cursor);
  if (resolved.node.kind !== SyntaxKind.TypeReference) {
    return resolved;
  }
  const symbol = getReferencedSymbol(program, resolved.node);
  const alias = symbol && symbol.flags & SymbolFlags.Alias ? symbol.declarations[0] : undefined;
  if (alias?.kind === SyntaxKind.AliasStatement) {
    return enter(program, { node: alias.value, env: bindArguments(alias, resolved) }, type);
  }
  const declaration = type.node;
  return declaration && { node: declaration, env: bindArguments(declaration, resolved) };
}

/** Bind the template parameters of `declaration` to the arguments written in `reference`. */
function bindArguments(declaration: Node, reference: Cursor): Env {
  const parameters: readonly TemplateParameterDeclarationNode[] =
    "templateParameters" in declaration ? declaration.templateParameters : [];
  if (parameters.length === 0) return emptyEnv;
  const env = new Map<TemplateParameterDeclarationNode, Binding>();
  const args = reference.node.kind === SyntaxKind.TypeReference ? reference.node.arguments : [];
  args.forEach((arg, index) => {
    const parameter = arg.name
      ? parameters.find((x) => x.id.sv === arg.name!.sv)
      : parameters[index];
    if (parameter) env.set(parameter, { node: arg.argument, env: reference.env });
  });
  for (const parameter of parameters) {
    if (!env.has(parameter) && parameter.default) {
      env.set(parameter, { node: parameter.default, env });
    }
  }
  return env;
}

/** Replace a reference to a template parameter by the argument written for it, recursively. */
function resolveArgument(cursor: Cursor): Cursor {
  let current = cursor;
  // Bounded by template nesting; guard against unexpected cycles.
  for (let depth = 0; depth < 100 && current.node.kind === SyntaxKind.TypeReference; depth++) {
    const parameter = getReferencedTemplateParameter(current.node);
    const binding = parameter && current.env.get(parameter);
    if (binding === undefined) break;
    current = binding;
  }
  return current;
}

/**
 * Template parameter a reference names, found in the enclosing template declarations. Symbol links can't be
 * used: references to constrained parameters resolve to the constraint so its members can be accessed.
 */
function getReferencedTemplateParameter(
  node: TypeReferenceNode,
): TemplateParameterDeclarationNode | undefined {
  if (node.target.kind !== SyntaxKind.Identifier || node.arguments.length > 0) return undefined;
  const name = node.target.sv;
  for (let current = node.parent; current; current = current.parent) {
    if ("templateParameters" in current) {
      const parameter = current.templateParameters.find((x) => x.id.sv === name);
      if (parameter) return parameter;
    }
  }
  return undefined;
}

function getReferencedSymbol(program: Program, node: TypeReferenceNode): Sym | undefined {
  return (
    program.resolver.getNodeLinks(node).resolvedSymbol ??
    program.resolver.getNodeLinks(node.target).resolvedSymbol
  );
}
