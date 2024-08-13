import micromatch from "micromatch";
import pc from "picocolors";
import { CIRules } from "../../config/area.js";

export function findAreasChanged(files: string[]): (keyof typeof CIRules)[] {
  const result: (keyof typeof CIRules)[] = [];
  for (const [name, patterns] of Object.entries(CIRules)) {
    const expandedPatterns = patterns.map(expandFolder);
    console.log(`Checking trigger ${name}, with patterns:`, expandedPatterns);
    const match = micromatch(files, expandedPatterns, { dot: true });

    if (match.length > 0) {
      result.push(name as any);
      console.log(`Changes matched for trigger ${pc.cyan(name)}`, match);
    } else {
      console.log(`No changes matched for trigger ${pc.cyan(name)}`);
    }
  }

  return result;
}

export function expandFolder(maybeFolder: string) {
  if (maybeFolder.endsWith("/")) {
    return `${maybeFolder}**/*`;
  }
  return maybeFolder;
}
