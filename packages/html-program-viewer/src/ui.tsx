import { Program } from "@cadl-lang/compiler";
import React from "react";
import ReactDOMServer from "react-dom/server";

export function renderProgram(program: Program) {
  return ReactDOMServer.renderToString(<div></div>);
}
