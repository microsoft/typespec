import { Title2, mergeClasses } from "@fluentui/react-components";
import React, { ReactNode } from "react";
import { AssetImg } from "../asset-img/asset-img";
import { DescriptionText, PrimaryText } from "../text/text";
import style from "./section.module.css";

export interface SectionProps {
  header?: string;
  title?: string;
  description?: string;
  illustration: string | React.ReactNode;
  children?: ReactNode;
  itemStyle?: "card" | "plain";
  layout?: "text-left" | "text-right";
}

export const Section = ({
  header,
  title,
  description,
  children,
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
          {children}
        </div>
      </div>
      <div className={style["illustration"]}>
        {typeof illustration === "string" ? <AssetImg src={illustration} /> : illustration}
      </div>
    </div>
  );
};
