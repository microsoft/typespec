import { WriteLine } from "../compiler/diagnostics.js";

/**
 * Verbose output is enabled by default for runs in mocha explorer in VS Code,
 * where the output is nicely associated with the individual test, and disabled
 * by default for command line runs where we don't want to spam the console.
 *
 * If the steps taken to produce the message are expensive, pass a callback
 * instead of producing the message then passing it here only to be dropped
 * when verbose output is disabled.
 */
export function logVerboseTestOutput(messageOrCallback: string | ((log: WriteLine) => void)) {
  if (process.env.ADL_VERBOSE_TEST_OUTPUT) {
    if (typeof messageOrCallback === "string") {
      console.log(messageOrCallback);
    } else {
      messageOrCallback(console.log);
    }
  }
}
