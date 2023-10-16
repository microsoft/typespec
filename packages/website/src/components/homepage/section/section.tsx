import {
  Caption1,
  Divider,
  Subtitle2,
  Title2,
  makeStyles,
  mergeClasses,
  tokens,
} from "@fluentui/react-components";
import { FluentImageName, FluentImg } from "../../fluent-img";

import { AssetImg } from "../../asset-img/asset-img";
import { Card } from "../../card/card";
import { Link } from "../../link/link";
import style from "./section.module.css";

interface SectionItem {
  title: string;
  description?: string;
  image?: FluentImageName;
  link: string;
}

interface SectionProps {
  header: string;
  title: string;
  description: string;
  illustration: string | React.ReactNode;
  items: SectionItem[];
  layout?: "text-left" | "text-right";
}

const useFluentStyles = makeStyles({
  primaryText: { color: tokens.colorBrandForeground1 },
  descriptionText: { color: tokens.colorNeutralForeground3 },
});

export const Section = ({
  header,
  title,
  description,
  items,
  layout,
  illustration,
}: SectionProps) => {
  const fluentStyles = useFluentStyles();
  return (
    <div
      className={mergeClasses(
        style["section"],
        style[layout === "text-right" ? "text-right" : "text-left"]
      )}
    >
      <div className={style["info-container"]}>
        <div className={style["info"]}>
          <div className={style["info-heading"]}>
            <div className={style["info-title"]}>
              <Caption1 block={true} className={fluentStyles.primaryText}>
                {header}
              </Caption1>
              <Title2 block={true}>{title}</Title2>
            </div>
            <div className={mergeClasses(fluentStyles.descriptionText, style["info-description"])}>
              {description}
            </div>
          </div>
          <Card className={style["item-card"]}>
            {items.map((x, i) => (
              <div key={i}>
                {i !== 0 ? <Divider /> : ""}
                <SectionItem {...x} />
              </div>
            ))}
          </Card>
        </div>
      </div>
      <Card className={style["illustration"]}>
        {typeof illustration === "string" ? <AssetImg src={illustration} /> : illustration}
      </Card>
    </div>
  );
};

const SectionItem = ({ title, description, image, link }: SectionItem) => {
  const fluentStyles = useFluentStyles();

  return (
    <div className={style["item"]}>
      {image && <FluentImg className={style["item-image"]} name={image} />}
      <div className={style["item-content"]}>
        <Subtitle2 block={true}>{title}</Subtitle2>
        <Caption1 block={true} className={fluentStyles.descriptionText}>
          {description}
        </Caption1>
        <Link href={link}>Learn more →</Link>
      </div>
    </div>
  );
};
