import { useTsp } from "#core/context/index.js";
import { code, List, type Children } from "@alloy-js/core";
import type { Type } from "@typespec/compiler";
import { typingModule } from "../../builtins.js";
import { efRefkey } from "../../utils/refkey.js";
import { TypeExpression } from "./type-expression.js";

export interface LiteralTypeExpressionProps {
  type: Type;
}

/**
 * Renders a type as a Python `Literal[...]` expression when applicable.
 *
 * Handles:
 * - Single union variant from a named union → `Literal[Union.MEMBER]`
 * - Unions of literals (string/number/boolean) → `Literal["a", "b", 1, True]`
 * - Unions with variant refs → `Literal["a", Color.RED]`
 *
 * Falls back to regular TypeExpression for non-literal types.
 *
 * @example
 * ```tsx
 * <LiteralTypeExpression type={unionVariantType} />
 * // Renders: Literal[Color.RED]
 *
 * <LiteralTypeExpression type={literalUnionType} />
 * // Renders: Literal["a", "b", 1]
 * ```
 */
export function LiteralTypeExpression(props: LiteralTypeExpressionProps): Children {
  const { $ } = useTsp();
  const type = props.type;

  switch (type.kind) {
    case "UnionVariant": {
      // Union variant from a named union → Literal[Union.MEMBER]
      if (type.union && (type.union as any).name) {
        const variantValue = type.type;
        const enumMemberName =
          variantValue && typeof (variantValue as any).value === "string"
            ? (variantValue as any).value
            : String((variantValue as any)?.value ?? "");
        return (
          <>
            {typingModule["."]["Literal"]}[{efRefkey(type.union)}.{enumMemberName}]
          </>
        );
      }
      // Unnamed union variant, unwrap to its inner type
      return <LiteralTypeExpression type={type.type} />;
    }

    case "Union": {
      const variants = Array.from((type as any).variants?.values?.() ?? []);

      // Check if all variants are literals or named union variant refs
      const isLiteralOrVariantRef = (t: any) => {
        if (!t) return false;
        if ($.literal.isString(t) || $.literal.isNumeric(t) || $.literal.isBoolean(t)) return true;
        if (t.kind === "UnionVariant" && t.union?.name) return true;
        return false;
      };

      const innerTypes = variants.map((v: any) => v.type);
      if (innerTypes.every(isLiteralOrVariantRef)) {
        const literalValues = variants
          .map((v: any) => {
            const innerType = v.type;
            // Named union variant ref → Union.MEMBER
            if (innerType.kind === "UnionVariant" && innerType.union?.name) {
              const variantValue = innerType.type;
              const enumMemberName =
                variantValue && typeof variantValue.value === "string"
                  ? variantValue.value
                  : String(variantValue?.value ?? "");
              return code`${efRefkey(innerType.union)}.${enumMemberName}`;
            }
            // String literal → "value"
            if ($.literal.isString(innerType)) {
              return JSON.stringify(innerType.value);
            }
            // Numeric literal → 42
            if ($.literal.isNumeric(innerType)) {
              return String(innerType.value);
            }
            // Boolean literal → True/False
            if ($.literal.isBoolean(innerType)) {
              return innerType.value ? "True" : "False";
            }
            return undefined;
          })
          .filter(Boolean);

        return (
          <>
            {typingModule["."]["Literal"]}[<List children={literalValues} joiner=", " />]
          </>
        );
      }

      // Not all literals, fall back to regular TypeExpression
      return <TypeExpression type={type} />;
    }

    default:
      // Not a literal type, fall back to regular TypeExpression
      return <TypeExpression type={type} />;
  }
}
