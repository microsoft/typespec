import { IllustrationCard } from "../../illustration-card/illustration-card";
import { LightDarkImg } from "../../light-dark-img/light-dark-img";
import { P } from "../../painter/painter";
import { Terminal } from "../../terminal/terminal";
import { Window } from "../../window/window";
import style from "./overview-illustration.module.css";

export const OverviewIllustration = () => {
  return (
    <IllustrationCard blend className={style["card"]}>
      <Terminal className={style["terminal"]}>
        {P.line(P.secondary("~ /my-project"), " tsp init")}
        {P.line(" ")}
        {P.brand("? ")}
        {"Select a template"}
        {P.line("    Empty project")}
        {P.line(P.brand(">   "), P.brand.underline("REST API"))}
      </Terminal>
      <Window className={style["ide"]}>
        <LightDarkImg src="illustrations/overview-ide" />
      </Window>
    </IllustrationCard>
  );
};
