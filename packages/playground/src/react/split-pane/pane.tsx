import type { HTMLAttributes, PropsWithChildren } from "react";

export interface PaneProps {
  maxSize?: number | string;
  minSize?: number | string;
}

export default function Pane({
  children,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement> & PaneProps>) {
  return <div {...props}>{children}</div>;
}
