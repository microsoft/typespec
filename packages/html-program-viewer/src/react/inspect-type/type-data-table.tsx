import type { Type } from "@typespec/compiler";
import type { FC } from "react";
import { ObjectInspector } from "react-inspector";
import { useProgram } from "../program-context.js";
import style from "./type-data-table.module.css";

export const TypeDataTable: FC<{ type: Type }> = ({ type }) => {
  const program = useProgram();
  const entries = [...program.stateMaps.entries()]
    .map(([k, v]) => [k, v.get(undefined)?.get(type) as any])
    .filter(([k, v]) => !!v);
  if (entries.length === 0) {
    return null;
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
              <ObjectInspector data={v} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
