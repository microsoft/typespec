import { Divider, Title2, mergeClasses } from "@fluentui/react-components";
import React from "react";
import { AssetImg } from "../../asset-img/asset-img";
import { Card } from "../../card/card";
import { FluentImageName, FluentImg } from "../../fluent-img";
import { Link } from "../../link/link";
import { DescriptionText, PrimaryText, Text } from "../../text/text";
import style from "./section.module.css";

interface SectionItem {
  title: string;
  description?: string;
  image?: FluentImageName;
  link: string;
}

export interface SectionProps {
  header?: string;
  title?: string;
  description?: string;
  illustration: string | React.ReactNode;
  items?: SectionItem[];
  itemStyle?: "card" | "plain";
  layout?: "text-left" | "text-right";
}

export const Section = ({
  header,
  title,
  description,
  items,
  layout,
  illustration,
  itemStyle: itemsCard,
}: SectionProps) => {
  const heading =
    header || title || description ? (
      <div className={style["info-heading"]}>
        <div className={style["info-title"]}>
          <PrimaryText>{header}</PrimaryText>
          <Title2 block={true}>{title}</Title2>
        </div>
        <DescriptionText size="large" className={style["info-description"]}>
          {description}
        </DescriptionText>
      </div>
    ) : undefined;
  return (
    <div
      className={mergeClasses(
        style["section"],
        style[layout === "text-right" ? "text-right" : "text-left"]
      )}
    >
      <div className={style["info-container"]}>
        <div className={style["info"]}>
          {heading}
          <SectionItems items={items} itemStyle={itemsCard} />
        </div>
      </div>
      <Card className={style["illustration"]}>
        {typeof illustration === "string" ? <AssetImg src={illustration} /> : illustration}
      </Card>
    </div>
  );
};

export const SectionItems = ({ items, itemStyle }: Pick<SectionProps, "items" | "itemStyle">) => {
  if (items === undefined) {
    return null;
  }
  itemStyle = itemStyle ?? "card";

  const content = items.map((x, i) => (
    <React.Fragment key={i}>
      {i !== 0 && itemStyle === "card" ? <Divider /> : ""}
      <SectionItemEl {...x} itemStyle={itemStyle} />
    </React.Fragment>
  ));

  const cls = mergeClasses(style["items-list"], style[`items-list-${itemStyle}`]);
  return itemStyle === "card" ? (
    <Card className={cls}>{content}</Card>
  ) : (
    <div className={cls}>{content}</div>
  );
};

interface SectionItemElProps extends SectionItem {
  itemStyle: "card" | "plain";
}

const SectionItemEl = ({ title, description, image, link, itemStyle }: SectionItemElProps) => {
  return (
    <div className={style["item"]}>
      {image && <FluentImg className={style["item-image"]} name={image} />}
      <div className={style["item-content"]}>
        <Text size={itemStyle === "card" ? "standard" : "large"}>{title}</Text>
        <DescriptionText>{description}</DescriptionText>
        <Link href={link}>
          <Text>Learn more →</Text>
        </Link>
      </div>
    </div>
  );
};
