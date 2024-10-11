import { link } from "@site/src/utils";
import type { ComponentProps } from "react";

export interface LinkProps extends ComponentProps<"a"> {}

export const Link = ({ href, children, ...props }: LinkProps) => {
  return (
    <a href={link(href)} {...props}>
      {children}
    </a>
  );
};
