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
    case "NumericValue":
      return ts.ValueExpression({ jsValue: props.value.value.asNumber() });
    case "StringValue":
    case "BooleanValue":
    case "NullValue":
      return ts.ValueExpression({ jsValue: props.value.value });
    case "ArrayValue":
      return ts.ArrayExpression({
        jsValue: props.value.values,
      });
    case "ScalarValue":
      console.log("ScalarValue", props.value);
      const { value } = props.value;

      if (props.value.value.name === "fromISO") {
        console.log("fromISO", props.value.value.args[0]);
        return ts.ValueExpression({
          jsValue: value.args[0],
        });
        // return ValueExpression({
        //   value: props.value.value.args[0],
        // });
      } else {
        throw new Error("Unsupported scalar constructor: " + props.value.value.name);
      }
    case "ObjectValue":
      return ts.ValueExpression({ jsValue: props.value.properties });
    case "EnumValue":
      return ts.ValueExpression({ jsValue: props.value.value.value ?? props.value.value.name });
  }
}
