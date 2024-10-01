import CodeBlockDocusaurus from "@theme/CodeBlock";
import clsx from "clsx";
import style from "./code-block.module.css";

export const CodeBlock = (props: any) => {
  return <CodeBlockDocusaurus {...props} className={clsx(style["code-block"], props.className)} />;
};
