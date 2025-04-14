import { Children } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Value } from "@typespec/compiler";

/**
 * Properties for the {@link ValueExpression} component.
 */
interface ValueExpressionProps {
  /**
   * The TypeSpec value to be converted to a TypeScript expression.
   */
  value: Value;
}

/**
 * Generates a TypeScript value expression from a TypeSpec value.
 * @param props properties for the value expression
 * @returns {@link Children} representing the JavaScript value expression
 */
export function ValueExpression(props: ValueExpressionProps): Children {
  switch (props.value.valueKind) {
    case "StringValue":
    case "BooleanValue":
    case "NullValue":
      return <ts.ValueExpression jsValue={props.value.value} />;
    case "NumericValue":
      // if its a bigint, we need to add the n suffix
      if (props.value.value.asNumber()) {
        return <ts.ValueExpression jsValue={props.value.value.asNumber()} />;
      }
      return <ts.ValueExpression jsValue={props.value.value.asBigInt()} />;
    case "ArrayValue":
      return (
        <ts.ArrayExpression
          jsValue={props.value.values.map((v) => ValueExpression({ value: v }))}
        />
      );
    case "ScalarValue":
      const { value } = props.value;

      if (props.value.value.name === "fromISO") {
        return ValueExpression({
          value: value.args[0],
        });
      } else {
        throw new Error("Unsupported scalar constructor: " + props.value.value.name);
      }
    case "ObjectValue":
      const jsProperties: Record<string, Children> = {};
      for (const [key, value] of props.value.properties) {
        jsProperties[key] = ValueExpression({ value: value.value });
      }
      return <ts.ObjectExpression jsValue={jsProperties} />;
    case "EnumValue":
      return <ts.ValueExpression jsValue={props.value.value.value ?? props.value.value.name} />;
  }
}
