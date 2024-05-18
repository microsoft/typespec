import { LiteralType, Model, ModelProperty, Scalar, Type } from "@typespec/compiler";
import { getJsScalar } from "../common/scalar.js";
import { JsContext } from "../ctx.js";
import { reportDiagnostic } from "../lib.js";
import { categorize } from "./bifilter.js";
import { parseCase } from "./case.js";
import { UnimplementedError } from "./error.js";
import { indent } from "./indent.js";

/**
 * A tree structure representing a body of TypeScript code.
 */
export type CodeTree = Verbatim | IfChain;

/**
 * A TypeSpec type that is precise, i.e. the type of a single value.
 */
export type PreciseType = Scalar | Model | LiteralType;

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
 * A verbatim code block, written as-is with no modification.
 */
export interface Verbatim {
  kind: "verbatim";
  text: Iterable<string>;
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
  | ModelPropertyReference;

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
 * A literal value that can be used in a JavaScript expression.
 */
export type LiteralValue = string | number | boolean | bigint;

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
  cases: Map<PreciseType, Iterable<string>>
): CodeTree {
  const categories = categorize(cases.keys(), (type) => type.kind);

  const literals = [
    ...(categories.Boolean ?? []),
    ...(categories.Number ?? []),
    ...(categories.String ?? []),
  ] as LiteralType[];
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
          kind: "verbatim",
          text: cases.get(literal) ?? [],
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
          throw new UnimplementedError("scalar differentiation for type " + jsScalar);
      }

      branches.push({
        condition: test,
        body: {
          kind: "verbatim",
          text: cases.get(scalar)!,
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
  function select<K, V>(keys: Iterable<K>, map: Map<unknown, V>): Map<K, V> {
    const result = new Map<K, V>();
    for (const key of keys) {
      if (map.has(key)) result.set(key, map.get(key)!);
    }
    return result;
  }
}

/**
 * Gets a JavaScript literal value for a given LiteralType.
 */
function getJsValue(ctx: JsContext, literal: LiteralType): LiteralValue {
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
  }
}

/**
 * Differentiate a set of model types based on their properties. This function returns a CodeTree that will test an input
 * "subject" and determine which of the cases it matches, executing the corresponding code block.
 *
 * @param ctx - The emitter context.
 * @param models - A map of models to differentiate to their respective code blocks.
 * @returns a CodeTree to use with `writeCodeTree`
 */
export function differentiateModelTypes(
  ctx: JsContext,
  models: Map<Model, Iterable<string>>
): CodeTree {
  // Horrible n^2 operation to get the unique properties of all models in the map, but hopefully n is small, so it should
  // be okay until you have a lot of models to differentiate.

  const allProps = new Set<string>();
  const uniqueProps = new Map<Model, Set<string>>();

  for (const [model] of models) {
    const props = new Set<string>();

    for (const [, prop] of model.properties) {
      // Don't consider optional properties for differentiation.
      if (prop.optional) continue;

      const propName = parseCase(prop.name).camelCase;

      let valid = true;
      for (const [, other] of uniqueProps) {
        if (other.has(prop.name)) {
          valid = false;
          other.delete(prop.name);
        }
      }

      if (valid) {
        allProps.add(propName);
        props.add(prop.name);
      }
    }

    uniqueProps.set(model, props);
  }

  const branches: IfBranch[] = [];

  let defaultCase: Model | undefined = undefined;

  for (const [model, unique] of uniqueProps) {
    if (unique.size === 0) {
      if (defaultCase) {
        reportDiagnostic(ctx.program, {
          code: "undifferentiable-model",
          target: model,
        });
        return {
          kind: "verbatim",
          text: [
            `throw new Error('Model '${model.name ?? "<anonymous>"}' does not have enough unique properties to be differentiated from other models in some contexts.');`,
          ],
        };
      } else {
        // Allow a single default case. This covers more APIs that have a single model that is not differentiated by a
        // unique property, in which case we can make it the `else` case.
        defaultCase = model;
        continue;
      }
    }

    const firstUniqueProp = unique.values().next().value as string;

    branches.push({
      condition: {
        kind: "binary-op",
        left: { kind: "literal", value: firstUniqueProp },
        operator: "in",
        right: { kind: "subject" },
      },
      body: { kind: "verbatim", text: models.get(model)! },
    });
  }

  return {
    kind: "if-chain",
    branches,
    else: defaultCase
      ? {
          kind: "verbatim",
          text: models.get(defaultCase)!,
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
  options: CodeTreeOptions
): Iterable<string> {
  switch (tree.kind) {
    case "verbatim":
      yield* tree.text;
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
  }
}

function writeExpression(ctx: JsContext, expression: Expression, options: CodeTreeOptions): string {
  switch (expression.kind) {
    case "binary-op":
      return `(${writeExpression(ctx, expression.left, options)}) ${expression.operator} (${writeExpression(
        ctx,
        expression.right,
        options
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
          return String(expression.value);
        case "bigint":
          return expression.value + "n";
        case "boolean":
          return expression.value ? "true" : "false";
        default:
          throw new Error(
            "UNREACHABLE: literal type not handled in writeExpression: " + typeof expression.value
          );
      }
    case "verbatim":
      return expression.text;
    case "subject":
      return options.subject;
    case "model-property":
      return options.referenceModelProperty(expression.property);
  }
}
