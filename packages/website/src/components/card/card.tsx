import { mergeClasses } from "@fluentui/react-components";
import style from "./card.module.css";

export interface CardProps {
  noPadding?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className, noPadding }: CardProps) => {
  return (
    <div
      className={mergeClasses(
        style["card"],
        noPadding ? style["no-padding"] : undefined,
        className
      )}
    >
      {" "}
      {children}
    </div>
  );
};
