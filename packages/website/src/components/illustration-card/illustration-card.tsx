import { mergeClasses } from "@fluentui/react-components";
import { Card, CardProps } from "../card/card";
import style from "./illustration-card.module.css";

export interface IllustrationCardProps extends CardProps {}
export const IllustrationCard = ({ className, noPadding, ...props }: IllustrationCardProps) => {
  return (
    <Card
      className={mergeClasses(className, style["illustration"])}
      noPadding={noPadding ?? true}
      {...props}
    />
  );
};
