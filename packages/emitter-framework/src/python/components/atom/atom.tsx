import { type Children } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import { compilerAssert, type Value } from "@typespec/compiler";

/**
 * Properties for the {@link Atom} component.
 */
interface AtomProps {
  /**
   * The TypeSpec value to be converted to a Python expression.
   */
  value: Value;
}

/**
 * Generates a Python atom from a TypeSpec value.
 * @param props properties for the atom
 * @returns {@link Children} representing the Python value expression
 */
export function Atom(props: Readonly<AtomProps>): Children {
  switch (props.value.valueKind) {
    case "StringValue":
    case "BooleanValue":
    case "NullValue":
      return <py.Atom jsValue={props.value.value} />;
    case "NumericValue":
      return <py.Atom jsValue={props.value.value.asNumber()} />;
    case "ArrayValue":
      return (
        <py.Atom
          jsValue={props.value.values.map((v) => (
            <Atom value={v} />
          ))}
        />
      );
    case "ScalarValue":
      compilerAssert(
        props.value.value.name === "fromISO",
        `Unsupported scalar constructor ${props.value.value.name}`,
        props.value,
      );
      return handleISOStringValue(props.value);
    case "ObjectValue":
      const jsProperties: Record<string, Children> = {};
      for (const [key, value] of props.value.properties) {
        jsProperties[key] = Atom({ value: value.value });
      }
      return <py.Atom jsValue={jsProperties} />;
    // case "EnumValue":
    //   return <py.Atom jsValue={props.value.value.value ?? props.value.value.name} />;
    // TODO: Handle EnumValue in a separate PR
  }
}

/**
 * Handles the conversion of ISO date strings to Python datetime objects.
 * @param value the TypeSpec value containing the ISO string
 * @returns {@link Children} representing the Python datetime expression
 */
function handleISOStringValue(value: Value & { valueKind: "ScalarValue" }): Children {
  const arg0 = value.value.args[0];
  if (arg0.valueKind !== "StringValue") {
    throw new Error("Expected arg0 to be a StringValue");
  }
  const isoString = arg0.value;
  const date = new Date(isoString);
  // Convert datetime to a module
  const pyDatetime = `datetime.datetime(${date.getUTCFullYear()}, ${date.getUTCMonth() + 1}, ${date.getUTCDate()}, ${date.getUTCHours()}, ${date.getUTCMinutes()}, ${date.getUTCSeconds()}, tzinfo=datetime.timezone.utc)`;
  return <py.Atom jsValue={pyDatetime} />;
}
