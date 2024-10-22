import { P } from "../painter/painter";

export const OverviewIllustrationTerminalContent = () => {
  return (
    <>
      {P.line(P.secondary("~ /my-project"), " tsp init")}
      {P.line(" ")}
      {P.brand("? ")}
      {"Select a template"}
      {P.line("    Empty project")}
      {P.line(P.brand(">   "), P.brand.underline("REST API"))}
    </>
  );
};
