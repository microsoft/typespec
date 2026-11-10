import { mergeClasses } from "@fluentui/react-components";
import type { FunctionComponent, ReactNode } from "react";
import style from "./footer.module.css";

/** Layout and content for a replacement playground footer. */
export interface FooterProps {
  /** Additional class merged with the footer's layout styles. */
  className?: string;
  /** Footer contents, typically composed from {@link FooterItem} components. */
  children: ReactNode;
}

/** Arrange custom footer contents using the playground's footer layout. */
export const Footer: FunctionComponent<FooterProps> = ({ className, children }) => {
  return <div className={mergeClasses(style.footer, className)}>{children}</div>;
};
