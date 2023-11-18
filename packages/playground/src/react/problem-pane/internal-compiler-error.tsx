import { FunctionComponent } from "react";
import style from "./internal-compiler-error.module.css";

export interface InternalCompilerErrorProps {
  readonly error?: any;
}

export const InternalCompilerError: FunctionComponent<InternalCompilerErrorProps> = ({ error }) => {
  return <pre className={style["error"]}>{error.stack}</pre>;
};
