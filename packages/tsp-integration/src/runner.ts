/* eslint-disable no-console */
import pc from "picocolors";

export interface TaskRunnerOptions<Stages extends string> {
  readonly verbose?: boolean;
  readonly stages?: Stages[];
}

export class TaskRunner<Stages extends string = string> {
  #verbose: boolean;
  #stages: Stages[] | undefined;

  constructor(options: TaskRunnerOptions<Stages> = {}) {
    this.#stages = options.stages;
    this.#verbose = options.verbose === undefined ? Boolean(process.env.CI) : options.verbose;
  }

  async stage(name: Stages, fn: () => Promise<unknown>): Promise<void> {
    if (this.#stages && !this.#stages.includes(name)) {
      return;
    }
    await fn();
  }

  reportTaskWithDetails(status: "pass" | "fail" | "skip", name: string, details: string) {
    const statusStr =
      status === "pass" ? pc.green("pass") : status === "fail" ? pc.red("fail") : pc.gray("skip");
    const message = `${statusStr} ${name}`;
    if (this.#verbose || status === "fail") {
      this.group(message, details);
    } else {
      console.log(message);
    }
  }

  group(name: string, content: string) {
    if (process.env.GITHUB_ACTIONS) {
      console.log(`::group::${name}`);
      console.log(content);
      console.log("::endgroup::");
    } else {
      console.group(name);
      console.log(content);
      console.groupEnd();
    }
  }
}
