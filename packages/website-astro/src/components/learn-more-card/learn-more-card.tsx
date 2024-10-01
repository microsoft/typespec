import { type FluentImageName, FluentImg } from "../fluent-img";
import { Link } from "../link/link";
import { DescriptionText, NeutralText, Text } from "../text/text";
import style from "./learn-more-card.module.css";

interface LearnMoreCardProps {
  title: string;
  description?: string;
  image?: FluentImageName;
  link: string;
}

export const LearnMoreCard = ({ title, description, image, link }: LearnMoreCardProps) => {
  return (
    <Link href={link} className={style["item"]}>
      {image && <FluentImg className={style["item-image"]} name={image} />}
      <div className={style["item-content"]}>
        <NeutralText>{title}</NeutralText>
        <DescriptionText>{description}</DescriptionText>
        <Text>Learn more →</Text>
      </div>
    </Link>
  );
};
