import { Divider, Subtitle2, Title2, mergeClasses } from "@fluentui/react-components";
import React from "react";
import { AssetImg } from "../../asset-img/asset-img";
import { Card } from "../../card/card";
import { FluentImageName, FluentImg } from "../../fluent-img";
import { Link } from "../../link/link";
import { DescriptionText, PrimaryText } from "../../text/text";
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
  items?: SectionItem[];
  layout?: "text-left" | "text-right";
}

export const Section = ({
  header,
  title,
  description,
  items,
  layout,
  illustration,
}: SectionProps) => {
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
              <PrimaryText>{header}</PrimaryText>
              <Title2 block={true}>{title}</Title2>
            </div>
            <DescriptionText size="large" className={style["info-description"]}>
              {description}
            </DescriptionText>
          </div>
          {items ? (
            <Card className={style["item-card"]}>
              {items.map((x, i) => (
                <React.Fragment key={i}>
                  {i !== 0 ? <Divider /> : ""}
                  <SectionItem {...x} />
                </React.Fragment>
              ))}
            </Card>
          ) : null}
        </div>
      </div>
      <Card className={style["illustration"]}>
        {typeof illustration === "string" ? <AssetImg src={illustration} /> : illustration}
      </Card>
    </div>
  );
};

const SectionItem = ({ title, description, image, link }: SectionItem) => {
  return (
    <div className={style["item"]}>
      {image && <FluentImg className={style["item-image"]} name={image} />}
      <div className={style["item-content"]}>
        <Subtitle2 block={true}>{title}</Subtitle2>
        <DescriptionText>{description}</DescriptionText>
        <Link href={link}>Learn more →</Link>
      </div>
    </div>
  );
};
