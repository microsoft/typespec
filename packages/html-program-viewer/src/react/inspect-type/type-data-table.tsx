import { type Type } from "@typespec/compiler";
import type { FC } from "react";
import { TypeKindTag } from "../common.js";
import { ObjectLabel } from "../js-inspector/index.js";
import {
  DefaultNodeRenderer,
  ObjectInspector,
  type NodeRendererProps,
} from "../js-inspector/object-inspector.js";
import { useProgram } from "../program-context.js";
import { TypeReference } from "./inspect-type.js";
import style from "./type-data-table.module.css";

export const TypeDataTable: FC<{ type: Type }> = ({ type }) => {
  const program = useProgram();
  const entries = [...(program as any).stateMaps.entries()]
    .map(([k, v]) => [k, v.get(type) as any])
    .filter(([k, v]) => !!v);
  if (entries.length === 0) {
    return "No decorator state found on this type.";
  }
  return (
    <table className={style["table"]}>
      <thead>
        <tr>
          <th>State Key</th>
          <th>Data</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([k, v], i) => (
          <tr key={k.toString()}>
            <td className={style["key"]}>{k.toString()}</td>
            <td className={style["data"]}>
              <ObjectInspectorWithTspTypes data={v} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export interface ObjectInspectorProps {
  readonly data: any;
}
const ObjectInspectorWithTspTypes = (props: ObjectInspectorProps) => {
  return <ObjectInspector {...props} nodeRenderer={NodeWithTspType} />;
};

const NodeWithTspType = (props: NodeRendererProps) => {
  const { data } = props;
  if (isTypeSpecType(data)) {
    return (
      <ObjectLabel name={props.name}>
        <span className={style["tsp-type-ref"]}>
          <TypeKindTag type={data} size="small" />
          <TypeReference type={data} />
        </span>
      </ObjectLabel>
    );
  }
  return <DefaultNodeRenderer {...props} />;
};

function isTypeSpecType(data: unknown): data is Type {
  return (
    typeof data === "object" &&
    data !== null &&
    "entityKind" in data &&
    data.entityKind === "Type" &&
    "kind" in data
  );
}
