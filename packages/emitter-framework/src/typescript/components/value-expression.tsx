import { type Children } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { compilerAssert, type Value } from "@typespec/compiler";

/**
 * Properties for the {@link ValueExpression} component.
 */
interface ValueExpressionProps {
  /**
   * The TypeSpec value to be converted to a JavaScript expression.
   */
  value: Value;
}

/**
 * Generates a JavaScript value expression from a TypeSpec value.
 * @param props properties for the value expression
 * @returns {@link Children} representing the JavaScript value expression
 */
export function ValueExpression(props: Readonly<ValueExpressionProps>): Children {
  switch (props.value.valueKind) {
    case "StringValue":
    case "BooleanValue":
    case "NullValue":
      return <ts.ValueExpression jsValue={props.value.value} />;
    case "NumericValue":
      if (props.value.value.asNumber()) {
        return <ts.ValueExpression jsValue={props.value.value.asNumber()} />;
      }
      compilerAssert(props.value.value.isInteger, "BigInt value must be an integer", props.value);
      return <ts.ValueExpression jsValue={props.value.value.asBigInt()} />;
    case "ArrayValue":
      return (
        <ts.ArrayExpression
          jsValue={props.value.values.map((v) => (
            <ValueExpression value={v} />
          ))}
        />
      );
    case "ScalarValue":
      compilerAssert(
        props.value.value.name === "fromISO",
        `Unsupported scalar constructor ${props.value.value.name}`,
        props.value,
      );
      return <ValueExpression value={props.value.value.args[0]} />;
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
