import { mergeClasses } from "@fluentui/react-components";
import type { FunctionComponent, ReactNode } from "react";
import style from "./footer.module.css";

export interface FooterProps {
  className?: string;
  children: ReactNode;
}

export const Footer: FunctionComponent<FooterProps> = ({ className, children }) => {
  return <div className={mergeClasses(style.footer, className)}>{children}</div>;
};
