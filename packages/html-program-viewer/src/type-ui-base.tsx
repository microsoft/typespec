import { css } from "@emotion/react";
import { Type } from "@typespec/compiler";
import { FunctionComponent } from "react";
import { KeyValueSection } from "./common.js";
import { Colors } from "./constants.js";
import { getIdForType } from "./utils.js";

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

const TypeNameStyles = css({
  display: "inline",
  color: Colors.typeName,
});

export const TypeUIBase: FunctionComponent<TypeUIBaseProps> = (props) => {
  const id = props.id ?? getIdForType(props.type);
  const properties = props.properties.map((prop) => {
    return (
      <li key={prop.name}>
        <span css={{ color: Colors.property }} title={prop.description}>
          {prop.name}
        </span>
        : <span>{prop.value}</span>
      </li>
    );
  });
  return (
    <div>
      <div id={id}>
        <span
          css={{
            display: "inline",
            color: Colors.typeKind,
            marginRight: "5px",
          }}
        >
          {props.type.kind}
        </span>
        <span css={TypeNameStyles}>{props.name}</span>
      </div>
      <KeyValueSection>{properties}</KeyValueSection>
    </div>
  );
};
