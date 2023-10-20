import { mergeClasses } from "@fluentui/react-components";
import style from "./text.module.css";

export interface PrimaryTextProps {
  children: React.ReactNode;
  className?: string;
}
export const PrimaryText = ({ children, className }: PrimaryTextProps) => {
  return <div className={mergeClasses(style["primary-text"], className)}> {children}</div>;
};
