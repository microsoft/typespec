import { css } from "@emotion/react";
import { MANIFEST } from "@typespec/compiler";
import { FunctionComponent, PropsWithChildren } from "react";

export const Footer: FunctionComponent = () => {
  const prItem = MANIFEST.pr ? (
    <FooterItem link={`https://github.com/microsoft/typespec/pull/${MANIFEST.pr}`}>
      <span>PR </span>
      <span>{MANIFEST.pr}</span>
    </FooterItem>
  ) : (
    <></>
  );
  return (
    <div
      css={[
        {
          gridArea: "footer",
          gridRow: "3",
          backgroundColor: "#007acc",
          display: "flex",
          fontSize: "14px",
        },
        MANIFEST.pr ? { backgroundColor: "#ce662a" } : {},
      ]}
    >
      {prItem}
      <FooterItem>
        <span>TypeSpec Version </span>
        <span>{MANIFEST.version}</span>
      </FooterItem>
      <FooterItem link={`https://github.com/microsoft/typespec/commit/${MANIFEST.commit}`}>
        <span>Commit </span>
        <span>{MANIFEST.commit.slice(0, 6)}</span>
      </FooterItem>
    </div>
  );
};

interface FooterItemProps {
  link?: string;
}
const FooterItem: FunctionComponent<PropsWithChildren<FooterItemProps>> = ({ children, link }) => {
  return link ? (
    <a css={FooterItemStyles} href={link} target="_blank">
      {children}
    </a>
  ) : (
    <div css={FooterItemStyles}>{children}</div>
  );
};

const FooterItemStyles = css({
  textDecoration: "none",
  color: "#fefefe",
  borderRight: "1px solid #d5d5d5",
  padding: "0 5px",
  "&:hover": {
    backgroundColor: "#063a5c",
  },
});
