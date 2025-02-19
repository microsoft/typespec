import isUnicodeSupported from "is-unicode-supported";
import { clearLine, cursorTo } from "readline";

const spinnerFrames = isUnicodeSupported()
  ? ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
  : ["-", "\\", "|", "/"];

let logMessages: string[] = [];
let spinnerInterval: NodeJS.Timeout | null = null;
let childLogPrefix = "";
let spinnerMessage = "";
let spinnerActive = false;

function createSpinner(): () => string {
  let index = 0;

  return () => {
    index = ++index % spinnerFrames.length;
    return spinnerFrames[index];
  };
}

const spinner = createSpinner();

function displaySpinner(): void {
  process.stdout.write(`\r${spinner()} ${spinnerMessage}`);
}

function clearLastLine(): void {
  cursorTo(process.stdout, 0);
  clearLine(process.stdout, 0);
}

function printChildMessages(): void {
  logMessages.forEach((message) => console.log(message));
  logMessages.length = 0;
}

export function initializeSpinner(message: string, interval: number = 100): void {
  if (spinnerInterval) {
    clearInterval(spinnerInterval);
  }

  spinnerMessage = message;
  spinnerActive = true;
  spinnerInterval = setInterval(displaySpinner, interval);
}

export function stopSpinner(finishMessage?: string, printChildMessage: boolean = false): void {
  if (spinnerInterval) {
    clearInterval(spinnerInterval);
    clearLastLine();
    spinnerInterval = null;
    spinnerActive = false;
    childLogPrefix = "";
    spinnerMessage = "";

    if (finishMessage) {
      console.log(finishMessage);
    }

    if (printChildMessage) {
      printChildMessages();
    }

    logMessages.length = 0;
  }
}

export function setChildLogPrefix(message: string): void {
  childLogPrefix = message;
}

export function addChildLog(message: string): void {
  logMessages.push(`\t${childLogPrefix}${message}`);
}

// Override console.log to handle spinner
const originalConsoleLog = console.log;
console.log = function (...args: any[]) {
  if (spinnerActive) {
    clearLastLine();
  }
  originalConsoleLog.apply(console, args);
  if (spinnerActive) {
    displaySpinner();
  }
};
