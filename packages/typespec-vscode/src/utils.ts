import { dirname } from "path";
import { Executable } from "vscode-languageclient/node.js";

/** normalize / and \\ to / */
export function normalizeSlash(str: string): string {
  return str.replaceAll(/\\/g, "/");
}

export function isWhitespaceStringOrUndefined(str: string | undefined): boolean {
  return str === undefined || str.trim() === "";
}

export function* listParentFolder(folder: string, includeSelf: boolean) {
  if (isWhitespaceStringOrUndefined(folder)) {
    return;
  }
  let cur = folder;
  if (!includeSelf) {
    cur = dirname(cur);
    if (cur === folder) {
      return;
    }
  }

  let last = "";
  while (cur !== last) {
    yield cur;
    last = cur;
    cur = dirname(cur);
  }
}

/**
 *
 * @param exe
 * @param win32Only only use Shell when the process.platform is "win32"
 * @returns
 */
export function useShellInExec(exe: Executable, win32Only: boolean = true): Executable {
  if (!win32Only || process.platform === "win32") {
    if (exe.options) {
      exe.options.shell = true;
    } else {
      exe.options = { shell: true };
    }
    if (exe.command.includes(" ")) {
      exe.command = `"${exe.command}"`;
    }
  }
  return exe;
}
