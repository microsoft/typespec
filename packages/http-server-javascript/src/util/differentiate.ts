// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import {
  BooleanLiteral,
  EnumMember,
  Model,
  ModelProperty,
  NumericLiteral,
  Scalar,
  StringLiteral,
  Type,
  Union,
  getDiscriminator,
  getMaxValue,
  getMinValue,
} from "@typespec/compiler";
import { getJsScalar } from "../common/scalar.js";
import { JsContext } from "../ctx.js";
import { reportDiagnostic } from "../lib.js";
import { parseCase } from "./case.js";
import { UnimplementedError, UnreachableError } from "./error.js";
import { getAllProperties } from "./extends.js";
import { categorize, indent } from "./iter.js";

/**
 * A tree structure representing a body of TypeScript code.
 */
export type CodeTree = Result | IfChain | Switch | Verbatim;

export type JsLiteralType = StringLiteral | BooleanLiteral | NumericLiteral | EnumMember;

/**
 * A TypeSpec type that is precise, i.e. the type of a single value.
 */
export type PreciseType = Scalar | Model | JsLiteralType;

/**
 * Determines if `t` is a precise type.
 * @param t - the type to test
 * @returns true if `t` is precise, false otherwise.
 */
export function isPreciseType(t: Type): t is PreciseType {
  return (
    t.kind === "Scalar" ||
    t.kind === "Model" ||
    t.kind === "Boolean" ||
    t.kind === "Number" ||
    t.kind === "String"
  );
}

/**
 * An if-chain structure in the CodeTree DSL. This represents a cascading series of if-else-if statements with an optional
 * final `else` branch.
 */
export interface IfChain {
  kind: "if-chain";
  branches: IfBranch[];
  else?: CodeTree;
}

/**
 * A branch in an if-chain.
 */
export interface IfBranch {
  /**
   * A condition to test for this branch.
   */
  condition: Expression;
  /**
   * The body of this branch, to be executed if the condition is true.
   */
  body: CodeTree;
}

/**
 * A node in the code tree indicating that a precise type has been determined.
 */
export interface Result {
  kind: "result";
  type: PreciseType;
}

/**
 * A switch structure in the CodeTree DSL.
 */
export interface Switch {
  kind: "switch";
  /**
   * The expression to switch on.
   */
  condition: Expression;
  /**
   * The cases to test for.
   */
  cases: SwitchCase[];
  /**
   * The default case, if any.
   */
  default?: CodeTree;
}

/**
 * A verbatim code block.
 */
export interface Verbatim {
  kind: "verbatim";
  body: Iterable<string>;
}

/**
 * A case in a switch statement.
 */
export interface SwitchCase {
  /**
   * The value to test for in this case.
   */
  value: Expression;
  /**
   * The body of this case.
   */
  body: CodeTree;
}

/**
 * An expression in the CodeTree DSL.
 */
export type Expression =
  | BinaryOp
  | UnaryOp
  | TypeOf
  | Literal
  | VerbatimExpression
  | SubjectReference
  | ModelPropertyReference
  | InRange;

/**
 * A binary operation.
 */
export interface BinaryOp {
  kind: "binary-op";
  /**
   * The operator to apply. This operation may be sensitive to the order of the left and right expressions.
   */
  operator:
    | "==="
    | "!=="
    | "<"
    | "<="
    | ">"
    | ">="
    | "+"
    | "-"
    | "*"
    | "/"
    | "%"
    | "&&"
    | "||"
    | "instanceof"
    | "in";
  /**
   * The left-hand-side operand.
   */
  left: Expression;
  /**
   * The right-hand-side operand.
   */
  right: Expression;
}

/**
 * A unary operation.
 */
export interface UnaryOp {
  kind: "unary-op";
  /**
   * The operator to apply.
   */
  operator: "!" | "-";
  /**
   * The operand to apply the operator to.
   */
  operand: Expression;
}

/**
 * A type-of operation.
 */
export interface TypeOf {
  kind: "typeof";
  /**
   * The operand to apply the `typeof` operator to.
   */
  operand: Expression;
}

/**
 * A literal JavaScript value. The value will be converted to the text of an expression that will yield the same value.
 */
export interface Literal {
  kind: "literal";
  /**
   * The value of the literal.
   */
  value: LiteralValue;
}

/**
 * A verbatim expression, written as-is with no modification.
 */
export interface VerbatimExpression {
  kind: "verbatim";
  /**
   * The exact text of the expression.
   */
  text: string;
}

/**
 * A reference to the "subject" of the code tree.
 *
 * The "subject" is a special expression denoting an input value.
 */
export interface SubjectReference {
  kind: "subject";
}

/**
 * A reference to a model property. Model property references are rendered by the `referenceModelProperty` function in the
 * options given to `writeCodeTree`, allowing the caller to define how model properties are stored.
 */
export interface ModelPropertyReference {
  kind: "model-property";
  property: ModelProperty;
}

/**
 * A check to see if a value is in an integer range.
 */
export interface InRange {
  kind: "in-range";
  /**
   * The expression to check.
   */
  expr: Expression;
  /**
   * The range to check against.
   */
  range: IntegerRange;
}

/**
 * A literal value that can be used in a JavaScript expression.
 */
export type LiteralValue = string | number | boolean | bigint;

function isLiteralValueType(type: Type): type is JsLiteralType {
  return (
    type.kind === "Boolean" ||
    type.kind === "Number" ||
    type.kind === "String" ||
    type.kind === "EnumMember"
  );
}

const PROPERTY_ID = (prop: ModelProperty) => parseCase(prop.name).camelCase;

/**
 * Differentiates the variants of a union type. This function returns a CodeTree that will test an input "subject" and
 * determine which of the cases it matches.
 *
 * Compared to `differentiateTypes`, this function is specialized for union types, and will consider union
 * discriminators first, then delegate to `differentiateTypes` for the remaining cases.
 *
 * @param ctx
 * @param type
 */
export function differentiateUnion(
  ctx: JsContext,
  union: Union,
  renderPropertyName: (prop: ModelProperty) => string = PROPERTY_ID,
): CodeTree {
  const discriminator = getDiscriminator(ctx.program, union)?.propertyName;
  const variants = [...union.variants.values()];

  if (!discriminator) {
    const cases = new Set<PreciseType>();

    for (const variant of variants) {
      if (!isPreciseType(variant.type)) {
        reportDiagnostic(ctx.program, {
          code: "undifferentiable-union-variant",
          target: variant,
        });
      } else {
        cases.add(variant.type);
      }
    }

    return differentiateTypes(ctx, cases, PROPERTY_ID);
  } else {
    const property = (variants[0].type as Model).properties.get(discriminator)!;

    return {
      kind: "switch",
      condition: {
        kind: "model-property",
        property,
      },
      cases: variants.map((v) => {
        const discriminatorPropertyType = (v.type as Model).properties.get(discriminator)!.type as
          | JsLiteralType
          | EnumMember;

        return {
          value: { kind: "literal", value: getJsValue(ctx, discriminatorPropertyType) },
          body: { kind: "result", type: v.type },
        } as SwitchCase;
      }),
      default: {
        kind: "verbatim",
        body: [
          'throw new Error("Unreachable: discriminator did not match any known value or was not present.");',
        ],
      },
    };
  }
}

/**
 * Differentiates a set of input types. This function returns a CodeTree that will test an input "subject" and determine
 * which of the cases it matches, executing the corresponding code block.
 *
 * @param ctx - The emitter context.
 * @param cases - A map of cases to differentiate to their respective code blocks.
 * @returns a CodeTree to use with `writeCodeTree`
 */
export function differentiateTypes(
  ctx: JsContext,
  cases: Set<PreciseType>,
  renderPropertyName: (prop: ModelProperty) => string = PROPERTY_ID,
): CodeTree {
  if (cases.size === 0) {
    return {
      kind: "verbatim",
      body: [
        'throw new Error("Unreachable: encountered a value in differentiation where no variants exist.");',
      ],
    };
  }

  const categories = categorize(cases.keys(), (type) => type.kind);

  const literals = [
    ...(categories.Boolean ?? []),
    ...(categories.Number ?? []),
    ...(categories.String ?? []),
  ] as JsLiteralType[];
  const models = (categories.Model as Model[]) ?? [];
  const scalars = (categories.Scalar as Scalar[]) ?? [];

  if (literals.length + scalars.length === 0) {
    return differentiateModelTypes(ctx, select(models, cases));
  } else {
    const branches: IfBranch[] = [];
    for (const literal of literals) {
      branches.push({
        condition: {
          kind: "binary-op",
          operator: "===",
          left: { kind: "subject" },
          right: { kind: "literal", value: getJsValue(ctx, literal) },
        },
        body: {
          kind: "result",
          type: literal,
        },
      });
    }

    const scalarRepresentations = new Map<string, Scalar>();

    for (const scalar of scalars) {
      const jsScalar = getJsScalar(ctx.program, scalar, scalar);

      if (scalarRepresentations.has(jsScalar)) {
        reportDiagnostic(ctx.program, {
          code: "undifferentiable-scalar",
          target: scalar,
          format: {
            competitor: scalarRepresentations.get(jsScalar)!.name,
          },
        });
        continue;
      }

      let test: Expression;

      switch (jsScalar) {
        case "Uint8Array":
          test = {
            kind: "binary-op",
            operator: "instanceof",
            left: { kind: "subject" },
            right: { kind: "verbatim", text: "Uint8Array" },
          };
          break;
        case "number":
          test = {
            kind: "binary-op",
            operator: "===",
            left: { kind: "typeof", operand: { kind: "subject" } },
            right: { kind: "literal", value: "number" },
          };
          break;
        case "bigint":
          test = {
            kind: "binary-op",
            operator: "===",
            left: { kind: "typeof", operand: { kind: "subject" } },
            right: { kind: "literal", value: "bigint" },
          };
          break;
        case "string":
          test = {
            kind: "binary-op",
            operator: "===",
            left: { kind: "typeof", operand: { kind: "subject" } },
            right: { kind: "literal", value: "string" },
          };
          break;
        case "boolean":
          test = {
            kind: "binary-op",
            operator: "===",
            left: { kind: "typeof", operand: { kind: "subject" } },
            right: { kind: "literal", value: "boolean" },
          };
          break;
        case "Date":
          test = {
            kind: "binary-op",
            operator: "instanceof",
            left: { kind: "subject" },
            right: { kind: "verbatim", text: "Date" },
          };
          break;
        default:
          throw new UnimplementedError(
            `scalar differentiation for unknown JS Scalar '${jsScalar}'.`,
          );
      }

      branches.push({
        condition: test,
        body: {
          kind: "result",
          type: scalar,
        },
      });
    }

    return {
      kind: "if-chain",
      branches,
      else: models.length > 0 ? differentiateModelTypes(ctx, select(models, cases)) : undefined,
    };
  }

  /**
   * Select a subset of keys from a map.
   *
   * @param keys - The keys to select.
   * @param map - The map to select from.
   * @returns a map containing only those keys of the original map that were also in the `keys` iterable.
   */
  function select<V1, V2 extends V1>(keys: Iterable<V2>, set: Set<V1>): Set<V2> {
    const result = new Set<V2>();
    for (const key of keys) {
      if (set.has(key)) result.add(key);
    }
    return result;
  }
}

/**
 * Gets a JavaScript literal value for a given LiteralType.
 */
function getJsValue(ctx: JsContext, literal: JsLiteralType | EnumMember): LiteralValue {
  switch (literal.kind) {
    case "Boolean":
      return literal.value;
    case "Number": {
      const asNumber = literal.numericValue.asNumber();

      if (asNumber) return asNumber;

      const asBigInt = literal.numericValue.asBigInt();

      if (asBigInt) return asBigInt;

      reportDiagnostic(ctx.program, {
        code: "unrepresentable-numeric-constant",
        target: literal,
      });
      return 0;
    }
    case "String":
      return literal.value;
    case "EnumMember":
      return literal.value ?? literal.name;
    default:
      throw new UnreachableError(
        "getJsValue for " + (literal satisfies never as JsLiteralType).kind,
        { literal },
      );
  }
}

/**
 * An integer range, inclusive.
 */
type IntegerRange = [number, number];

function getIntegerRange(ctx: JsContext, property: ModelProperty): IntegerRange | false {
  if (
    property.type.kind === "Scalar" &&
    getJsScalar(ctx.program, property.type, property) === "number"
  ) {
    const minValue = getMinValue(ctx.program, property);
    const maxValue = getMaxValue(ctx.program, property);

    if (minValue !== undefined && maxValue !== undefined) {
      return [minValue, maxValue];
    }
  }

  return false;
}

function overlaps(range: IntegerRange, other: IntegerRange): boolean {
  return range[0] <= other[1] && range[1] >= other[0];
}

/**
 * Differentiate a set of model types based on their properties. This function returns a CodeTree that will test an input
 * "subject" and determine which of the cases it matches, executing the corresponding code block.
 *
 * @param ctx - The emitter context.
 * @param models - A map of models to differentiate to their respective code blocks.
 * @param renderPropertyName - A function that converts a model property reference over the subject to a string.
 * @returns a CodeTree to use with `writeCodeTree`
 */
export function differentiateModelTypes(
  ctx: JsContext,
  models: Set<Model>,
  renderPropertyName: (prop: ModelProperty) => string = PROPERTY_ID,
): CodeTree {
  // Horrible n^2 operation to get the unique properties of all models in the map, but hopefully n is small, so it should
  // be okay until you have a lot of models to differentiate.

  type PropertyName = string;
  type RenderedPropertyName = string & { __brand: "RenderedPropertyName" };

  const uniqueProps = new Map<Model, Set<PropertyName>>();

  // Map of property names to maps of literal values that identify a model.
  const propertyLiterals = new Map<RenderedPropertyName, Map<LiteralValue, Model>>();
  // Map of models to properties with values that can uniquely identify it
  const uniqueLiterals = new Map<Model, Set<RenderedPropertyName>>();

  const propertyRanges = new Map<RenderedPropertyName, Map<IntegerRange, Model>>();
  const uniqueRanges = new Map<Model, Set<RenderedPropertyName>>();

  for (const model of models) {
    const props = new Set<string>();

    for (const prop of getAllProperties(model)) {
      // Don't consider optional properties for differentiation.
      if (prop.optional) continue;

      const renderedPropName = renderPropertyName(prop) as RenderedPropertyName;

      // CASE - literal value

      if (isLiteralValueType(prop.type)) {
        let literals = propertyLiterals.get(renderedPropName);
        if (!literals) {
          literals = new Map();
          propertyLiterals.set(renderedPropName, literals);
        }

        const value = getJsValue(ctx, prop.type);

        const other = literals.get(value);

        if (other) {
          // Literal already used. Leave the literal in the propertyLiterals map to prevent future collisions,
          // but remove the model from the uniqueLiterals map.
          uniqueLiterals.get(other)?.delete(renderedPropName);
        } else {
          // Literal is available. Add the model to the uniqueLiterals map and set this value.
          literals.set(value, model);
          let modelsUniqueLiterals = uniqueLiterals.get(model);
          if (!modelsUniqueLiterals) {
            modelsUniqueLiterals = new Set();
            uniqueLiterals.set(model, modelsUniqueLiterals);
          }
          modelsUniqueLiterals.add(renderedPropName);
        }
      }

      // CASE - unique range

      const range = getIntegerRange(ctx, prop);
      if (range) {
        let ranges = propertyRanges.get(renderedPropName);
        if (!ranges) {
          ranges = new Map();
          propertyRanges.set(renderedPropName, ranges);
        }

        const overlappingRanges = [...ranges.entries()].filter(([r]) => overlaps(r, range));

        if (overlappingRanges.length > 0) {
          // Overlapping range found. Remove the model from the uniqueRanges map.
          for (const [, other] of overlappingRanges) {
            uniqueRanges.get(other)?.delete(renderedPropName);
          }
        } else {
          // No overlapping range found. Add the model to the uniqueRanges map and set this range.
          ranges.set(range, model);
          let modelsUniqueRanges = uniqueRanges.get(model);
          if (!modelsUniqueRanges) {
            modelsUniqueRanges = new Set();
            uniqueRanges.set(model, modelsUniqueRanges);
          }
          modelsUniqueRanges.add(renderedPropName);
        }
      }

      // CASE - unique property

      let valid = true;
      for (const [, other] of uniqueProps) {
        if (
          other.has(prop.name) ||
          (isLiteralValueType(prop.type) &&
            propertyLiterals
              .get(renderedPropName)
              ?.has(getJsValue(ctx, prop.type as JsLiteralType)))
        ) {
          valid = false;
          other.delete(prop.name);
        }
      }

      if (valid) {
        props.add(prop.name);
      }
    }

    uniqueProps.set(model, props);
  }

  const branches: IfBranch[] = [];

  let defaultCase: Model | undefined = undefined;

  for (const [model, unique] of uniqueProps) {
    const literals = uniqueLiterals.get(model);
    const ranges = uniqueRanges.get(model);
    if (unique.size === 0 && (!literals || literals.size === 0) && (!ranges || ranges.size === 0)) {
      if (defaultCase) {
        reportDiagnostic(ctx.program, {
          code: "undifferentiable-model",
          target: model,
        });
        return {
          kind: "result",
          type: defaultCase,
        };
      } else {
        // Allow a single default case. This covers more APIs that have a single model that is not differentiated by a
        // unique property, in which case we can make it the `else` case.
        defaultCase = model;
        continue;
      }
    }

    if (literals && literals.size > 0) {
      // A literal property value exists that can differentiate this model.
      const firstUniqueLiteral = literals.values().next().value as RenderedPropertyName;

      const property = [...model.properties.values()].find(
        (p) => (renderPropertyName(p) as RenderedPropertyName) === firstUniqueLiteral,
      )!;

      branches.push({
        condition: {
          kind: "binary-op",
          left: { kind: "model-property", property },
          operator: "===",
          right: {
            kind: "literal",
            value: getJsValue(ctx, property.type as JsLiteralType),
          },
        },
        body: { kind: "result", type: model },
      });
    } else if (ranges && ranges.size > 0) {
      // A range property value exists that can differentiate this model.
      const firstUniqueRange = ranges.values().next().value as RenderedPropertyName;

      const property = [...model.properties.values()].find(
        (p) => renderPropertyName(p) === firstUniqueRange,
      )!;

      const range = [...propertyRanges.get(firstUniqueRange)!.entries()].find(
        ([range, candidate]) => candidate === model,
      )![0];

      branches.push({
        condition: {
          kind: "in-range",
          expr: { kind: "model-property", property },
          range,
        },
        body: { kind: "result", type: model },
      });
    } else {
      const firstUniqueProp = unique.values().next().value as PropertyName;

      branches.push({
        condition: {
          kind: "binary-op",
          left: { kind: "literal", value: firstUniqueProp },
          operator: "in",
          right: { kind: "subject" },
        },
        body: { kind: "result", type: model },
      });
    }
  }

  return {
    kind: "if-chain",
    branches,
    else: defaultCase
      ? {
          kind: "result",
          type: defaultCase,
        }
      : undefined,
  };
}

/**
 * Options for the `writeCodeTree` function.
 */
export interface CodeTreeOptions {
  /**
   * The subject expression to use in the code tree.
   *
   * This text is used whenever a `SubjectReference` is encountered in the code tree, allowing the caller to specify
   * how the subject is stored and referenced.
   */
  subject: string;

  /**
   * A function that converts a model property to a string reference.
   *
   * This function is used whenever a `ModelPropertyReference` is encountered in the code tree, allowing the caller to
   * specify how model properties are stored and referenced.
   */
  referenceModelProperty: (p: ModelProperty) => string;

  /**
   * Renders a result when encountered in the code tree.
   */
  renderResult: (type: Type) => Iterable<string>;
}

/**
 * Writes a code tree to text, given a set of options.
 *
 * @param ctx - The emitter context.
 * @param tree - The code tree to write.
 * @param options - The options to use when writing the code tree.
 */
export function* writeCodeTree(
  ctx: JsContext,
  tree: CodeTree,
  options: CodeTreeOptions,
): Iterable<string> {
  switch (tree.kind) {
    case "result":
      yield* options.renderResult(tree.type);
      break;
    case "if-chain": {
      let first = true;
      for (const branch of tree.branches) {
        const condition = writeExpression(ctx, branch.condition, options);
        if (first) {
          first = false;
          yield `if (${condition}) {`;
        } else {
          yield `} else if (${condition}) {`;
        }
        yield* indent(writeCodeTree(ctx, branch.body, options));
      }
      if (tree.else) {
        yield "} else {";
        yield* indent(writeCodeTree(ctx, tree.else, options));
      }
      yield "}";
      break;
    }
    case "switch": {
      yield `switch (${writeExpression(ctx, tree.condition, options)}) {`;
      for (const _case of tree.cases) {
        yield `  case ${writeExpression(ctx, _case.value, options)}: {`;
        yield* indent(indent(writeCodeTree(ctx, _case.body, options)));
        yield "  }";
      }
      if (tree.default) {
        yield "  default: {";
        yield* indent(indent(writeCodeTree(ctx, tree.default, options)));
        yield "  }";
      }
      yield "}";
      break;
    }
    case "verbatim":
      yield* tree.body;
      break;
    default:
      throw new UnreachableError("writeCodeTree for " + (tree satisfies never as CodeTree).kind, {
        tree,
      });
  }
}

function writeExpression(ctx: JsContext, expression: Expression, options: CodeTreeOptions): string {
  switch (expression.kind) {
    case "binary-op":
      return `(${writeExpression(ctx, expression.left, options)}) ${expression.operator} (${writeExpression(
        ctx,
        expression.right,
        options,
      )})`;
    case "unary-op":
      return `${expression.operator}(${writeExpression(ctx, expression.operand, options)})`;
    case "typeof":
      return `typeof (${writeExpression(ctx, expression.operand, options)})`;
    case "literal":
      switch (typeof expression.value) {
        case "string":
          return JSON.stringify(expression.value);
        case "number":
        case "bigint":
          return String(expression.value);
        case "boolean":
          return expression.value ? "true" : "false";
        default:
          throw new UnreachableError(
            `writeExpression for literal value type '${typeof expression.value}'`,
          );
      }
    case "in-range": {
      const {
        expr,
        range: [min, max],
      } = expression;
      const exprText = writeExpression(ctx, expr, options);

      return `(${exprText} >= ${min} && ${exprText} <= ${max})`;
    }
    case "verbatim":
      return expression.text;
    case "subject":
      return options.subject;
    case "model-property":
      return options.referenceModelProperty(expression.property);
    default:
      throw new UnreachableError(
        "writeExpression for " + (expression satisfies never as Expression).kind,
        {
          expression,
        },
      );
  }
}
