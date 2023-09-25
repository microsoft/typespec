import style from "./sectioned-layout.module.css";

export const SectionedLayout = ({ children }) => {
  return <div className={style["layout"]}>{children}</div>;
};
