import Link from "@docusaurus/Link";
import { FluentImageName, FluentImg } from "../fluent-img";
import { DescriptionText, NeutralText } from "../text/text";
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
        <NeutralText size="large">{title}</NeutralText>
        <DescriptionText>{subtitle}</DescriptionText>
        <Link href={link}>Learn more →</Link>
      </div>
    </div>
  );
};

export const UseCaseFeatureGroup = ({ children }) => {
  return <div className={style["feature-group"]}>{children}</div>;
};
