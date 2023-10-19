import { mergeClasses } from "@fluentui/react-components";
import { Card } from "../card/card";
import style from "./illustration-card.module.css";

export interface IllustrationCardProps {
  className?: string;
  children?: React.ReactNode;
}
export const IllustrationCard = ({ className, children }: IllustrationCardProps) => {
  return <Card className={mergeClasses(className, style["illustration"])}>{children}</Card>;
};
