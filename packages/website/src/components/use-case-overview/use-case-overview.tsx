import { Button } from "../button/button";
import { DescriptionText, NeutralText } from "../text/text";
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
          <NeutralText size="xlarge" className={style["title"]}>
            {props.title}
          </NeutralText>
          <div className={style["spacer"]} />
          <DescriptionText size="large" className={style["subtitle"]}>
            {props.subtitle}
          </DescriptionText>
          <div className={style["spacer"]} />
          <Button as="a" appearance="primary" href={props.link}>
            Get started
          </Button>
        </div>

        <div className={style["illustration"]}>{props.illustration}</div>
      </div>
    </div>
  );
};
