import type { FunctionComponent } from "react";
import { FooterVersionItem } from "./footer/footer-version-item.js";
import { Footer } from "./footer/index.js";

export const DefaultFooter: FunctionComponent = () => {
  return (
    <Footer>
      <FooterVersionItem />
    </Footer>
  );
};
