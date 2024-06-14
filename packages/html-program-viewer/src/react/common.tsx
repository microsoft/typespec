import type { FunctionComponent, ReactElement } from "react";

export const Literal: FunctionComponent<{ children: any }> = ({ children }) => (
  <div>{children}</div>
);

export const KeyValueSection: FunctionComponent<{ children: ReactElement | ReactElement[] }> = ({
  children,
}) => {
  return <ul>{children}</ul>;
};
