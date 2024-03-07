import { FunctionComponent, ReactElement } from "react";
import { Colors } from "./constants.js";

export const Literal: FunctionComponent<{ children: any }> = ({ children }) => (
  <div css={{ color: Colors.literal, display: "inline" }}>{children}</div>
);

export const KeyValueSection: FunctionComponent<{ children: ReactElement | ReactElement[] }> = ({
  children,
}) => {
  return (
    <ul
      css={{
        margin: 0,
        padding: "0 0 0 16px",
        borderLeft: `1px dashed ${Colors.indentationGuide}`,
        overflow: "auto",
      }}
    >
      {children}
    </ul>
  );
};
