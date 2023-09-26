import { Link, Subtitle1, Text } from "@fluentui/react-components";
import { FluentImageName, FluentImg } from "../fluent-img";
import style from "./use-case-feature.module.css";

export interface UseCaseFeatureProps {
  image: FluentImageName;
  title: string;
  subtitle: string;
  link: string;
}
export const UseCaseFeature = ({ image, title, subtitle, link }: UseCaseFeatureProps) => {
  return (
    <div className={style["feature"]}>
      <FluentImg name={image} className={style["image"]} />
      <div className={style["content"]}>
        <Subtitle1>{title}</Subtitle1>
        <Text>{subtitle}</Text>
        <Link href={link}>Learn more</Link>
      </div>
    </div>
  );
};

export const UseCaseFeatureGroup = ({ children }) => {
  return <div className={style["feature-group"]}>{children}</div>;
};
