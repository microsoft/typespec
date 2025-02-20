const spinnerFrames = ["-", "\\", "|", "/"];

const logMessages: string[] = [];
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
  process.stdout.write("\r\x1b[K");
}

function printChildMessages(): void {
  logMessages.forEach((message) => process.stdout.write(`${message}\n`));
}

export function initializeSpinner(message: string, interval: number = 100): void {
  if (spinnerInterval) {
    clearInterval(spinnerInterval);
  }

  spinnerMessage = message;
  spinnerActive = true;
  spinnerInterval = setInterval(displaySpinner, interval);
}

function resetSpinnerState(): void {
  spinnerInterval = null;
  childLogPrefix = "";
  spinnerMessage = "";
  logMessages.length = 0;
}

export function stopSpinner(finishMessage?: string, printChildMessage: boolean = false): void {
  if (spinnerInterval) {
    spinnerActive = false;
    clearInterval(spinnerInterval);
    clearLastLine();

    if (finishMessage) {
      process.stdout.write(`${finishMessage}\n`);
    }

    if (printChildMessage) {
      printChildMessages();
    }

    resetSpinnerState();
  }
}

export function setChildLogPrefix(message: string): void {
  childLogPrefix = message;
}

export function addChildLog(message: string): void {
  logMessages.push(`\t${childLogPrefix}${message}`);
}
