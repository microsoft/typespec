import { AssetImg } from "../../asset-img/asset-img";
import { IllustrationCard } from "../../illustration-card/illustration-card";
import { P } from "../../painter/painter";
import { Window } from "../../window/window";
import style from "./overview-illustration.module.css";

export const OverviewIllustration = () => {
  return (
    <IllustrationCard blend className={style["card"]}>
      <Window className={style["terminal"]}>
        <pre className={style["terminal-code"]}>
          {[
            P.line(P.secondary("~ /my-project"), " tsp init"),
            P.line(" "),
            P.brand("? "),
            "Select a template",
            P.line("    Empty project"),
            P.line(P.brand(">   "), P.brand.underline("REST API")),
          ]}
        </pre>
      </Window>
      <Window className={style["ide"]}>
        <AssetImg src="illustrations/overview-ide.png" />
      </Window>
    </IllustrationCard>
  );
};
