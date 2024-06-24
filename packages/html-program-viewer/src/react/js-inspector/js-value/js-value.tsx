import type { FC } from "react";
import { Mono } from "../../common.js";
import style from "./js-value.module.css";

export interface JsValueProps {
  readonly value: any;
}
/**
 * A short description of the object values.
 * Can be used to render tree node in ObjectInspector
 * or render objects in TableInspector.
 */
export const JsValue: FC<JsValueProps> = ({ value }) => {
  switch (typeof value) {
    case "bigint":
      return <Mono className={style["number"]}>{String(value)}n</Mono>;
    case "number":
      return <Mono className={style["number"]}>{String(value)}</Mono>;
    case "string":
      return <Mono className={style["string"]}>"{value}"</Mono>;
    case "boolean":
      return <Mono className={style["boolean"]}>{String(value)}</Mono>;
    case "undefined":
      return <Mono className={style["intrinsic"]}>undefined</Mono>;
    case "object":
      if (value === null) {
        return <Mono className={style["intrinsic"]}>null</Mono>;
      }
      if (value instanceof Date) {
        return <span>{value.toString()}</span>;
      }
      if (value instanceof RegExp) {
        return <Mono>{value.toString()}</Mono>;
      }
      if (Array.isArray(value)) {
        return <span>{`Array(${value.length})`}</span>;
      }
      if (!value.constructor) {
        return <span>Object</span>;
      }
      if (typeof value.constructor.isBuffer === "function" && value.constructor.isBuffer(value)) {
        return <span>{`Buffer[${value.length}]`}</span>;
      }

      return <span>{value.constructor.name}</span>;
    case "function":
      return (
        <span>
          <Mono>ƒ&nbsp;</Mono>
          <Mono>{value.name}()</Mono>
        </span>
      );
    case "symbol":
      return <Mono>{value.toString()}</Mono>;
    default:
      return <span />;
  }
};
