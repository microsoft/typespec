import type { FunctionComponent } from "react";
import style from "./file-breadcrumb.module.css";

export interface FileBreadcrumbProps {
  readonly path: string;
}

export const FileBreadcrumb: FunctionComponent<FileBreadcrumbProps> = ({ path }) => {
  if (!path || !path.includes("/")) {
    return null;
  }

  const segments = path.split("/");

  return (
    <div className={style["breadcrumb"]}>
      {segments.map((segment, index) => (
        <span key={index} className={style["segment"]}>
          {index > 0 && <span className={style["separator"]}>/</span>}
          <span className={index === segments.length - 1 ? style["current"] : undefined}>
            {segment}
          </span>
        </span>
      ))}
    </div>
  );
};
