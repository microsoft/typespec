import DocusaurusLink from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import { ComponentProps } from "react";

export interface LinkProps extends ComponentProps<"a"> {}

export const Link = ({ href, children, ...props }: LinkProps) => {
  return (
    <DocusaurusLink href={useBaseUrl(href)} {...props}>
      {children}
    </DocusaurusLink>
  );
};
