import { mergeClasses } from "@fluentui/react-components";
import type { Type } from "@typespec/compiler";
import type { FunctionComponent } from "react";
import style from "./common.module.css";

export const Mono = ({ children, className }: { children: any; className?: string }) => (
  <span className={mergeClasses(style["mono"], className)}>{children}</span>
);

export const Literal: FunctionComponent<{ children: any }> = ({ children }) => (
  <Mono className={style["literal"]}>{children}</Mono>
);

export const TypeKind = ({ type }: { type: Type }) => {
  return <span className={style["type-kind"]}>{type.kind}</span>;
};

export const TypeKindTag = ({ type, size = "auto" }: { type: Type; size?: "small" | "auto" }) => {
  return (
    <Mono className={mergeClasses(style["type-kind-tag"], style[`type-kind-tag-${size}`])}>
      {type.kind}
    </Mono>
  );
};
