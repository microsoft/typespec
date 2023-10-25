import clsx from "clsx";
import { MouseEventHandler } from "react";
import style from "./window.module.css";

export interface WindowProps {
  title?: string;
  className?: string;
  hideHeader?: boolean;
  onClick?: MouseEventHandler<HTMLDivElement>;
  children?: React.ReactNode;
}

export const Window = ({ className, children, title, hideHeader, ...others }: WindowProps) => {
  const header = hideHeader ? (
    ""
  ) : (
    <>
      <WindowHeader title={title} />
      <div className={style["header-divider"]} />
    </>
  );
  return (
    <div className={clsx(style["window"], className)} {...others}>
      {header}
      {children}
    </div>
  );
};

interface WindowRimProps {
  title?: string;
}
const WindowHeader = ({ title }: WindowRimProps) => {
  return (
    <div className={style["header"]}>
      <div className={style["actions"]}>
        <div className={style["btn-close"]}></div>
        <div className={style["btn-minify"]}></div>
        <div className={style["btn-expand"]}></div>
      </div>
      <div className={style["header-title"]}>{title}</div>
      <div className={style["header-right-spacer"]}></div>
    </div>
  );
};
