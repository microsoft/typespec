import { MultiKeyMap } from "../utils/misc.js";
import { Checker, walkPropertiesInherited } from "./checker.js";
import { compilerAssert, reportDeprecated } from "./diagnostics.js";
import { getEntityName, getTypeName } from "./helpers/type-name-utils.js";
import {
  getMaxItems,
  getMaxLength,
  getMaxValueAsNumeric,
  getMaxValueExclusiveAsNumeric,
  getMinItems,
  getMinLength,
  getMinValueAsNumeric,
  getMinValueExclusiveAsNumeric,
} from "./intrinsic-type-state.js";
import { CompilerDiagnostics, createDiagnostic } from "./messages.js";
import { numericRanges } from "./numeric-ranges.js";
import { Numeric } from "./numeric.js";
import { Program } from "./program.js";
import { isArrayModelType, isNeverType, isUnknownType, isValue, isVoidType } from "./type-utils.js";
import {
  ArrayModelType,
  ArrayValue,
  Diagnostic,
  DiagnosticReport,
  Entity,
  Enum,
  IndeterminateEntity,
  MixedParameterConstraint,
  Model,
  ModelIndexer,
  ModelProperty,
  Namespace,
  Node,
  NoTarget,
  NumericLiteral,
  Scalar,
  StringLiteral,
  StringTemplate,
  SyntaxKind,
  Tuple,
  Type,
  Union,
  Value,
} from "./types.js";

export interface TypeRelation {
  isTypeAssignableTo(
    source: Entity | IndeterminateEntity,
    target: Entity,
    diagnosticTarget: Entity | Node,
  ): [boolean, readonly Diagnostic[]];

  isValueOfType(
    source: Value,
    target: Type,
    diagnosticTarget: Entity | Node,
  ): [boolean, readonly Diagnostic[]];

  isReflectionType(type: Type): type is Model & { name: ReflectionTypeName };

  areScalarsRelated(source: Scalar, target: Scalar): boolean;
}

enum Related {
  false = 0,
  true = 1,
  maybe = 2,
}

interface TypeRelationError {
  code:
    | "unassignable"
    | "property-unassignable"
    | "missing-index"
    | "property-required"
    | "missing-property"
    | "unexpected-property";
  message: string;
  children: readonly TypeRelationError[];
  target: Entity | Node;
  /** If the first error and it has a child show the child error at this target instead */
  skipIfFirst?: boolean;
}

/**
 * Mapping from the reflection models to Type["kind"] value
 */
const ReflectionNameToKind = {
  Enum: "Enum",
  EnumMember: "EnumMember",
  Interface: "Interface",
  Model: "Model",
  ModelProperty: "ModelProperty",
  Namespace: "Namespace",
  Operation: "Operation",
  Scalar: "Scalar",
  TemplateParameter: "TemplateParameter",
  Tuple: "Tuple",
  Union: "Union",
  UnionVariant: "UnionVariant",
} as const;

const _assertReflectionNameToKind: Record<string, Type["kind"]> = ReflectionNameToKind;

type ReflectionTypeName = keyof typeof ReflectionNameToKind;

export function createTypeRelationChecker(program: Program, checker: Checker): TypeRelation {
  return {
    isTypeAssignableTo,
    isValueOfType,
    isReflectionType,
    areScalarsRelated,
  };

  /**
   * Check if the source type can be assigned to the target type.
   * @param source Source type
   * @param target Target type
   * @param diagnosticTarget Target for the diagnostic, unless something better can be inferred.
   */
  function isTypeAssignableTo(
    source: Entity | IndeterminateEntity,
    target: Entity,
    diagnosticTarget: Entity | Node,
  ): [boolean, readonly Diagnostic[]] {
    const [related, errors] = isTypeAssignableToInternal(
      source,
      target,
      diagnosticTarget,
      new MultiKeyMap<[Entity, Entity], Related>(),
    );
    return [related === Related.true, convertErrorsToDiagnostics(errors, diagnosticTarget)];
  }

  function isTargetChildOf(target: Entity | Node, base: Entity | Node) {
    const errorNode: Node =
      "kind" in target && typeof target.kind === "number" ? target : (target as any).node;
    const baseNode: Node =
      "kind" in base && typeof base.kind === "number" ? base : (base as any).node;
    let currentNode: Node | undefined = errorNode;
    while (currentNode) {
      if (currentNode === baseNode) {
        return true;
      }
      currentNode = currentNode.parent;
    }
    return false;
  }

  function convertErrorsToDiagnostics(
    errors: readonly TypeRelationError[],
    diagnosticBase: Entity | Node,
  ): readonly Diagnostic[] {
    return errors.flatMap((x) => convertErrorToDiagnostic(x, diagnosticBase));
  }

  function combineErrorMessage(error: TypeRelationError): string {
    let message = error.message;
    let current = error.children[0];
    let indent = "  ";
    while (current !== undefined) {
      message += current.message
        .split("\n")
        .map((line) => `\n${indent}${line}`)
        .join("");
      indent += "  ";
      current = current.children[0];
    }
    return message;
  }

  function flattenErrors(
    error: TypeRelationError,
    diagnosticBase: Entity | Node,
  ): TypeRelationError[] {
    if (!isTargetChildOf(error.target, diagnosticBase)) {
      return [{ ...error, target: diagnosticBase }];
    }
    if (error.children.length === 0) {
      return [error];
    }
    return error.children.flatMap((x) => flattenErrors(x, error.target));
  }
  function convertErrorToDiagnostic(
    error: TypeRelationError,
    diagnosticBase: Entity | Node,
  ): Diagnostic[] {
    const flattened = flattenErrors(error, diagnosticBase);
    return flattened.map((error) => {
      const messageBase =
        error.skipIfFirst && error.children.length > 0 ? error.children[0] : error;
      const message = combineErrorMessage(messageBase);

      return {
        severity: "error",
        code: error.code,
        message: message,
        target: error.target,
      };
    });
  }

  /**
   * Check if the given Value type is of the given type.
   * @param source Value
   * @param target Target type
   * @param diagnosticTarget Target for the diagnostic, unless something better can be inferred.
   */
  function isValueOfType(
    source: Value,
    target: Type,
    diagnosticTarget: Entity | Node,
  ): [boolean, readonly Diagnostic[]] {
    const [related, errors] = isValueOfTypeInternal(
      source,
      target,
      diagnosticTarget,
      new MultiKeyMap<[Entity, Entity], Related>(),
    );
    return [related === Related.true, convertErrorsToDiagnostics(errors, diagnosticTarget)];
  }

  function isTypeAssignableToInternal(
    source: Entity | IndeterminateEntity,
    target: Entity,
    diagnosticTarget: Entity | Node,
    relationCache: MultiKeyMap<[Entity | IndeterminateEntity, Entity], Related>,
  ): [Related, readonly TypeRelationError[]] {
    const cached = relationCache.get([source, target]);
    if (cached !== undefined) {
      return [cached, []];
    }
    const [result, diagnostics] = isTypeAssignableToWorker(
      source,
      target,
      diagnosticTarget,
      new MultiKeyMap<[Entity, Entity], Related>(),
    );
    relationCache.set([source, target], result);
    return [result, diagnostics];
  }

  function isTypeAssignableToWorker(
    source: Entity | IndeterminateEntity,
    target: Entity,
    diagnosticTarget: Entity | Node,
    relationCache: MultiKeyMap<[Entity, Entity], Related>,
  ): [Related, readonly TypeRelationError[]] {
    // BACKCOMPAT: Allow certain type to be accepted as values
    if (
      "kind" in source &&
      "entityKind" in target &&
      source.kind === "TemplateParameter" &&
      source.constraint?.type &&
      source.constraint.valueType === undefined &&
      target.entityKind === "MixedParameterConstraint" &&
      target.valueType
    ) {
      const [assignable] = isTypeAssignableToInternal(
        source.constraint.type,
        target.valueType,
        diagnosticTarget,
        relationCache,
      );
      if (assignable) {
        const constraint = getEntityName(source.constraint);
        reportDeprecated(
          program,
          `Template constrainted to '${constraint}' will not be assignable to '${getEntityName(
            target,
          )}' in the future. Update the constraint to be 'valueof ${constraint}'`,
          diagnosticTarget,
        );
        return [Related.true, []];
      }
    }

    if ("kind" in source && source.kind === "TemplateParameter") {
      source = source.constraint ?? checker.anyType;
    }
    if (target.entityKind === "Indeterminate") {
      target = target.type;
    }

    if (source === target) return [Related.true, []];

    if (isValue(target)) {
      return [Related.false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
    }
    if (source.entityKind === "Indeterminate") {
      return isIndeterminateEntityAssignableTo(source, target, diagnosticTarget, relationCache);
    }

    if (target.entityKind === "MixedParameterConstraint") {
      return isAssignableToMixedParameterConstraint(
        source,
        target,
        diagnosticTarget,
        relationCache,
      );
    }

    if (isValue(source) || (source.entityKind === "MixedParameterConstraint" && source.valueType)) {
      return [Related.false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
    }
    if (source.entityKind === "MixedParameterConstraint") {
      return isTypeAssignableToInternal(source.type!, target, diagnosticTarget, relationCache);
    }

    const isSimpleTypeRelated = isSimpleTypeAssignableTo(source, target);
    if (isSimpleTypeRelated === true) {
      return [Related.true, []];
    } else if (isSimpleTypeRelated === false) {
      return [Related.false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
    }

    if (source.kind === "Union") {
      for (const variant of source.variants.values()) {
        const [variantAssignable] = isTypeAssignableToInternal(
          variant.type,
          target,
          diagnosticTarget,
          relationCache,
        );
        if (!variantAssignable) {
          return [Related.false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
        }
      }
      return [Related.true, []];
    }

    if (
      target.kind === "Model" &&
      source.kind === "Model" &&
      target.name !== "object" &&
      target.indexer === undefined &&
      source.indexer &&
      source.indexer.key.name === "integer"
    ) {
      return [
        Related.false,
        [
          createTypeRelationError({
            code: "missing-index",
            format: {
              indexType: getTypeName(source.indexer.key),
              sourceType: getTypeName(target),
            },
            diagnosticTarget,
          }),
        ],
      ];
    } else if (
      target.kind === "Model" &&
      isArrayModelType(program, target) &&
      source.kind === "Model"
    ) {
      if (isArrayModelType(program, source)) {
        return hasIndexAndIsAssignableTo(
          source,
          target as Model & { indexer: ModelIndexer },
          diagnosticTarget,
          relationCache,
        );
      } else {
        // For other models just fallback to unassignable
        return [Related.false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
      }
    } else if (target.kind === "Model" && source.kind === "Model") {
      return areModelsRelated(source, target, diagnosticTarget, relationCache);
    } else if (
      target.kind === "Model" &&
      isArrayModelType(program, target) &&
      source.kind === "Tuple"
    ) {
      return isTupleAssignableToArray(source, target, diagnosticTarget, relationCache);
    } else if (target.kind === "Tuple" && source.kind === "Tuple") {
      return isTupleAssignableToTuple(source, target, diagnosticTarget, relationCache);
    } else if (target.kind === "Union") {
      return isAssignableToUnion(source, target, diagnosticTarget, relationCache);
    } else if (target.kind === "Enum") {
      return isAssignableToEnum(source, target, diagnosticTarget);
    }

    return [Related.false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
  }

  function isIndeterminateEntityAssignableTo(
    indeterminate: IndeterminateEntity,
    target: Type | MixedParameterConstraint,
    diagnosticTarget: Entity | Node,
    relationCache: MultiKeyMap<[Entity, Entity], Related>,
  ): [Related, readonly TypeRelationError[]] {
    const [typeRelated, typeDiagnostics] = isTypeAssignableToInternal(
      indeterminate.type,
      target,
      diagnosticTarget,
      relationCache,
    );
    if (typeRelated) {
      return [Related.true, []];
    }

    if (target.entityKind === "MixedParameterConstraint" && target.valueType) {
      const [valueRelated] = isTypeAssignableToInternal(
        indeterminate.type,
        target.valueType,
        diagnosticTarget,
        relationCache,
      );

      if (valueRelated) {
        return [Related.true, []];
      }
    }

    return [Related.false, typeDiagnostics];
  }

  function isAssignableToValueType(
    source: Entity,
    target: Type,
    diagnosticTarget: Entity | Node,
    relationCache: MultiKeyMap<[Entity, Entity], Related>,
  ): [Related, readonly TypeRelationError[]] {
    if (!isValue(source)) {
      return [Related.false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
    }

    return isValueOfTypeInternal(source, target, diagnosticTarget, relationCache);
  }

  function isAssignableToMixedParameterConstraint(
    source: Entity,
    target: MixedParameterConstraint,
    diagnosticTarget: Entity | Node,
    relationCache: MultiKeyMap<[Entity, Entity], Related>,
  ): [Related, readonly TypeRelationError[]] {
    if ("entityKind" in source && source.entityKind === "MixedParameterConstraint") {
      if (source.type && target.type) {
        const [variantAssignable, diagnostics] = isTypeAssignableToInternal(
          source.type,
          target.type,
          diagnosticTarget,
          relationCache,
        );
        if (variantAssignable === Related.false) {
          return [Related.false, diagnostics];
        }
        return [Related.true, []];
      }
      if (source.valueType && target.valueType) {
        const [variantAssignable, diagnostics] = isTypeAssignableToInternal(
          source.valueType,
          target.valueType,
          diagnosticTarget,
          relationCache,
        );
        if (variantAssignable === Related.false) {
          return [Related.false, diagnostics];
        }
        return [Related.true, []];
      }
      return [Related.false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
    }

    if (target.type) {
      const [related] = isTypeAssignableToInternal(
        source,
        target.type,
        diagnosticTarget,
        relationCache,
      );
      if (related) {
        return [Related.true, []];
      }
    }
    if (target.valueType) {
      const [related] = isAssignableToValueType(
        source,
        target.valueType,
        diagnosticTarget,
        relationCache,
      );
      if (related) {
        return [Related.true, []];
      }
    }
    return [Related.false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
  }

  /** Check if the value is assignable to the given type. */
  function isValueOfTypeInternal(
    source: Value,
    target: Type,
    diagnosticTarget: Entity | Node,
    relationCache: MultiKeyMap<[Entity, Entity], Related>,
  ): [Related, readonly TypeRelationError[]] {
    return isTypeAssignableToInternal(source.type, target, diagnosticTarget, relationCache);
  }

  function isReflectionType(type: Type): type is Model & { name: ReflectionTypeName } {
    return (
      type.kind === "Model" &&
      type.namespace?.name === "Reflection" &&
      type.namespace?.namespace?.name === "TypeSpec"
    );
  }

  function isRelatedToScalar(source: Type, target: Scalar): boolean | undefined {
    switch (source.kind) {
      case "Number":
        return isNumericLiteralRelatedTo(source, target);
      case "String":
      case "StringTemplate":
        return isStringLiteralRelatedTo(source, target);
      case "Boolean":
        return areScalarsRelated(target, checker.getStdType("boolean"));
      case "Scalar":
        return areScalarsRelated(source, target);
      case "Union":
        return undefined;
      default:
        return false;
    }
  }

  function areScalarsRelated(source: Scalar, target: Scalar) {
    let current: Scalar | undefined = source;
    while (current) {
      if (current === target) {
        return true;
      }

      current = current.baseScalar;
    }
    return false;
  }

  function isSimpleTypeAssignableTo(source: Type, target: Type): boolean | undefined {
    if (isNeverType(source)) return true;
    if (isVoidType(target)) return false;
    if (isUnknownType(target)) return true;
    if (isReflectionType(target)) {
      return source.kind === ReflectionNameToKind[target.name];
    }

    if (target.kind === "Scalar") {
      return isRelatedToScalar(source, target);
    }

    if (source.kind === "Scalar" && target.kind === "Model") {
      return false;
    }
    if (target.kind === "String") {
      return (
        (source.kind === "String" && source.value === target.value) ||
        (source.kind === "StringTemplate" && source.stringValue === target.value)
      );
    }
    if (target.kind === "StringTemplate" && target.stringValue) {
      return (
        (source.kind === "String" && source.value === target.stringValue) ||
        (source.kind === "StringTemplate" && source.stringValue === target.stringValue)
      );
    }
    if (target.kind === "Number") {
      return source.kind === "Number" && target.value === source.value;
    }
    return undefined;
  }

  function isNumericLiteralRelatedTo(source: NumericLiteral, target: Scalar) {
    // First check that the source numeric literal is assignable to the target scalar
    if (!isNumericAssignableToNumericScalar(source.numericValue, target)) {
      return false;
    }
    const min = getMinValueAsNumeric(program, target);
    const max = getMaxValueAsNumeric(program, target);
    const minExclusive = getMinValueExclusiveAsNumeric(program, target);
    const maxExclusive = getMaxValueExclusiveAsNumeric(program, target);
    if (min && source.numericValue.lt(min)) {
      return false;
    }
    if (minExclusive && source.numericValue.lte(minExclusive)) {
      return false;
    }
    if (max && source.numericValue.gt(max)) {
      return false;
    }

    if (maxExclusive && source.numericValue.gte(maxExclusive)) {
      return false;
    }
    return true;
  }

  function isNumericAssignableToNumericScalar(source: Numeric, target: Scalar) {
    // if the target does not derive from numeric, then it can't be assigned a numeric literal
    if (
      !areScalarsRelated((target.projectionBase as any) ?? target, checker.getStdType("numeric"))
    ) {
      return false;
    }

    // With respect to literal assignability a custom numeric scalar is
    // equivalent to its nearest TypeSpec.* base. Adjust target accordingly.
    while (!target.namespace || !isTypeSpecNamespace(target.namespace)) {
      compilerAssert(
        target.baseScalar,
        "Should not be possible to be derived from TypeSpec.numeric and not have a base when not in TypeSpec namespace.",
      );
      target = target.baseScalar;
    }

    if (target.name === "numeric") return true;
    if (target.name === "decimal") return true;
    if (target.name === "decimal128") return true;

    const isInt = source.isInteger;
    if (target.name === "integer") return isInt;
    if (target.name === "float") return true;

    if (!(target.name in numericRanges)) return false;
    const [low, high, options] = numericRanges[target.name as keyof typeof numericRanges];
    return source.gte(low) && source.lte(high) && (!options.int || isInt);
  }

  function isStringLiteralRelatedTo(source: StringLiteral | StringTemplate, target: Scalar) {
    if (
      !areScalarsRelated((target.projectionBase as any) ?? target, checker.getStdType("string"))
    ) {
      return false;
    }
    if (source.kind === "StringTemplate") {
      return true;
    }
    const len = source.value.length;
    const min = getMinLength(program, target);
    const max = getMaxLength(program, target);
    if (min && len < min) {
      return false;
    }
    if (max && len > max) {
      return false;
    }

    return true;
  }

  function areModelsRelated(
    source: Model,
    target: Model,
    diagnosticTarget: Entity | Node,
    relationCache: MultiKeyMap<[Entity, Entity], Related>,
  ): [Related, readonly TypeRelationError[]] {
    relationCache.set([source, target], Related.maybe);
    const errors: TypeRelationError[] = [];
    const remainingProperties = new Map(source.properties);

    for (const prop of walkPropertiesInherited(target)) {
      const sourceProperty = getProperty(source, prop.name);
      if (sourceProperty === undefined) {
        if (!prop.optional) {
          errors.push(
            createTypeRelationError({
              code: "missing-property",
              format: {
                propertyName: prop.name,
                sourceType: getTypeName(source),
                targetType: getTypeName(target),
              },
              diagnosticTarget: source,
            }),
          );
        }
      } else {
        remainingProperties.delete(prop.name);

        if (sourceProperty.optional && !prop.optional) {
          errors.push(
            createTypeRelationError({
              code: "property-required",
              format: {
                propName: prop.name,
                targetType: getTypeName(target),
              },
              diagnosticTarget,
            }),
          );
        }
        const [related, propErrors] = isTypeAssignableToInternal(
          sourceProperty.type,
          prop.type,
          diagnosticTarget,
          relationCache,
        );
        if (!related) {
          errors.push(...wrapUnassignablePropertyErrors(sourceProperty, propErrors));
        }
      }
    }

    if (target.indexer) {
      const [_, indexerDiagnostics] = arePropertiesAssignableToIndexer(
        remainingProperties,
        target.indexer.value,
        diagnosticTarget,
        relationCache,
      );
      errors.push(...indexerDiagnostics);

      // For anonymous models we don't need an indexer
      if (source.name !== "" && target.indexer.key.name !== "integer") {
        const [related, indexDiagnostics] = hasIndexAndIsAssignableTo(
          source,
          target as any,
          diagnosticTarget,
          relationCache,
        );
        if (!related) {
          errors.push(...indexDiagnostics);
        }
      }
    } else if (shouldCheckExcessProperties(source)) {
      for (const [propName, prop] of remainingProperties) {
        if (shouldCheckExcessProperty(prop)) {
          errors.push(
            createTypeRelationError({
              code: "unexpected-property",
              format: {
                propertyName: propName,
                type: getEntityName(target),
              },
              diagnosticTarget: prop,
            }),
          );
        }
      }
    }

    return [
      errors.length === 0 ? Related.true : Related.false,
      wrapUnassignableErrors(source, target, errors),
    ];
  }

  /** If we should check for excess properties on the given model. */
  function shouldCheckExcessProperties(model: Model) {
    return model.node?.kind === SyntaxKind.ObjectLiteral;
  }
  /** If we should check for this specific property */
  function shouldCheckExcessProperty(prop: ModelProperty) {
    return (
      prop.node?.kind === SyntaxKind.ObjectLiteralProperty && prop.node.parent === prop.model?.node
    );
  }

  function getProperty(model: Model, name: string): ModelProperty | undefined {
    return (
      model.properties.get(name) ??
      (model.baseModel !== undefined ? getProperty(model.baseModel, name) : undefined)
    );
  }

  function arePropertiesAssignableToIndexer(
    properties: Map<string, ModelProperty>,
    indexerConstaint: Type,
    diagnosticTarget: Entity | Node,
    relationCache: MultiKeyMap<[Type, Type], Related>,
  ): [Related, readonly TypeRelationError[]] {
    for (const prop of properties.values()) {
      const [related, diagnostics] = isTypeAssignableToInternal(
        prop.type,
        indexerConstaint,
        diagnosticTarget,
        relationCache,
      );
      if (!related) {
        return [Related.false, diagnostics];
      }
    }

    return [Related.true, []];
  }

  /** Check that the source model has an index, the index key match and the value of the source index is assignable to the target index. */
  function hasIndexAndIsAssignableTo(
    source: Model,
    target: Model & { indexer: ModelIndexer },
    diagnosticTarget: Entity | Node,
    relationCache: MultiKeyMap<[Entity, Entity], Related>,
  ): [Related, readonly TypeRelationError[]] {
    if (source.indexer === undefined || source.indexer.key !== target.indexer.key) {
      return [
        Related.false,
        [
          createTypeRelationError({
            code: "missing-index",
            format: {
              indexType: getTypeName(target.indexer.key),
              sourceType: getTypeName(source),
            },
            diagnosticTarget,
          }),
        ],
      ];
    }
    return isTypeAssignableToInternal(
      source.indexer.value!,
      target.indexer.value,
      diagnosticTarget,
      relationCache,
    );
  }

  function isTupleAssignableToArray(
    source: Tuple,
    target: ArrayModelType,
    diagnosticTarget: Entity | Node,
    relationCache: MultiKeyMap<[Entity, Entity], Related>,
  ): [Related, readonly TypeRelationError[]] {
    const minItems = getMinItems(program, target);
    const maxItems = getMaxItems(program, target);
    if (minItems !== undefined && source.values.length < minItems) {
      return [
        Related.false,
        [
          createUnassignableDiagnostic(
            source,
            target,
            diagnosticTarget,
            `Source has ${source.values.length} element(s) but target requires ${minItems}.`,
          ),
        ],
      ];
    }
    if (maxItems !== undefined && source.values.length > maxItems) {
      return [
        Related.false,
        [
          createUnassignableDiagnostic(
            source,
            target,
            diagnosticTarget,
            `Source has ${source.values.length} element(s) but target only allows ${maxItems}.`,
          ),
        ],
      ];
    }
    for (const item of source.values) {
      const [related, diagnostics] = isTypeAssignableToInternal(
        item,
        target.indexer.value!,
        diagnosticTarget,
        relationCache,
      );
      if (!related) {
        return [Related.false, diagnostics];
      }
    }
    return [Related.true, []];
  }

  function isTupleAssignableToTuple(
    source: Tuple | ArrayValue,
    target: Tuple,
    diagnosticTarget: Entity | Node,
    relationCache: MultiKeyMap<[Entity, Entity], Related>,
  ): [Related, readonly TypeRelationError[]] {
    if (source.values.length !== target.values.length) {
      return [
        Related.false,
        [
          createUnassignableDiagnostic(
            source,
            target,
            diagnosticTarget,
            `Source has ${source.values.length} element(s) but target requires ${target.values.length}.`,
          ),
        ],
      ];
    }
    for (const [index, sourceItem] of source.values.entries()) {
      const targetItem = target.values[index];
      const [related, diagnostics] = isTypeAssignableToInternal(
        sourceItem,
        targetItem,
        diagnosticTarget,
        relationCache,
      );
      if (!related) {
        return [Related.false, diagnostics];
      }
    }
    return [Related.true, []];
  }

  function isAssignableToUnion(
    source: Type,
    target: Union,
    diagnosticTarget: Entity | Node,
    relationCache: MultiKeyMap<[Entity, Entity], Related>,
  ): [Related, TypeRelationError[]] {
    if (source.kind === "UnionVariant" && source.union === target) {
      return [Related.true, []];
    }
    for (const option of target.variants.values()) {
      const [related] = isTypeAssignableToInternal(
        source,
        option.type,
        diagnosticTarget,
        relationCache,
      );
      if (related) {
        return [Related.true, []];
      }
    }
    return [Related.false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
  }

  function isAssignableToEnum(
    source: Type,
    target: Enum,
    diagnosticTarget: Entity | Node,
  ): [Related, TypeRelationError[]] {
    switch (source.kind) {
      case "Enum":
        if (source === target) {
          return [Related.true, []];
        } else {
          return [Related.false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
        }
      case "EnumMember":
        if (source.enum === target) {
          return [Related.true, []];
        } else {
          return [Related.false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
        }
      default:
        return [Related.false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
    }
  }

  function isTypeSpecNamespace(
    namespace: Namespace,
  ): namespace is Namespace & { name: "TypeSpec"; namespace: Namespace } {
    return (
      namespace.name === "TypeSpec" &&
      (namespace.namespace === checker.getGlobalNamespaceType() ||
        namespace.namespace?.projectionBase === checker.getGlobalNamespaceType())
    );
  }
}

// #region Helpers
interface TypeRelationeErrorInit<C extends TypeRelationError["code"]> {
  code: C;
  diagnosticTarget: Entity | Node;
  format: DiagnosticReport<CompilerDiagnostics, C, "default">["format"];
  details?: string;
  skipIfFirst?: boolean;
}

function wrapUnassignableErrors(
  source: Entity,
  target: Entity,
  errors: readonly TypeRelationError[],
): readonly TypeRelationError[] {
  const error = createUnassignableDiagnostic(source, target, source);
  error.children = errors;
  return [error];
}
function wrapUnassignablePropertyErrors(
  source: ModelProperty,
  errors: readonly TypeRelationError[],
): readonly TypeRelationError[] {
  const error = createTypeRelationError({
    code: "property-unassignable",
    diagnosticTarget: source,
    format: {
      propName: source.name,
    },
    skipIfFirst: true,
  });
  error.children = errors;
  return [error];
}
function createTypeRelationError<const C extends TypeRelationError["code"]>({
  code,
  format,
  details,
  diagnosticTarget,
  skipIfFirst,
}: TypeRelationeErrorInit<C>): TypeRelationError {
  const diag = createDiagnostic({
    code: code as any,
    format: format,
    target: NoTarget,
  });

  return {
    code: code,
    message: details ? `${diag.message}\n  ${details}` : diag.message,
    target: diagnosticTarget,
    skipIfFirst,
    children: [],
  };
}

function createUnassignableDiagnostic(
  source: Entity,
  target: Entity,
  diagnosticTarget: Entity | Node,
  details?: string,
): TypeRelationError {
  return createTypeRelationError({
    code: "unassignable",
    format: {
      sourceType: getEntityName(source),
      targetType: getEntityName(target),
    },
    diagnosticTarget,
    details,
  });
}
// #endregion
