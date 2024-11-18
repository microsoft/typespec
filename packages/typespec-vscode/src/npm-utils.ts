import { executeCommand } from "./utils.js";

export async function npmInstallPackages(packages: string[] = [], options: any) {
  let command;
  if (packages.length > 0) {
    command = `npm install ${packages.join(" ")}`;
  } else {
    command = `npm install`;
  }
  await executeCommand(command, [], options);
}
