import useBaseUrl from "@docusaurus/useBaseUrl";

export interface LinkProps {
  href: string;
  target?: React.HTMLAttributeAnchorTarget;
  children?: React.ReactNode;
}
export const Link = ({ href, children, target }: LinkProps) => {
  return (
    <a href={useBaseUrl(href)} target={target}>
      {children}
    </a>
  );
};
