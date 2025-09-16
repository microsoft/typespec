import { resolve } from "path";
import vscode, { workspace } from "vscode";
import { Executable } from "vscode-languageclient/node.js";
import { StartFileName } from "./const.js";
import logger from "./log/logger.js";
import { normalizeSlashes } from "./path-utils.js";
import { resolveTypeSpecCli } from "./tsp-executable-resolver.js";
import { VSCodeVariableResolver } from "./vscode-variable-resolver.js";

export function createTaskProvider() {
  return vscode.tasks.registerTaskProvider("typespec", {
    provideTasks: async () => {
      logger.info("Providing tsp tasks");
      // Give it a limit for the built-in task to create when starting because some project may have a large number of
      // tsp proj (like the spec repo contains 600+...). User can still create the task manually if needed
      const MAX_BUILTIN_RESULT = 10;
      const targetPathes = await vscode.workspace
        .findFiles(`**/${StartFileName}`, "**/node_modules/**", MAX_BUILTIN_RESULT)
        .then((uris) =>
          uris
            .filter((uri) => uri.scheme === "file" && !uri.fsPath.includes("node_modules"))
            .map((uri) => normalizeSlashes(uri.fsPath)),
        );
      if (targetPathes.length === MAX_BUILTIN_RESULT) {
        logger.warning(
          `Reached maximum built-in task limit of ${MAX_BUILTIN_RESULT}. Tsp tasks will be created only for the first ${MAX_BUILTIN_RESULT} ${StartFileName} files automatically, but you can still create task manually in the tasks.json for other projects if needed.`,
        );
      } else {
        logger.info(`Found ${targetPathes.length} ${StartFileName} files`);
      }
      const tasks: vscode.Task[] = [];
      for (const targetPath of targetPathes) {
        tasks.push(...(await createBuiltInTasks(targetPath)));
      }
      logger.info(`Provided ${tasks.length} tsp tasks`);
      return tasks;
    },
    resolveTask: async (task: vscode.Task): Promise<vscode.Task | undefined> => {
      if (task.definition.type === "typespec" && task.name && task.definition.path) {
        const t = await createTask(task.name, task.definition.path, task.definition.args);
        if (t) {
          // returned task's definition must be the same object as the given task's definition
          // otherwise vscode would report error that the task is not resolved
          t.definition = task.definition;
          return t;
        } else {
          return undefined;
        }
      }
      return undefined;
    },
  });
}

function getTaskPath(targetPath: string): { absoluteTargetPath: string; workspaceFolder: string } {
  let workspaceFolder = workspace.getWorkspaceFolder(vscode.Uri.file(targetPath))?.uri.fsPath;
  if (!workspaceFolder) {
    workspaceFolder = workspace.workspaceFolders?.[0]?.uri.fsPath ?? "";
    logger.warning(
      `Can't resolve workspace folder from given file ${targetPath}. Try to use the first workspace folder ${workspaceFolder}.`,
    );
  }
  const variableResolver = new VSCodeVariableResolver({
    workspaceFolder,
    workspaceRoot: workspaceFolder, // workspaceRoot is deprecated but we still support it for backwards compatibility.
  });
  targetPath = variableResolver.resolve(targetPath);
  targetPath = resolve(workspaceFolder, targetPath);
  targetPath = normalizeSlashes(variableResolver.resolve(targetPath));
  return { absoluteTargetPath: targetPath, workspaceFolder };
}

function createTaskInternal(
  name: string,
  absoluteTargetPath: string,
  args: string,
  cli: Executable,
  workspaceFolder: string,
) {
  let cmd = `${cli.command} ${cli.args?.join(" ") ?? ""} compile "${absoluteTargetPath}" ${args}`;
  const variableResolver = new VSCodeVariableResolver({
    workspaceFolder,
    workspaceRoot: workspaceFolder, // workspaceRoot is deprecated but we still support it for backwards compatibility.
  });
  cmd = variableResolver.resolve(cmd);
  logger.debug(
    `Command of tsp compile task "${name}" is resolved to: ${cmd} with cwd "${workspaceFolder}"`,
  );
  return new vscode.Task(
    {
      type: "typespec",
      path: absoluteTargetPath,
      args: args,
    },
    vscode.TaskScope.Workspace,
    name,
    "tsp",
    workspaceFolder
      ? new vscode.ShellExecution(cmd, { cwd: workspaceFolder })
      : new vscode.ShellExecution(cmd),
  );
}

async function createTask(name: string, targetPath: string, args?: string) {
  const { absoluteTargetPath, workspaceFolder } = getTaskPath(targetPath);
  const cli = await resolveTypeSpecCli(absoluteTargetPath);
  if (!cli) {
    return undefined;
  }
  return await createTaskInternal(name, absoluteTargetPath, args ?? "", cli, workspaceFolder);
}

async function createBuiltInTasks(targetPath: string): Promise<vscode.Task[]> {
  const { absoluteTargetPath, workspaceFolder } = getTaskPath(targetPath);
  const cli = await resolveTypeSpecCli(absoluteTargetPath);
  if (!cli) {
    return [];
  }
  return [
    { name: `compile - ${targetPath}`, args: "" },
    { name: `watch - ${targetPath}`, args: "--watch" },
  ].map(({ name, args }) => {
    return createTaskInternal(name, absoluteTargetPath, args, cli, workspaceFolder);
  });
}
