import style from "./use-case-layout.module.css";

export const UseCaseLayout = ({ children }) => {
  return <div className={style["layout"]}>{children}</div>;
};
