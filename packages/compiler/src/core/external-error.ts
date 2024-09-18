import { MANIFEST } from "../manifest.js";
import { LibraryMetadata } from "./types.js";

// Color functions from picocolors
export type Colors =
  | "reset"
  | "bold"
  | "dim"
  | "italic"
  | "underline"
  | "inverse"
  | "hidden"
  | "strikethrough"
  | "black"
  | "red"
  | "green"
  | "yellow"
  | "blue"
  | "magenta"
  | "cyan"
  | "white"
  | "gray"
  | "bgBlack"
  | "bgRed"
  | "bgGreen"
  | "bgYellow"
  | "bgBlue"
  | "bgMagenta"
  | "bgCyan"
  | "bgWhite";

export interface ExternalErrorInfo {
  kind: "emitter" | "validator";
  error: unknown;
  metadata: LibraryMetadata;
}

export type ColorFunction = (text: string, color: Colors) => string;
export class ExternalError extends Error {
  constructor(public info: ExternalErrorInfo) {
    super(renderExternalErrorInfo(info));
    this.name = "ExternalError";
  }

  render(color: ColorFunction): string {
    return renderExternalErrorInfo(this.info, color);
  }
}

function renderExternalErrorInfo(
  info: ExternalErrorInfo,
  color: (text: string, color: Colors) => string = (x) => x,
): string {
  const { metadata, kind } = info;
  const msg = [
    color(
      kind === "emitter"
        ? `Emitter "${metadata.name}" crashed! This is a bug.`
        : `Library "${metadata.name}" $onValidate crashed! This is a bug.`,
      "red",
    ),
  ];
  if (metadata.bugs?.url) {
    msg.push(`Please file an issue at ${color(metadata.bugs?.url, "cyan")}`);
  } else {
    msg.push(`Please contact library author to report this issue.`);
  }
  msg.push("");
  msg.push(color(getInnerError(info), "gray"));

  msg.push("");

  msg.push(getReportInfo(metadata, color));
  return msg.join("\n");
}

function getInnerError({ error }: ExternalErrorInfo): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "stack" in error &&
    typeof error.stack === "string"
  ) {
    return error.stack;
  } else {
    return String(error);
  }
}

function getReportInfo(metadata: LibraryMetadata, color: ColorFunction): string {
  const details = {
    "Library Version": metadata.version ?? "?",
    "TypeSpec Compiler Version": MANIFEST.version,
  };
  return [
    "-".repeat(50),
    ...Object.entries(details).map(([k, v]) => `${k.padEnd(30)} ${color(v, "yellow")}`),
    "-".repeat(50),
  ].join("\n");
}
