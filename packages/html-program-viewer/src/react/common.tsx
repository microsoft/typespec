import { mergeClasses } from "@fluentui/react-components";
import type { Type } from "@typespec/compiler";
import type { FunctionComponent, ReactElement } from "react";
import style from "./common.module.css";

export const Mono = ({ children, className }: { children: any; className?: string }) => (
  <span className={mergeClasses(style["mono"], className)}>{children}</span>
);

export const Literal: FunctionComponent<{ children: any }> = ({ children }) => (
  <Mono className={style["literal"]}>{children}</Mono>
);

export const TypeKind = ({ type }: { type: Type }) => {
  return <Mono className={style["type-kind"]}>{type.kind}</Mono>;
};

export const KeyValueSection: FunctionComponent<{ children: ReactElement | ReactElement[] }> = ({
  children,
}) => {
  return <ul>{children}</ul>;
};
