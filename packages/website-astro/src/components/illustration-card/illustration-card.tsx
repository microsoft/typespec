import clsx from "clsx";
import { Card, type CardProps } from "../card/card";
import style from "./illustration-card.module.css";

export interface IllustrationCardProps extends CardProps {}
export const IllustrationCard = ({ className, noPadding, ...props }: IllustrationCardProps) => {
  return (
    <Card
      className={clsx(className, style["illustration"])}
      noPadding={noPadding ?? true}
      {...props}
    />
  );
};
