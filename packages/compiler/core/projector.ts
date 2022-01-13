import { ArrayType, EnumMemberType, TupleType, UnionTypeVariant } from ".";
import { Program } from "./program";
import {
  DecoratorApplication,
  EnumType,
  InterfaceType,
  ModelType,
  ModelTypeProperty,
  NamespaceType,
  OperationType,
  ProjectionApplication,
  Projector,
  SyntaxKind,
  Type,
  UnionType,
} from "./types.js";

type DeclScope = NamespaceType | ModelType | InterfaceType | UnionType | EnumType | OperationType;
export function createProjector(
  program: Program,
  projections: ProjectionApplication[],
  startNode?: Type
): Projector {
  const projectedTypes = new Map<Type, Type>();
  const stateSets = new Map();
  const stateMaps = new Map();
  const checker = program.checker!;
  let scope: Type[] = [];

  const projector: Projector = {
    stateSets,
    stateMaps,
    projectedTypes,
    projections,
    projectType,
  };

  program.currentProjector = projector;
  projector.projectedStartNode = projectType(
    startNode ?? program.checker!.getGlobalNamespaceType()
  );

  return projector;

  function projectType(type: Type): Type {
    if (projectedTypes.has(type)) {
      return projectedTypes.get(type)!;
    }

    scope.push(type);
    let projected;
    switch (type.kind) {
      case "Namespace":
        projected = projectNamespace(type);
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
      case "Array":
        projected = projectArray(type);
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

  function projectNamespace(ns: NamespaceType): Type {
    const childNamespaces = new Map<string, NamespaceType>();
    const childModels = new Map<string, ModelType>();
    const childOperations = new Map<string, OperationType>();
    const childInterfaces = new Map<string, InterfaceType>();
    const childUnions = new Map<string, UnionType>();
    const childEnums = new Map<string, EnumType>();

    removeProjectedState(ns);
    let projectedNs: NamespaceType = checker.createAndFinishType({
      ...ns,
      namespaces: childNamespaces,
      models: childModels,
      operations: childOperations,
      interfaces: childInterfaces,
      unions: childUnions,
      namespace: ns.namespace ? projectedNamespaceScope() : undefined,
    });

    projectedTypes.set(ns, projectedNs);

    for (const [key, childNs] of ns.namespaces) {
      const projected = projectType(childNs);
      if (projected.kind === "Namespace") {
        // todo: check for never?
        childNamespaces.set(key, projected);
      }
    }

    for (const [key, childModel] of ns.models) {
      const projected = projectType(childModel);
      if (projected.kind === "Model") {
        // todo: check for never?
        childModels.set(key, projected);
      }
    }

    for (const [key, childOperation] of ns.operations) {
      const projected = projectType(childOperation);
      if (projected.kind === "Operation") {
        // todo: check for never?
        childOperations.set(key, projected);
      }
    }

    for (const [key, childInterface] of ns.interfaces) {
      const projected = projectType(childInterface);
      if (projected.kind === "Interface") {
        // todo: check for never?
        childInterfaces.set(key, projected);
      }
    }
    for (const [key, childUnion] of ns.unions) {
      const projected = projectType(childUnion);
      if (projected.kind === "Union") {
        // todo: check for never?
        childUnions.set(key, projected);
      }
    }

    return applyProjection(ns, projectedNs);
  }

  function projectModel(model: ModelType): Type {
    const properties = new Map<string, ModelTypeProperty>();
    let templateArguments: Type[] | undefined;

    let projectedModel: ModelType = checker.createType({
      ...model,
      properties,
      namespace: model.namespace ? projectedNamespaceScope() : undefined,
    });

    if (model.templateArguments !== undefined) {
      templateArguments = [];
      for (const arg of model.templateArguments) {
        templateArguments.push(projectType(arg));
      }
    }

    if (model.baseModel) {
      projectedModel.baseModel = projectType(model.baseModel) as ModelType;
    }

    projectedTypes.set(model, projectedModel);

    for (const [key, prop] of model.properties) {
      const projectedProp = projectType(prop);
      if (projectedProp.kind === "ModelProperty") {
        properties.set(key, projectedProp);
      }
    }

    projectedModel.decorators = projectDecorators(model.decorators);
    if (shouldFinishType(model)) {
      removeProjectedState(model);
      checker.finishType(projectedModel);
    }
    projectedModel.templateArguments = templateArguments;
    let p = applyProjection(model, projectedModel);
    return p;
  }

  /**
   * Returns true if we should finish a type. The only time we don't finish is when it's
   * a template type, because we don't want to run decorators for templates.
   */
  function shouldFinishType(type: ModelType | InterfaceType | UnionType) {
    if (
      type.node.kind !== SyntaxKind.ModelStatement &&
      type.node.kind !== SyntaxKind.InterfaceStatement
    ) {
      return true;
    }
    if (type.node.templateParameters.length === 0) {
      return true;
    }
    // we have template arguments
    if (!type.templateArguments) {
      return false;
    }

    if (type.templateArguments.length < type.node.templateParameters.length) {
      return false;
    }

    return true;
  }
  function projectModelProperty(prop: ModelTypeProperty): Type {
    const projectedType = projectType(prop.type);
    const projectedDecs = projectDecorators(prop.decorators);

    const projectedProp = checker.createType({
      ...prop,
      type: projectedType,
      decorators: projectedDecs,
    });
    projectedTypes.set(prop, projectedProp);

    removeProjectedState(prop);
    checker.finishType(projectedProp);
    return projectedProp;
  }

  function projectOperation(op: OperationType): Type {
    const parameters = projectType(op.parameters) as ModelType;
    const returnType = projectType(op.returnType);
    const decorators = projectDecorators(op.decorators);

    let projectedOp: OperationType = checker.createType({
      ...op,
      decorators,
      parameters,
      returnType,
    });
    projectedTypes.set(op, projectedOp);
    if (op.interface) {
      projectedOp.interface = projectedInterfaceScope();
    } else if (op.namespace) {
      projectedOp.namespace = projectedNamespaceScope();
    }
    removeProjectedState(op);
    checker.finishType(projectedOp);
    return applyProjection(op, projectedOp);
  }

  function projectInterface(iface: InterfaceType): Type {
    const operations = new Map<string, OperationType>();
    const decorators = projectDecorators(iface.decorators);
    let projectedIface: InterfaceType = checker.createType({
      ...iface,
      decorators,
      operations,
      namespace: projectedNamespaceScope(),
    });

    projectedTypes.set(iface, projectedIface);
    for (const [key, op] of iface.operations) {
      const projectedOp = projectType(op);
      if (projectedOp.kind === "Operation") {
        operations.set(key, projectedOp);
      }
    }

    if (shouldFinishType(iface)) {
      removeProjectedState(iface);
      checker.finishType(projectedIface);
    }

    return applyProjection(iface, projectedIface);
  }

  function projectUnion(union: UnionType) {
    const variants = new Map<string | Symbol, UnionTypeVariant>();
    for (const [key, variant] of union.variants) {
      const projectedVariant = projectType(variant);
      if (projectedVariant.kind === "UnionVariant") {
        variants.set(key, projectedVariant);
      }
    }

    const decorators = projectDecorators(union.decorators);
    let projectedUnion: UnionType = checker.createType({
      ...union,
      decorators,
      variants,
      namespace: union.namespace ? namespaceScope() : undefined,
      get options() {
        return Array.from(this.variants.values()).map((v) => v.type);
      },
    });
    projectedTypes.set(union, projectedUnion);
    if (shouldFinishType(union)) {
      removeProjectedState(union);
      checker.finishType(projectedUnion);
    }

    return applyProjection(union, projectedUnion);
  }

  function projectUnionVariant(variant: UnionTypeVariant) {
    const projectedType = projectType(variant.type);
    const projectedDecs = projectDecorators(variant.decorators);

    const projectedVariant = checker.createType({
      ...variant,
      type: projectedType,
      decorators: projectedDecs,
    });
    projectedTypes.set(variant, projectedVariant);

    removeProjectedState(variant);
    checker.finishType(projectedVariant);
    return projectedVariant;
  }

  function projectArray(array: ArrayType) {
    const projectedType = projectType(array.elementType);

    const projectedArray: ArrayType = checker.createType({
      ...array,
      elementType: projectedType,
    });
    projectedTypes.set(array, projectedArray);
    checker.finishType(projectedArray);
    return projectedArray;
  }

  function projectTuple(tuple: TupleType) {
    const values: Type[] = [];
    for (const item of tuple.values) {
      values.push(projectType(item));
    }

    const projectedTuple: TupleType = checker.createAndFinishType({
      ...tuple,
      values,
    });
    projectedTypes.set(tuple, projectedTuple);
    return projectedTuple;
  }

  function projectEnum(e: EnumType) {
    const members: EnumMemberType[] = [];
    const decorators = projectDecorators(e.decorators);
    for (const member of e.members) {
      const projectedMember = projectType(member);
      if (projectedMember.kind === "EnumMember") {
        members.push(projectedMember);
      }
    }

    const projectedEnum: EnumType = checker.createType({
      ...e,
      members,
      decorators,
    });

    projectedTypes.set(e, projectedEnum);
    removeProjectedState(e);
    checker.finishType(projectedEnum);
    return applyProjection(e, projectedEnum);
  }

  function projectEnumMember(e: EnumMemberType) {
    const decorators = projectDecorators(e.decorators);

    const projectedMember = checker.createType({
      ...e,
      decorators,
    });
    projectedTypes.set(e, projectedMember);

    removeProjectedState(e);
    checker.finishType(projectedMember);
    return projectedMember;
  }

  function projectDecorators(decs: DecoratorApplication[]) {
    const decorators: DecoratorApplication[] = [];
    for (const dec of decs) {
      const args = [];
      for (const arg of dec.args) {
        // filter out primitive arguments
        if (typeof arg !== "object") {
          args.push(arg);
          continue;
        }

        const projected = projectType(arg);
        args.push(projected);
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

  function namespaceScope(): NamespaceType | undefined {
    for (let i = scope.length - 1; i >= 0; i--) {
      if ((scope[i] as any).namespace !== undefined) {
        return (scope[i] as any).namespace;
      }
    }

    return undefined;
  }

  function projectedNamespaceScope(): NamespaceType | undefined {
    const ns = namespaceScope();
    if (!ns) return ns;
    return projectType(ns) as NamespaceType;
  }

  function interfaceScope(): InterfaceType | undefined {
    for (let i = scope.length - 1; i >= 0; i--) {
      if ("interface" in scope[i]) {
        return (scope[i] as any).interface;
      }
    }

    return undefined;
  }

  function projectedInterfaceScope(): InterfaceType | undefined {
    const iface = interfaceScope();
    if (!iface) return iface;
    if (!projectedTypes.has(iface)) {
      throw new Error("Interface should have been projected already");
    }
    return projectType(iface) as InterfaceType;
  }

  function applyProjection(baseType: Type, projectedType: Type): Type {
    (projectedType as any).__PROJECTED__ = true;
    const inScopeProjections = getInScopeProjections();
    for (const projectionApplication of inScopeProjections) {
      const projectionsByName = baseType.projectionsByName(projectionApplication.projectionName);
      if (projectionsByName.length === 0) continue;
      let targetNode =
        projectionApplication.direction === "from"
          ? projectionsByName[0].from!
          : projectionsByName[0].to!;
      const projected = checker.project(projectedType, targetNode, projectionApplication.arguments);
      if (projected.kind !== baseType.kind) {
        projectedTypes.set(baseType, projected);
        return projected;
      } else {
        projectedType = projected;
      }
    }
    projectedTypes.set(baseType, projectedType);

    return projectedType;
  }
  function removeProjectedState(type: Type) {
    /*
    for (const set of stateSets.values()) {
      set.delete(type);
    }

    for (const map of stateMaps.values()) {
      map.delete(type);
    }
    */
  }
}
