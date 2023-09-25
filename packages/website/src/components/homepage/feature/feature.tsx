import { Subtitle1, Text } from "@fluentui/react-components";
import { Card } from "../../card/card";
import { FluentImageName, FluentImg } from "../../fluent-img";
import style from "./feature.module.css";

export interface FeatureProps {
  title: string;
  image: FluentImageName;
  children: React.ReactNode;
}
export const Feature = ({ title, image, children }: FeatureProps) => {
  return (
    <Card className={style["feature-card"]}>
      <div className={style["feature"]}>
        <FluentImg name={image} />
        <div className={style["content"]}>
          <Subtitle1>{title}</Subtitle1>
          <Text>{children}</Text>
        </div>
      </div>
    </Card>
  );
};

export const FeatureGroup = ({ children }) => {
  return <div className={style["feature-group"]}>{children}</div>;
};
