const logMessages: string[] = [];
let childLogPrefix = "";

export function setChildLogPrefix(message: string): void {
  childLogPrefix = message;
}

export function getChildLogs(): string[] {
  childLogPrefix = "";
  const childLogs = logMessages.splice(0, logMessages.length);
  return childLogs;
}

export function addChildLog(message: string): void {
  logMessages.push(`${childLogPrefix ? `\t${childLogPrefix}` : ""}${message}`);
}
