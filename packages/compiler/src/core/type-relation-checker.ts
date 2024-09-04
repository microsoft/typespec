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
import { createDiagnostic } from "./messages.js";
import { numericRanges } from "./numeric-ranges.js";
import { Numeric } from "./numeric.js";
import { Program } from "./program.js";
import { isArrayModelType, isNeverType, isUnknownType, isValue, isVoidType } from "./type-utils.js";
import {
  ArrayModelType,
  ArrayValue,
  Diagnostic,
  DiagnosticTarget,
  Entity,
  Enum,
  IndeterminateEntity,
  MixedParameterConstraint,
  Model,
  ModelIndexer,
  ModelProperty,
  Namespace,
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

enum Related {
  false = 0,
  true = 1,
  maybe = 2,
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

export interface TypeRelation {
  isTypeAssignableTo(
    source: Entity | IndeterminateEntity,
    target: Entity,
    diagnosticTarget: DiagnosticTarget
  ): [boolean, readonly Diagnostic[]];

  isValueOfType(
    source: Value,
    target: Type,
    diagnosticTarget: DiagnosticTarget
  ): [boolean, readonly Diagnostic[]];

  isReflectionType(type: Type): type is Model & { name: ReflectionTypeName };

  areScalarsRelated(source: Scalar, target: Scalar): boolean;
}

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
    diagnosticTarget: DiagnosticTarget
  ): [boolean, readonly Diagnostic[]] {
    const [related, diagnostics] = isTypeAssignableToInternal(
      source,
      target,
      diagnosticTarget,
      new MultiKeyMap<[Entity, Entity], Related>()
    );
    return [related === Related.true, diagnostics];
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
    diagnosticTarget: DiagnosticTarget
  ): [boolean, readonly Diagnostic[]] {
    const [related, diagnostics] = isValueOfTypeInternal(
      source,
      target,
      diagnosticTarget,
      new MultiKeyMap<[Entity, Entity], Related>()
    );
    return [related === Related.true, diagnostics];
  }

  function isTypeAssignableToInternal(
    source: Entity | IndeterminateEntity,
    target: Entity,
    diagnosticTarget: DiagnosticTarget,
    relationCache: MultiKeyMap<[Entity | IndeterminateEntity, Entity], Related>
  ): [Related, readonly Diagnostic[]] {
    const cached = relationCache.get([source, target]);
    if (cached !== undefined) {
      return [cached, []];
    }
    const [result, diagnostics] = isTypeAssignableToWorker(
      source,
      target,
      diagnosticTarget,
      new MultiKeyMap<[Entity, Entity], Related>()
    );
    relationCache.set([source, target], result);
    return [result, diagnostics];
  }

  function isTypeAssignableToWorker(
    source: Entity | IndeterminateEntity,
    target: Entity,
    diagnosticTarget: DiagnosticTarget,
    relationCache: MultiKeyMap<[Entity, Entity], Related>
  ): [Related, readonly Diagnostic[]] {
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
        relationCache
      );
      if (assignable) {
        const constraint = getEntityName(source.constraint);
        reportDeprecated(
          program,
          `Template constrainted to '${constraint}' will not be assignable to '${getEntityName(
            target
          )}' in the future. Update the constraint to be 'valueof ${constraint}'`,
          diagnosticTarget
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
        relationCache
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
          relationCache
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
          createDiagnostic({
            code: "missing-index",
            format: {
              indexType: getTypeName(source.indexer.key),
              sourceType: getTypeName(target),
            },
            target: diagnosticTarget,
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
          relationCache
        );
      } else {
        // For other models just fallback to unassignable
        return [Related.false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
      }
    } else if (target.kind === "Model" && source.kind === "Model") {
      return isModelRelatedTo(source, target, diagnosticTarget, relationCache);
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
    diagnosticTarget: DiagnosticTarget,
    relationCache: MultiKeyMap<[Entity, Entity], Related>
  ): [Related, readonly Diagnostic[]] {
    const [typeRelated, typeDiagnostics] = isTypeAssignableToInternal(
      indeterminate.type,
      target,
      diagnosticTarget,
      relationCache
    );
    if (typeRelated) {
      return [Related.true, []];
    }

    if (target.entityKind === "MixedParameterConstraint" && target.valueType) {
      const [valueRelated] = isTypeAssignableToInternal(
        indeterminate.type,
        target.valueType,
        diagnosticTarget,
        relationCache
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
    diagnosticTarget: DiagnosticTarget,
    relationCache: MultiKeyMap<[Entity, Entity], Related>
  ): [Related, readonly Diagnostic[]] {
    if (!isValue(source)) {
      return [Related.false, [createUnassignableDiagnostic(source, target, diagnosticTarget)]];
    }

    return isValueOfTypeInternal(source, target, diagnosticTarget, relationCache);
  }

  function isAssignableToMixedParameterConstraint(
    source: Entity,
    target: MixedParameterConstraint,
    diagnosticTarget: DiagnosticTarget,
    relationCache: MultiKeyMap<[Entity, Entity], Related>
  ): [Related, readonly Diagnostic[]] {
    if ("entityKind" in source && source.entityKind === "MixedParameterConstraint") {
      if (source.type && target.type) {
        const [variantAssignable, diagnostics] = isTypeAssignableToInternal(
          source.type,
          target.type,
          diagnosticTarget,
          relationCache
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
          relationCache
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
        relationCache
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
        relationCache
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
    diagnosticTarget: DiagnosticTarget,
    relationCache: MultiKeyMap<[Entity, Entity], Related>
  ): [Related, readonly Diagnostic[]] {
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
        "Should not be possible to be derived from TypeSpec.numeric and not have a base when not in TypeSpec namespace."
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

  function isModelRelatedTo(
    source: Model,
    target: Model,
    diagnosticTarget: DiagnosticTarget,
    relationCache: MultiKeyMap<[Entity, Entity], Related>
  ): [Related, Diagnostic[]] {
    relationCache.set([source, target], Related.maybe);
    const diagnostics: Diagnostic[] = [];
    const remainingProperties = new Map(source.properties);

    for (const prop of walkPropertiesInherited(target)) {
      const sourceProperty = getProperty(source, prop.name);
      if (sourceProperty === undefined) {
        if (!prop.optional) {
          diagnostics.push(
            createDiagnostic({
              code: "missing-property",
              format: {
                propertyName: prop.name,
                sourceType: getTypeName(source),
                targetType: getTypeName(target),
              },
              target: source,
            })
          );
        }
      } else {
        remainingProperties.delete(prop.name);

        if (sourceProperty.optional && !prop.optional) {
          diagnostics.push(
            createDiagnostic({
              code: "property-required",
              format: {
                propName: prop.name,
                targetType: getTypeName(target),
              },
              target: diagnosticTarget,
            })
          );
        }
        const [related, propDiagnostics] = isTypeAssignableToInternal(
          sourceProperty.type,
          prop.type,
          diagnosticTarget,
          relationCache
        );
        if (!related) {
          diagnostics.push(...propDiagnostics);
        }
      }
    }

    if (target.indexer) {
      const [_, indexerDiagnostics] = arePropertiesAssignableToIndexer(
        remainingProperties,
        target.indexer.value,
        diagnosticTarget,
        relationCache
      );
      diagnostics.push(...indexerDiagnostics);

      // For anonymous models we don't need an indexer
      if (source.name !== "" && target.indexer.key.name !== "integer") {
        const [related, indexDiagnostics] = hasIndexAndIsAssignableTo(
          source,
          target as any,
          diagnosticTarget,
          relationCache
        );
        if (!related) {
          diagnostics.push(...indexDiagnostics);
        }
      }
    } else if (shouldCheckExcessProperties(source)) {
      for (const [propName, prop] of remainingProperties) {
        if (shouldCheckExcessProperty(prop)) {
          diagnostics.push(
            createDiagnostic({
              code: "unexpected-property",
              format: {
                propertyName: propName,
                type: getEntityName(target),
              },
              target: prop,
            })
          );
        }
      }
    }

    return [diagnostics.length === 0 ? Related.true : Related.false, diagnostics];
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
    diagnosticTarget: DiagnosticTarget,
    relationCache: MultiKeyMap<[Type, Type], Related>
  ): [Related, readonly Diagnostic[]] {
    for (const prop of properties.values()) {
      const [related, diagnostics] = isTypeAssignableToInternal(
        prop.type,
        indexerConstaint,
        diagnosticTarget,
        relationCache
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
    diagnosticTarget: DiagnosticTarget,
    relationCache: MultiKeyMap<[Entity, Entity], Related>
  ): [Related, readonly Diagnostic[]] {
    if (source.indexer === undefined || source.indexer.key !== target.indexer.key) {
      return [
        Related.false,
        [
          createDiagnostic({
            code: "missing-index",
            format: {
              indexType: getTypeName(target.indexer.key),
              sourceType: getTypeName(source),
            },
            target: diagnosticTarget,
          }),
        ],
      ];
    }
    return isTypeAssignableToInternal(
      source.indexer.value!,
      target.indexer.value,
      diagnosticTarget,
      relationCache
    );
  }

  function isTupleAssignableToArray(
    source: Tuple,
    target: ArrayModelType,
    diagnosticTarget: DiagnosticTarget,
    relationCache: MultiKeyMap<[Entity, Entity], Related>
  ): [Related, readonly Diagnostic[]] {
    const minItems = getMinItems(program, target);
    const maxItems = getMaxItems(program, target);
    if (minItems !== undefined && source.values.length < minItems) {
      return [
        Related.false,
        [
          createDiagnostic({
            code: "unassignable",
            messageId: "withDetails",
            format: {
              sourceType: getEntityName(source),
              targetType: getTypeName(target),
              details: `Source has ${source.values.length} element(s) but target requires ${minItems}.`,
            },
            target: diagnosticTarget,
          }),
        ],
      ];
    }
    if (maxItems !== undefined && source.values.length > maxItems) {
      return [
        Related.false,
        [
          createDiagnostic({
            code: "unassignable",
            messageId: "withDetails",
            format: {
              sourceType: getEntityName(source),
              targetType: getTypeName(target),
              details: `Source has ${source.values.length} element(s) but target only allows ${maxItems}.`,
            },
            target: diagnosticTarget,
          }),
        ],
      ];
    }
    for (const item of source.values) {
      const [related, diagnostics] = isTypeAssignableToInternal(
        item,
        target.indexer.value!,
        diagnosticTarget,
        relationCache
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
    diagnosticTarget: DiagnosticTarget,
    relationCache: MultiKeyMap<[Entity, Entity], Related>
  ): [Related, readonly Diagnostic[]] {
    if (source.values.length !== target.values.length) {
      return [
        Related.false,
        [
          createDiagnostic({
            code: "unassignable",
            messageId: "withDetails",
            format: {
              sourceType: getEntityName(source),
              targetType: getTypeName(target),
              details: `Source has ${source.values.length} element(s) but target requires ${target.values.length}.`,
            },
            target: diagnosticTarget,
          }),
        ],
      ];
    }
    for (const [index, sourceItem] of source.values.entries()) {
      const targetItem = target.values[index];
      const [related, diagnostics] = isTypeAssignableToInternal(
        sourceItem,
        targetItem,
        diagnosticTarget,
        relationCache
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
    diagnosticTarget: DiagnosticTarget,
    relationCache: MultiKeyMap<[Entity, Entity], Related>
  ): [Related, Diagnostic[]] {
    if (source.kind === "UnionVariant" && source.union === target) {
      return [Related.true, []];
    }
    for (const option of target.variants.values()) {
      const [related] = isTypeAssignableToInternal(
        source,
        option.type,
        diagnosticTarget,
        relationCache
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
    diagnosticTarget: DiagnosticTarget
  ): [Related, Diagnostic[]] {
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

  function createUnassignableDiagnostic(
    source: Entity,
    target: Entity,
    diagnosticTarget: DiagnosticTarget
  ) {
    return createDiagnostic({
      code: "unassignable",
      format: { targetType: getEntityName(target), value: getEntityName(source) },
      target: diagnosticTarget,
    });
  }
  function isTypeSpecNamespace(
    namespace: Namespace
  ): namespace is Namespace & { name: "TypeSpec"; namespace: Namespace } {
    return (
      namespace.name === "TypeSpec" &&
      (namespace.namespace === checker.getGlobalNamespaceType() ||
        namespace.namespace?.projectionBase === checker.getGlobalNamespaceType())
    );
  }
}
