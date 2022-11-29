import { finishTypeForProgram } from "./checker.js";
import { compilerAssert } from "./diagnostics.js";
import {
  createStateAccessors,
  getParentTemplateNode,
  isNeverType,
  isProjectedProgram,
  isTemplateInstance,
  ProjectedProgram,
  Scalar,
} from "./index.js";
import { Program } from "./program.js";
import {
  DecoratorApplication,
  DecoratorArgument,
  Enum,
  EnumMember,
  Interface,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  ProjectionApplication,
  Projector,
  Tuple,
  Type,
  Union,
  UnionVariant,
} from "./types.js";

/**
 * Creates a projector which returns a projected view of either the global namespace or the
 * start node provided. Projecting a type effectively clones every type referenced underneath
 * it. This is accomplished by doing a semantic walk of each type, cloning each type we find,
 * and running projection code on the clone.
 *
 * Projectors can run multiple projections at once. In such cases, each projection is run
 * on the same clone of the unprojected type. It is up to projections and the user to ensure
 * that projections which depend on a particular shape are run when that shape is present (or
 * else to ensure that their projections are tolerant to shape changes).
 *
 * The projector maintains its own state maps and sets. If a projection is active (i.e.
 * program.currentProjector is set), then the projector's state will be returned instead
 * of the program's state. This ensures that there is no overlap between projected and
 * unprojected state. It also means that you cannot get state for nodes that are not
 * part of the active projection.
 *
 * Note that decorators are run on namespaces prior to cloning any child types to align
 * with the checker semantics, while projections are run after everything under the namespace
 * is cloned. All other run decorators and projections after all child types are cloned and
 * have their decorators run.
 */
export function createProjector(
  program: Program,
  projections: ProjectionApplication[],
  startNode?: Type
): ProjectedProgram {
  const projectedTypes = new Map<Type, Type>();
  const checker = program.checker;
  const neverType = checker.neverType;
  const scope: Type[] = [];
  const projector: Projector = {
    projectedTypes,
    projections,
    projectType,
    parentProjector: isProjectedProgram(program) ? program.projector : undefined,
  };
  const projectedNamespaces: Namespace[] = [];
  let projectingNamespaces = false;

  const projectedProgram = {
    ...program,
    getGlobalNamespaceType: () => projector.projectedGlobalNamespace!,
    projector,
    ...createStateAccessors(program.stateMaps, program.stateSets, projector),
  };
  const targetGlobalNs = startNode
    ? startNode.projector
      ? startNode.projector.projectedGlobalNamespace!
      : program.checker.getGlobalNamespaceType()
    : program.checker.getGlobalNamespaceType();

  projectingNamespaces = true;
  // Project the global namespace to get a reference.
  projector.projectedGlobalNamespace = projectNamespace(targetGlobalNs, false) as Namespace;
  // Then project the content
  projectSubNamespaces(targetGlobalNs, projector.projectedGlobalNamespace);
  projectingNamespaces = false;

  // then project all the types
  for (const ns of projectedNamespaces) {
    projectNamespaceContents(ns);
  }
  projectType(targetGlobalNs);

  projector.projectedStartNode = startNode
    ? projectedTypes.get(startNode)
    : projector.projectedGlobalNamespace;

  return projectedProgram;

  function projectType(type: Type): Type {
    if (projectedTypes.has(type)) {
      return projectedTypes.get(type)!;
    }

    scope.push(type);
    let projected;
    switch (type.kind) {
      case "Namespace":
        compilerAssert(
          projectingNamespaces,
          `Namespace ${type.name} should have already been projected.`
        );
        projected = projectNamespace(type, false);
        break;
      case "Scalar":
        projected = projectScalar(type);
        break;
      case "Model":
        projected = projectModel(type);
        break;
      case "ModelProperty":
        projected = projectModelProperty(type);
        break;
      case "Operation":
        projected = projectOperation(type);
        break;
      case "Interface":
        projected = projectInterface(type);
        break;
      case "Union":
        projected = projectUnion(type);
        break;
      case "UnionVariant":
        projected = projectUnionVariant(type);
        break;
      case "Tuple":
        projected = projectTuple(type);
        break;
      case "Enum":
        projected = projectEnum(type);
        break;
      case "EnumMember":
        projected = projectEnumMember(type);
        break;
      default:
        projected = type;
    }

    scope.pop();

    return projected;
  }

  function projectSubNamespaces(ns: Namespace, projectedNs: Namespace) {
    if (ns.namespaces.size === projectedNs.namespaces.size) {
      // Sub namespace should already have been projected.
      return;
    }
    for (const [key, childNs] of ns.namespaces) {
      const projected = projectNamespace(childNs);
      if (projected.kind === "Namespace") {
        // todo: check for never?
        projectedNs.namespaces.set(key, projected);
      }
    }
  }
  function projectNamespace(ns: Namespace, projectSubNamespace: boolean = true): Namespace {
    const alreadyProjected = projectedTypes.get(ns) as Namespace;
    if (alreadyProjected) {
      if (projectSubNamespace) {
        projectSubNamespaces(ns, alreadyProjected);
      }
      return alreadyProjected;
    }

    const projectedNs = shallowClone(ns, {
      namespaces: new Map<string, Namespace>(),
      scalars: new Map<string, Scalar>(),
      models: new Map<string, Model>(),
      operations: new Map<string, Operation>(),
      interfaces: new Map<string, Interface>(),
      unions: new Map<string, Union>(),
      enums: new Map<string, Enum>(),
      decorators: [],
    });

    projectedNs.decorators = projectDecorators(ns.decorators);

    if (ns.namespace) {
      projectedNs.namespace = projectNamespace(ns.namespace, false);
    }

    // ns run decorators before projecting anything inside them
    finishTypeForProgram(projectedProgram, projectedNs);

    if (projectSubNamespace) {
      projectSubNamespaces(ns, projectedNs);
    }

    projectedNamespaces.push(ns);
    return applyProjection(ns, projectedNs) as Namespace;
  }

  /**
   * Projects the contents of a namespace, but not the namespace itself. The namespace itself
   * is projected in an earlier phase.
   */
  function projectNamespaceContents(ns: Namespace): Type {
    const projectedNs = projectedTypes.get(ns);
    compilerAssert(projectedNs, "Should have projected namespace by now");
    if (projectedNs.kind !== "Namespace") {
      // we projected the namespace to something else so don't do any more work.
      // this might happen if a namespace itself was added/removed/etc. and is
      // projected to never.
      return neverType;
    }

    for (const childModel of ns.models.values()) {
      const projected = projectType(childModel);
      if (projected.kind === "Model") {
        projectedNs.models.set(projected.name, projected);
      }
    }

    for (const scalar of ns.scalars.values()) {
      const projected = projectType(scalar);
      if (projected.kind === "Scalar") {
        projectedNs.scalars.set(projected.name, projected);
      }
    }

    for (const childOperation of ns.operations.values()) {
      const projected = projectType(childOperation);
      if (projected.kind === "Operation") {
        projectedNs.operations.set(projected.name, projected);
      }
    }

    for (const childInterface of ns.interfaces.values()) {
      const projected = projectType(childInterface);
      if (projected.kind === "Interface") {
        projectedNs.interfaces.set(projected.name, projected);
      }
    }
    for (const childUnion of ns.unions.values()) {
      const projected = projectType(childUnion);
      if (projected.kind === "Union") {
        projectedNs.unions.set(projected.name!, projected);
      }
    }
    for (const childEnum of ns.enums.values()) {
      const projected = projectType(childEnum);
      if (projected.kind === "Enum") {
        projectedNs.enums.set(projected.name, projected);
      }
    }

    return projectedNs;
  }

  function projectModel(model: Model): Type {
    const properties = new Map<string, ModelProperty>();
    let templateArguments: Type[] | undefined;

    const projectedModel = shallowClone(model, {
      properties,
      derivedModels: [],
    });

    if (model.templateArguments !== undefined) {
      templateArguments = [];
      for (const arg of model.templateArguments) {
        templateArguments.push(projectType(arg));
      }
    }

    if (model.baseModel) {
      projectedModel.baseModel = projectType(model.baseModel) as Model;
    }

    if (model.indexer) {
      projectedModel.indexer = {
        key: projectType(model.indexer.key) as Scalar,
        value: projectType(model.indexer.value),
      };
    }

    projectedTypes.set(model, projectedModel);

    for (const [key, prop] of model.properties) {
      const projectedProp = projectModelProperty(prop, projectedModel);
      if (projectedProp.kind === "ModelProperty") {
        properties.set(key, projectedProp);
      }
    }

    projectedModel.decorators = projectDecorators(model.decorators);
    if (shouldFinishType(model)) {
      finishTypeForProgram(projectedProgram, projectedModel);
    }
    projectedModel.templateArguments = templateArguments;
    const projectedResult = applyProjection(model, projectedModel);
    if (
      !isNeverType(projectedResult) &&
      projectedResult.kind === "Model" &&
      projectedResult.baseModel
    ) {
      projectedResult.baseModel.derivedModels ??= [];
      projectedResult.baseModel.derivedModels.push(projectedModel);
    }
    return projectedResult;
  }

  function projectScalar(scalar: Scalar): Type {
    const projectedScalar = shallowClone(scalar, {
      derivedScalars: [],
    });

    let templateArguments: Type[] | undefined;
    if (scalar.templateArguments !== undefined) {
      templateArguments = scalar.templateArguments.map(projectType);
    }
    projectedScalar.templateArguments = templateArguments;

    if (scalar.baseScalar) {
      projectedScalar.baseScalar = projectType(scalar.baseScalar) as Scalar;
    }

    projectedTypes.set(scalar, projectedScalar);

    projectedScalar.decorators = projectDecorators(scalar.decorators);
    if (shouldFinishType(scalar)) {
      finishTypeForProgram(projectedProgram, projectedScalar);
    }
    const projectedResult = applyProjection(scalar, projectedScalar);
    if (
      !isNeverType(projectedResult) &&
      projectedResult.kind === "Scalar" &&
      projectedResult.baseScalar
    ) {
      projectedResult.baseScalar.derivedScalars ??= [];
      projectedResult.baseScalar.derivedScalars.push(projectedScalar);
    }
    return projectedResult;
  }

  /**
   * Returns true if we should finish a type. The only time we don't finish is when it's
   * a template type, because we don't want to run decorators for templates.
   */
  function shouldFinishType(type: Type) {
    const parentTemplate = getParentTemplateNode(type.node!);
    return !parentTemplate || isTemplateInstance(type);
  }

  function projectModelProperty(prop: ModelProperty, projectedModel?: Model): Type {
    if (prop.model && projectedModel === undefined) {
      return projectViaParent(prop, prop.model);
    }

    const projectedType = projectType(prop.type);
    const projectedDecs = projectDecorators(prop.decorators);

    const projectedProp = shallowClone(prop, {
      type: projectedType,
      decorators: projectedDecs,
    });

    if (projectedModel) {
      projectedProp.model = projectedModel;
    }

    if (prop.sourceProperty) {
      const sourceProperty = projectType(prop.sourceProperty) as ModelProperty;
      projectedProp.sourceProperty = sourceProperty;
    }

    if (shouldFinishType(prop)) {
      finishTypeForProgram(projectedProgram, projectedProp);
    }
    return projectedProp;
  }

  function projectOperation(op: Operation): Type {
    const parameters = projectType(op.parameters) as Model;
    const returnType = projectType(op.returnType);
    const decorators = projectDecorators(op.decorators);

    const projectedOp = shallowClone(op, {
      decorators,
      parameters,
      returnType,
    });

    if (op.interface) {
      projectedOp.interface = projectedInterfaceScope();
    } else if (op.namespace) {
      projectedOp.namespace = projectedNamespaceScope();
    }

    finishTypeForProgram(projectedProgram, projectedOp);
    return applyProjection(op, projectedOp);
  }

  function projectInterface(iface: Interface): Type {
    const operations = new Map<string, Operation>();
    const decorators = projectDecorators(iface.decorators);
    const projectedIface = shallowClone(iface, {
      decorators,
      operations,
    });

    for (const op of iface.operations.values()) {
      const projectedOp = projectType(op);
      if (projectedOp.kind === "Operation") {
        operations.set(projectedOp.name, projectedOp);
      }
    }

    if (shouldFinishType(iface)) {
      finishTypeForProgram(projectedProgram, projectedIface);
    }

    return applyProjection(iface, projectedIface);
  }

  function projectUnion(union: Union) {
    const variants = new Map<string | symbol, UnionVariant>();
    const decorators = projectDecorators(union.decorators);

    const projectedUnion = shallowClone(union, {
      decorators,
      variants,
    });

    for (const [key, variant] of union.variants) {
      const projectedVariant = projectUnionVariant(variant, union);
      if (projectedVariant.kind === "UnionVariant" && projectedVariant.type !== neverType) {
        variants.set(key, projectedVariant);
      }
    }

    if (shouldFinishType(union)) {
      finishTypeForProgram(projectedProgram, projectedUnion);
    }

    return applyProjection(union, projectedUnion);
  }

  function projectUnionVariant(variant: UnionVariant, projectingUnion?: Union) {
    if (projectingUnion === undefined) {
      return projectViaParent(variant, variant.union);
    }
    const projectedType = projectType(variant.type);
    const projectedDecs = projectDecorators(variant.decorators);

    const projectedVariant = shallowClone(variant, {
      type: projectedType,
      decorators: projectedDecs,
    });

    const parentUnion = projectType(variant.union) as Union;
    projectedVariant.union = parentUnion;
    finishTypeForProgram(projectedProgram, projectedVariant);
    return projectedVariant;
  }

  function projectTuple(tuple: Tuple) {
    const values: Type[] = [];
    const projectedTuple = shallowClone(tuple, {
      values,
    });

    for (const item of tuple.values) {
      values.push(projectType(item));
    }

    return projectedTuple;
  }

  function projectEnum(e: Enum) {
    const members = new Map<string, EnumMember>();
    const decorators = projectDecorators(e.decorators);
    const projectedEnum = shallowClone(e, {
      members,
      decorators,
    });

    projectedTypes.set(e, projectedEnum);

    for (const member of e.members.values()) {
      const projectedMember = projectType(member);
      if (projectedMember.kind === "EnumMember") {
        members.set(projectedMember.name, projectedMember);
      }
    }

    finishTypeForProgram(projectedProgram, projectedEnum);
    return applyProjection(e, projectedEnum);
  }

  function projectEnumMember(e: EnumMember, projectingEnum?: Enum) {
    const decorators = projectDecorators(e.decorators);
    const projectedMember = shallowClone(e, {
      decorators,
    });
    const parentEnum = projectType(e.enum) as Enum;
    projectedMember.enum = parentEnum;
    finishTypeForProgram(projectedProgram, projectedMember);
    return projectedMember;
  }

  function projectDecorators(decs: DecoratorApplication[]) {
    const decorators: DecoratorApplication[] = [];
    for (const dec of decs) {
      const args: DecoratorArgument[] = [];
      for (const arg of dec.args) {
        // filter out primitive arguments
        if (typeof arg.value !== "object") {
          args.push(arg);
          continue;
        }

        const projected = projectType(arg.value);
        args.push({ ...arg, value: projected });
      }

      decorators.push({ ...dec, args });
    }

    return decorators;
  }

  function getInScopeProjections() {
    const candidates = new Set(projections);
    const inScope: ProjectionApplication[] = [];
    let currentScope = namespaceScope();

    outer: while (currentScope) {
      for (const candidate of candidates) {
        if (!candidate.scope || candidate.scope === currentScope) {
          candidates.delete(candidate);
          inScope.push(candidate);

          if (candidates.size === 0) {
            break outer;
          }
        }
      }
      currentScope = currentScope.namespace;
    }

    return inScope;
  }

  function namespaceScope(): Namespace | undefined {
    for (let i = scope.length - 1; i >= 0; i--) {
      if ((scope[i] as any).namespace !== undefined) {
        return (scope[i] as any).namespace;
      }
    }

    return undefined;
  }

  function projectedNamespaceScope(): Namespace | undefined {
    const ns = namespaceScope();
    if (!ns) return ns;
    return projectType(ns) as Namespace;
  }

  function interfaceScope(): Interface | undefined {
    for (let i = scope.length - 1; i >= 0; i--) {
      if ("interface" in scope[i]) {
        return (scope[i] as any).interface;
      }
    }

    return undefined;
  }

  function projectedInterfaceScope(): Interface | undefined {
    const iface = interfaceScope();
    if (!iface) return iface;
    if (!projectedTypes.has(iface)) {
      throw new Error(`Interface "${iface.name}" should have been projected already`);
    }
    return projectType(iface) as Interface;
  }

  function applyProjection(baseType: Type, projectedType: Type): Type {
    const inScopeProjections = getInScopeProjections();
    for (const projectionApplication of inScopeProjections) {
      const projectionsByName = baseType.projectionsByName(projectionApplication.projectionName);
      if (projectionsByName.length === 0) continue;
      const targetNode =
        projectionApplication.direction === "from"
          ? projectionsByName[0].from!
          : projectionsByName[0].to!;
      const projected = checker.project(projectedType, targetNode, projectionApplication.arguments);
      if (projected !== projectedType) {
        // override the projected type cache with the returned type
        projectedTypes.set(baseType, projected);
        return projected;
      }
    }

    return projectedType;
  }

  function shallowClone<T extends Type>(type: T, additionalProps: Partial<T>): T {
    const scopeProps: any = {};
    if ("namespace" in type && type.namespace !== undefined) {
      scopeProps.namespace = projectedNamespaceScope();
    }
    if ("interface" in type && type.interface !== undefined) {
      scopeProps.interface = projectedInterfaceScope();
    }

    const clone = checker.createType({
      ...type,
      ...additionalProps,
      ...scopeProps,
      projectionSource: type,
      projectionBase: type.projectionBase ?? type,
      projector,
    });

    if (type.kind === "Union") {
      // create the options getter
      Object.defineProperty(clone, "options", {
        get(this: Union) {
          return Array.from(this.variants.values()).map((v) => v.type);
        },
      });
    }

    projectedTypes.set(type, clone);
    return clone;
  }

  /**
   * Project the given type by projecting the parent type first.
   * @param type Type to project.
   * @param parentType Parent type that should be projected first.
   * @returns Projected type
   */
  function projectViaParent(type: Type, parentType: Type): Type {
    projectType(parentType);
    const projectedProp = projectedTypes.get(type);
    compilerAssert(
      projectedProp,
      `Type "${program.checker.getTypeName(type)}" should have been projected by now.`
    );
    return projectedProp;
  }
}
