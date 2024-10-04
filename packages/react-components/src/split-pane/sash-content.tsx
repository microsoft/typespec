import { mergeClasses } from "@fluentui/react-components";
import type { ReactNode } from "react";
import style from "./split-pane.module.css";

export interface SashContentProps {
  className?: string;
  dragging?: boolean;
  children?: ReactNode;
}

export const SashContent: React.FunctionComponent<SashContentProps> = ({
  className,
  children,
  dragging,
  ...others
}: SashContentProps) => {
  return (
    <div
      className={mergeClasses(
        style["sash-content"],
        dragging && style["sash-content-dragging"],
        className,
      )}
      {...others}
    >
      {children}
    </div>
  );
};
