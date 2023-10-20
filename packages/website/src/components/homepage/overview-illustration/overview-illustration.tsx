import { mergeClasses } from "@fluentui/react-components";
import { AssetImg } from "../../asset-img/asset-img";
import { IllustrationCard } from "../../illustration-card/illustration-card";
import { Window } from "../../window/window";
import style from "./overview-illustration.module.css";
export const OverviewIllustration = () => {
  return (
    <IllustrationCard blend className={style["card"]}>
      <Window className={style["terminal"]}>
        <pre className={style["terminal-code"]}>
          <div>
            <H c="secondary">~ /my-project</H> tsp init
          </div>
          <div> </div>
          <div>
            <H c="brand">?</H> Select a template{" "}
          </div>
          <div>{"    "}Empty project</div>
          <div>
            <H c="brand">{">   "}</H>
            <H c="brand" underline>
              REST API
            </H>
          </div>
        </pre>
      </Window>
      <Window className={style["ide"]}>
        <AssetImg src="illustrations/overview-ide.png" />
      </Window>
    </IllustrationCard>
  );
};

interface HProps {
  c: "brand" | "secondary";
  underline?: boolean;
  children: React.ReactNode;
}
/**
 * Highlight helper
 */
const H = ({ c: color, underline: highlight, children }: HProps) => {
  const cls = mergeClasses(
    style[`color-${color}`],
    highlight ? style["color-highlight"] : undefined
  );
  return <span className={cls}>{children}</span>;
};
