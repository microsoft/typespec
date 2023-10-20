import { Button, Title2 } from "@fluentui/react-components";
import { IllustrationCard } from "../illustration-card/illustration-card";
import { DescriptionText } from "../text/text";
import style from "./use-case-overview.module.css";

export interface UseCaseOverviewProps {
  title: string;
  subtitle: string;
  link: string;
  illustration?: React.ReactNode;
}

export const UseCaseOverview = (props: UseCaseOverviewProps) => {
  return (
    <div className={style["container"]}>
      <div className={style["overview"]}>
        <div className={style["content"]}>
          <Title2 block={true} className={style["title"]}>
            {props.title}
          </Title2>
          <div className={style["spacer"]} />
          <DescriptionText size="large" className={style["subtitle"]}>
            {props.subtitle}
          </DescriptionText>
          <div className={style["spacer"]} />
          <Button as="a" appearance="primary" href={props.link}>
            Get started
          </Button>
        </div>

        <IllustrationCard className={style["illustration"]}>{props.illustration}</IllustrationCard>
      </div>
    </div>
  );
};
