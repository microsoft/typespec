/* eslint-disable no-console */
import pc from "picocolors";

const levels = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 30,
};

type Level = keyof typeof levels;
const levelDisplay: Record<Level, string> = {
  debug: pc.blue("debug"),
  info: pc.green("info"),
  warn: pc.yellow("warn"),
  error: pc.red("error"),
};

interface Logger {
  level: Level;
  debug: (message: string, ...data: unknown[]) => void;
  info: (message: string, ...data: unknown[]) => void;
  warn: (message: string, ...data: unknown[]) => void;
  error: (message: string, ...data: unknown[]) => void;
}

export const logger: Logger = {
  level: "info",
  debug: log("debug"),
  info: log("info"),
  warn: log("warn"),
  error: log("error"),
};

function log(level: Level) {
  return (message: string, ...data: unknown[]) => {
    if (levels[level] >= levels[logger.level]) {
      console.log(levelDisplay[level], message, ...data);
    }
  };
}
