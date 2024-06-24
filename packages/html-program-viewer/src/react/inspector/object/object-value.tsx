import type { FC } from "react";

import { useStyles } from "../styles/index.js";

/**
 * A short description of the object values.
 * Can be used to render tree node in ObjectInspector
 * or render objects in TableInspector.
 */
export const ObjectValue: FC<any> = ({ object, styles }) => {
  const themeStyles = useStyles("ObjectValue");

  const mkStyle = (key: any) => ({ ...themeStyles[key], ...styles });

  switch (typeof object) {
    case "bigint":
      return <span style={mkStyle("objectValueNumber")}>{String(object)}n</span>;
    case "number":
      return <span style={mkStyle("objectValueNumber")}>{String(object)}</span>;
    case "string":
      return <span style={mkStyle("objectValueString")}>"{object}"</span>;
    case "boolean":
      return <span style={mkStyle("objectValueBoolean")}>{String(object)}</span>;
    case "undefined":
      return <span style={mkStyle("objectValueUndefined")}>undefined</span>;
    case "object":
      if (object === null) {
        return <span style={mkStyle("objectValueNull")}>null</span>;
      }
      if (object instanceof Date) {
        return <span>{object.toString()}</span>;
      }
      if (object instanceof RegExp) {
        return <span style={mkStyle("objectValueRegExp")}>{object.toString()}</span>;
      }
      if (Array.isArray(object)) {
        return <span>{`Array(${object.length})`}</span>;
      }
      if (!object.constructor) {
        return <span>Object</span>;
      }
      if (
        typeof object.constructor.isBuffer === "function" &&
        object.constructor.isBuffer(object)
      ) {
        return <span>{`Buffer[${object.length}]`}</span>;
      }

      return <span>{object.constructor.name}</span>;
    case "function":
      return (
        <span>
          <span style={mkStyle("objectValueFunctionPrefix")}>ƒ&nbsp;</span>
          <span style={mkStyle("objectValueFunctionName")}>{object.name}()</span>
        </span>
      );
    case "symbol":
      return <span style={mkStyle("objectValueSymbol")}>{object.toString()}</span>;
    default:
      return <span />;
  }
};

// ObjectValue.propTypes = {
//   // the object to describe
//   object: PropTypes.any,
// };
