import { mergeClasses } from "@fluentui/react-components";
import { Window, WindowProps } from "../window/window";
import style from "./terminal.module.css";

export interface TerminalProps extends WindowProps {}

export const Terminal = ({ className, children, ...props }: WindowProps) => {
  return (
    <Window className={mergeClasses(style["terminal"], className)} {...props}>
      <pre className={style["terminal-code"]}>{children}</pre>
    </Window>
  );
};
