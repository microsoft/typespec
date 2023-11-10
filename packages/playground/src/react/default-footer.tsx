import { FunctionComponent } from "react";
import { BrowserHost } from "../types.js";
import { FooterVersionItem } from "./footer/footer-version-item.js";
import { Footer, FooterItem } from "./footer/index.js";

export interface FooterProps {
  host: BrowserHost;
}
export const DefaultFooter: FunctionComponent<FooterProps> = ({ host }) => {
  const { MANIFEST } = host.compiler;
  const prItem = MANIFEST.pr ? (
    <FooterItem link={`https://github.com/microsoft/typespec/pull/${MANIFEST.pr}`}>
      <span>PR </span>
      <span>{MANIFEST.pr}</span>
    </FooterItem>
  ) : (
    <></>
  );
  return (
    <Footer>
      {prItem}
      <FooterVersionItem />
      <FooterItem link={`https://github.com/microsoft/typespec/commit/${MANIFEST.commit}`}>
        <span>Commit </span>
        <span>{MANIFEST.commit.slice(0, 6)}</span>
      </FooterItem>
    </Footer>
  );
};
