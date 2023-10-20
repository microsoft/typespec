import { mergeClasses } from "@fluentui/react-components";
import style from "./window.module.css";

export interface WindowProps {
  title?: string;
  className?: string;
  children?: React.ReactNode;
}

export const Window = ({ className, children, title }: WindowProps) => {
  return (
    <div className={mergeClasses(style["window"], className)}>
      <WindowHeader title={title} />
      <div className={style["header-divider"]} />
      <div>{children}</div>
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
