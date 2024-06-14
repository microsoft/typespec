import type { Type } from "@typespec/compiler";
import type { FunctionComponent } from "react";
import { getIdForType } from "../utils.js";
import { KeyValueSection } from "./common.js";

export interface TypeUIBaseProperty {
  name: string;
  value: any;
  description?: string;
}

export interface TypeUIBaseProps {
  type: Type;
  name: string;
  /**
   * Alternate id
   * @default getIdForType(type)
   */
  id?: string;
  properties: TypeUIBaseProperty[];
}

export const TypeUIBase: FunctionComponent<TypeUIBaseProps> = (props) => {
  const id = props.id ?? getIdForType(props.type);
  const properties = props.properties.map((prop) => {
    return (
      <li key={prop.name}>
        <span title={prop.description}>{prop.name}</span>: <span>{prop.value}</span>
      </li>
    );
  });
  return (
    <div>
      <div id={id}>
        <span>{props.type.kind}</span>
        <span>{props.name}</span>
      </div>
      <KeyValueSection>{properties}</KeyValueSection>
    </div>
  );
};
