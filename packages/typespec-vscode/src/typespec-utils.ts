import logger from "./log/logger.js";

export const toOutput = (str: string) => {
  str
    .trim()
    .split("\n")
    .forEach((line) => logger.info(line));
};
export const toError = (str: string) => {
  str
    .trim()
    .split("\n")
    .forEach((line) =>
      logger.error(line, [], {
        showOutput: true,
        showPopup: false,
      }),
    );
};
