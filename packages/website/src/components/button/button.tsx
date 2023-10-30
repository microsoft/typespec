import clsx from "clsx";
import { ReactNode } from "react";
import style from "./button.module.css";

export interface ButtonProps {
  appearance?: "primary" | "outline";
  as?: "a";
  href: string;
  children?: ReactNode;
  className?: string;
}

export const Button = ({ href, children, className, appearance }: ButtonProps) => {
  const appearanceCls = style[`appearance-${appearance ?? "primary"}`];
  return (
    <a className={clsx(style["button"], appearanceCls, className)} href={href}>
      {children}
    </a>
  );
};
