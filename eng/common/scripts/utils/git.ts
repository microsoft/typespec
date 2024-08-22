import { execAsync, type ExecResult } from "./exec-async.js";

export async function listChangedFilesSince(
  ref: string,
  { repositoryPath }: { repositoryPath: string }
) {
  return splitStdoutLines(await execGit(["diff", "--name-only", `${ref}...`], { repositoryPath }));
}

async function execGit(
  args: string[],
  { repositoryPath }: { repositoryPath: string }
): Promise<ExecResult> {
  const result = await execAsync("git", args, { cwd: repositoryPath });

  if (result.code !== 0) {
    throw new GitError(args, result.stderr.toString());
  }
  return result;
}

export class GitError extends Error {
  args: string[];

  constructor(args: string[], stderr: string) {
    super(`GitError running: git ${args.join(" ")}\n${stderr}`);
    this.args = args;
  }
}

function splitStdoutLines(result: ExecResult): string[] {
  return result.stdout
    .toString()
    .split("\n")
    .filter((a) => a);
}
