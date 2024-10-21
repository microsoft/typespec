import clsx from "clsx";
import style from "./card.module.css";

export interface CardProps {
  /** Should skip padding. */
  noPadding?: boolean;
  /** Should the background blend. */
  blend?: boolean;

  children?: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className, noPadding, blend }: CardProps) => {
  return (
    <div
      className={clsx(
        style["card"],
        noPadding && style["no-padding"],
        blend && style["blend"],
        className,
      )}
    >
      <div className={style["bg"]}></div>
      <div className={style["content"]}>{children}</div>
    </div>
  );
};
