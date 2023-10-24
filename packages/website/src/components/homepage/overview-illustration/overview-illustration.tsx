import { AssetImg } from "../../asset-img/asset-img";
import { IllustrationCard } from "../../illustration-card/illustration-card";
import { P } from "../../painter/painter";
import { Terminal } from "../../terminal/terminal";
import { Window } from "../../window/window";
import style from "./overview-illustration.module.css";

export const OverviewIllustration = () => {
  return (
    <IllustrationCard blend className={style["card"]}>
      <Terminal className={style["terminal"]}>
        {[
          P.line(P.secondary("~ /my-project"), " tsp init"),
          P.line(" "),
          P.brand("? "),
          "Select a template",
          P.line("    Empty project"),
          P.line(P.brand(">   "), P.brand.underline("REST API")),
        ]}
      </Terminal>
      <Window className={style["ide"]}>
        <AssetImg src="illustrations/overview-ide.png" />
      </Window>
    </IllustrationCard>
  );
};
