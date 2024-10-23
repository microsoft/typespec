import CodeBlockDocusaurus, { Props } from "@theme/CodeBlock";
import clsx from "clsx";
import style from "./code-block.module.css";

export interface CodeBlockProps extends Props {}
export const CodeBlock = (props: CodeBlockProps) => {
  return <CodeBlockDocusaurus {...props} className={clsx(style["code-block"], props.className)} />;
};
