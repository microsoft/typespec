import clsx from "clsx";
import { FluentImageName, FluentImg } from "../fluent-img";
import { Link } from "../link/link";
import { DescriptionText, NeutralText, Text } from "../text/text";
import style from "./feature-list.module.css";

interface FeatureListItem {
  title: string;
  description?: string;
  image?: FluentImageName;
  link?: string;
}

export interface FeatureListProps {
  items?: FeatureListItem[];
}

export const FeatureList = ({ items }: FeatureListProps) => {
  if (items === undefined) {
    return null;
  }

  const content = items.map((x, i) => <FeatureListItemEl key={i} {...x} />);
  return <div className={clsx(style["items-list"])}>{content}</div>;
};

interface FeatureListItemElProps extends FeatureListItem {}

const FeatureListItemEl = ({ title, description, image, link }: FeatureListItemElProps) => {
  return (
    <div className={style["item"]}>
      {image && <FluentImg className={style["item-image"]} name={image} />}
      <div className={style["item-content"]}>
        <NeutralText size={"large"}>{title}</NeutralText>
        <DescriptionText>{description}</DescriptionText>
        {link && (
          <Link href={link}>
            <Text>Learn more →</Text>
          </Link>
        )}
      </div>
    </div>
  );
};
