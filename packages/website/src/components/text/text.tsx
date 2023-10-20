import { mergeClasses } from "@fluentui/react-components";
import { FunctionComponent } from "react";
import style from "./text.module.css";

export interface TextProps {
  children: React.ReactNode;
  size?: "standard" | "large";
  className?: string;
}

export const Text = ({ children, className, size }: TextProps) => {
  return (
    <div
      className={mergeClasses(style["text"], style[`text-size-${size ?? "standard"}`], className)}
    >
      {children}
    </div>
  );
};

function makeTextComp(clsName: string): FunctionComponent<TextProps> {
  return ({ className, ...props }: TextProps) => {
    return <Text {...props} className={mergeClasses(style[clsName], className)} />;
  };
}

export const NeutralText = makeTextComp("neutral-text");
export const PrimaryText = makeTextComp("primary-text");
export const DescriptionText = makeTextComp("description-text");
