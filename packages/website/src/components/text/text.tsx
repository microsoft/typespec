import { mergeClasses } from "@fluentui/react-components";
import style from "./text.module.css";

export interface TextProps {
  children: React.ReactNode;
  size?: "standard" | "large";
  className?: string;
}

const Text = ({ children, className, size }: TextProps) => {
  return (
    <div
      className={mergeClasses(style["text"], style[`text-size-${size ?? "standard"}`], className)}
    >
      {children}
    </div>
  );
};

export const PrimaryText = ({ children, className }: TextProps) => {
  return <div className={mergeClasses(style["primary-text"], className)}> {children}</div>;
};

export const DescriptionText = ({ className, ...props }: TextProps) => {
  return <Text {...props} className={mergeClasses(style["description-text"], className)} />;
};
