import { mergeClasses } from "@fluentui/react-components";
import type { FunctionComponent, ReactNode } from "react";
import style from "./footer.module.css";

/** Content for one footer item, optionally rendered as an external link. */
export interface FooterItemProps {
  /** Additional class merged with the standard footer-item styles. */
  className?: string;
  /** Destination opened in a new tab; a falsy value renders a non-link container instead. */
  link?: string;
  /** Visible item contents. */
  children: ReactNode;
}

/** Render a styled footer item, opening a supplied link in a new tab with opener isolation. */
export const FooterItem: FunctionComponent<FooterItemProps> = ({ children, link, className }) => {
  const resolvedClassName = mergeClasses(style["footer-item"], className);
  return link ? (
    <a className={resolvedClassName} href={link} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ) : (
    <div className={resolvedClassName}>{children}</div>
  );
};
