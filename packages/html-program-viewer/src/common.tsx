import { css } from "@emotion/react";
import { FunctionComponent, PropsWithChildren } from "react";

export interface SectionProps {
  title: string;
  id?: string;
  hide?: boolean;
}

const SectionDivStyles = css({
  border: "1px solid #c5c5c5",
});

const SectionTitleStyles = css({
  borderBottom: "1px solid #c5c5c5",
  backgroundColor: "#4875ca",
  color: "#f5f5f5",
  padding: "2px 5px",
});

const SectionContentStyles = css({
  padding: "1rem",
});
export const Section: FunctionComponent<PropsWithChildren<SectionProps>> = ({
  id,
  title,
  hide,
  children,
}) => {
  if (hide) {
    return <div></div>;
  }
  return (
    <div css={SectionDivStyles} id={id}>
      <div css={SectionTitleStyles}>{title}</div>
      <div css={SectionContentStyles}>{children}</div>
    </div>
  );
};

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

export const Item: FunctionComponent<PropsWithChildren<SectionProps>> = ({
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
