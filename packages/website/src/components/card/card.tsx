import { mergeClasses } from "@fluentui/react-components";
import style from "./card.module.css";

export interface CardProps {
  children?: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className }: CardProps) => {
  return <div className={mergeClasses(style["card"], className)}> {children}</div>;
};
