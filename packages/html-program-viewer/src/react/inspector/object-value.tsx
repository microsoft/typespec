import type { FC } from "react";
import { Literal } from "../common.js";

export interface ObjectValueProps {
  readonly object: any;
}
/**
 * A short description of the object values.
 * Can be used to render tree node in ObjectInspector
 * or render objects in TableInspector.
 */
export const ObjectValue: FC<ObjectValueProps> = ({ object }) => {
  switch (typeof object) {
    case "bigint":
      return <Literal>{String(object)}n</Literal>;
    case "number":
      return <Literal>{String(object)}</Literal>;
    case "string":
      return <Literal>"{object}"</Literal>;
    case "boolean":
      return <Literal>{String(object)}</Literal>;
    case "undefined":
      return <Literal>undefined</Literal>;
    case "object":
      if (object === null) {
        return <Literal>null</Literal>;
      }
      if (object instanceof Date) {
        return <span>{object.toString()}</span>;
      }
      if (object instanceof RegExp) {
        return <Literal>{object.toString()}</Literal>;
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
          <Literal>ƒ&nbsp;</Literal>
          <Literal>{object.name}()</Literal>
        </span>
      );
    case "symbol":
      return <Literal>{object.toString()}</Literal>;
    default:
      return <span />;
  }
};
