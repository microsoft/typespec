import { css } from "@emotion/react";
import { FunctionComponent, PropsWithChildren, ReactElement } from "react";
import { Colors } from "./constants.js";

export interface ItemProps {
  title: string;
  id?: string;
  hide?: boolean;
}

const ItemStyles = css({
  border: "1px solid #c5c5c5",
});

const ItemTitleStyles = css({
  border: "1px solid #c5c5c5",
  backgroundColor: "#dedede",
  padding: "2px 5px",
});

const ItemContentStyles = css({
  padding: "1rem",
});

export const Item: FunctionComponent<PropsWithChildren<ItemProps>> = ({
  id,
  title,
  hide,
  children,
}) => {
  if (hide) {
    return <div></div>;
  }
  return (
    <div css={ItemStyles} id={id}>
      <div css={ItemTitleStyles}>{title}</div>
      <div css={ItemContentStyles}>{children}</div>
    </div>
  );
};

export const Literal: FunctionComponent<{ children: any }> = ({ children }) => (
  <div css={{ color: "#5da713", display: "inline" }}>{children}</div>
);

export const KeyValueSection: FunctionComponent<{ children: ReactElement[] }> = ({ children }) => {
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
