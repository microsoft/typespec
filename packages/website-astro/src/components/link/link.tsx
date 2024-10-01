import useBaseUrl from "@docusaurus/useBaseUrl";
import type { ComponentProps } from "react";

export interface LinkProps extends ComponentProps<"a"> {}

export const Link = ({ href, children, ...props }: LinkProps) => {
  return (
    <a href={useBaseUrl(href)} {...props}>
      {children}
    </a>
  );
};
