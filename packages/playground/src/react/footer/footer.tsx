import clsx from "clsx";
import { FunctionComponent, ReactNode } from "react";
import style from "./footer.module.css";

export interface FooterProps {
  className?: string;
  children: ReactNode;
}

export const Footer: FunctionComponent<FooterProps> = ({ className, children }) => {
  return <div className={clsx(style.footer, className)}>{children}</div>;
};

export interface FooterItemProps {
  link?: string;
  children: ReactNode;
}

export const FooterItem: FunctionComponent<FooterItemProps> = ({ children, link }) => {
  return link ? (
    <a className={style["footer-item"]} href={link} target="_blank">
      {children}
    </a>
  ) : (
    <div className={style["footer-item"]}>{children}</div>
  );
};
