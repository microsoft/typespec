import { mergeClasses } from "@fluentui/react-components";
import style from "./text.module.css";

export interface DescriptionTextProps {
  children: React.ReactNode;
  className?: string;
}
export const DescriptionText = ({ children, className }: DescriptionTextProps) => {
  return <div className={mergeClasses(style["description-text"], className)}> {children}</div>;
};
