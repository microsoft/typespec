import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";
import { parse } from "yaml";

interface Step {
  name?: string;
  uses?: string;
  if?: string;
  env?: Record<string, string>;
  with?: Record<string, unknown> & { script?: string };
}
interface Workflow {
  on: Record<string, unknown>;
  permissions: Record<string, string>;
  jobs: Record<string, { if?: string; permissions?: Record<string, string>; steps: Step[] }>;
}

function loadWorkflow(name: string): Workflow {
  return parse(
    readFileSync(new URL(`../../.github/workflows/${name}.yml`, import.meta.url), "utf8"),
  );
}

const producer = loadWorkflow("ci-emitter-diff-python");
function listener() {
  return loadWorkflow("ci-emitter-diff-python-commenter");
}

function fixture() {
  const run = {
    id: 123,
    run_attempt: 1,
    event: "pull_request",
    path: ".github/workflows/ci-emitter-diff-python.yml",
    conclusion: "success",
    head_sha: "abc123",
    head_branch: "feature",
    head_repository: { full_name: "contributor/typespec", owner: { login: "contributor" } },
  };
  const pr = {
    number: 42,
    state: "open",
    head: { sha: run.head_sha, ref: run.head_branch, repo: run.head_repository },
    base: { repo: { full_name: "microsoft/typespec" } },
  };
  const artifact = { id: 77, name: "emitter-diff-python-comment", expired: false };
  const payload = { body: "### Python emitter diff\nDiff summary: 1 file(s), +1 / -0" };
  const comments: { id: number; body: string; user: { login: string; type: string } }[] = [];
  const outputs: Record<string, string> = {};
  const github = {
    rest: {
      pulls: { list: vi.fn(), get: vi.fn(async () => ({ data: pr })) },
      actions: { listWorkflowRunArtifacts: vi.fn() },
      issues: {
        listComments: vi.fn(),
        createComment: vi.fn(),
        updateComment: vi.fn(),
      },
    },
    paginate: vi.fn(async (method: unknown) => {
      if (method === github.rest.pulls.list) return [pr];
      if (method === github.rest.actions.listWorkflowRunArtifacts) return [artifact];
      if (method === github.rest.issues.listComments) return comments;
      throw new Error("Unexpected endpoint");
    }),
  };
  const core = {
    info: vi.fn(),
    warning: vi.fn(),
    setOutput: vi.fn((name: string, value: string) => (outputs[name] = String(value))),
  };
  const fs = {
    lstatSync: vi.fn(() => ({ isFile: (): boolean => true, size: 100 })),
    readFileSync: vi.fn(() => JSON.stringify(payload)),
  };
  const context = {
    repo: { owner: "microsoft", repo: "typespec" },
    payload: { workflow_run: run },
    serverUrl: "https://github.com",
  };
  async function execute(name: string) {
    const script = listener().jobs.commenter.steps.find((step) => step.name === name)?.with?.script;
    expect(script).toBeTypeOf("string");
    await runInNewContext(`(async () => { ${script} })()`, {
      github,
      context,
      core,
      process: { env: { RUNNER_TEMP: "temp", PR_NUMBER: outputs.pr || "42" } },
      require: (name: string) => {
        if (name === "node:fs") return fs;
        if (name === "node:path") return { join };
        throw new Error(`Unexpected module: ${name}`);
      },
    });
  }
  return { run, pr, artifact, payload, comments, outputs, github, core, fs, execute };
}

it("keeps generation read-only and comments exclusively in the listener", () => {
  expect(producer.permissions).toEqual({ contents: "read" });
  expect(Object.keys(producer.jobs)).toEqual(["emitter-diff"]);
  const job = producer.jobs["emitter-diff"];
  expect(job.if).toBeUndefined();
  expect(job.permissions).toBeUndefined();
  expect(job.steps[0].with?.["persist-credentials"]).toBe(false);
  for (const name of ["Save comment artifact", "Upload comment artifact"]) {
    expect(job.steps.find((step) => step.name === name)?.if).toBe(
      "always() && github.event_name == 'pull_request'",
    );
  }
  expect(job.steps.find((step) => step.name === "Fail on tool error")?.if).toBe("always()");
  expect(listener().permissions).toEqual({ actions: "read", "pull-requests": "write" });
  expect(listener().on).toEqual({
    workflow_run: { workflows: ["python / emitter diff"], types: ["completed"] },
  });
  expect(listener().jobs.commenter.if).toBe("github.event.workflow_run.event == 'pull_request'");
  expect(
    listener().jobs.commenter.steps.every(
      (step) =>
        step.uses?.startsWith("actions/github-script@") ||
        step.uses?.startsWith("actions/download-artifact@"),
    ),
  ).toBe(true);
  const download = listener().jobs.commenter.steps.find(
    (step) => step.name === "Download comment artifact",
  );
  expect(download?.with?.["run-id"]).toBe("${{ github.event.workflow_run.id }}");
  expect(download?.with?.["artifact-ids"]).toBe("${{ steps.resolve.outputs.artifact }}");
  for (const name of ["Download comment artifact", "Post PR comment"]) {
    expect(listener().jobs.commenter.steps.find((step) => step.name === name)?.if).toBe(
      "steps.resolve.outputs.artifact != ''",
    );
  }
});

it.each(["0", "1", ""])("saves only comment text for producer status %s", async (status) => {
  const writeFileSync = vi.fn();
  const script = producer.jobs["emitter-diff"].steps.find(
    (step) => step.name === "Save comment artifact",
  )?.with?.script;
  expect(script).toBeTypeOf("string");
  await runInNewContext(`(async () => { ${script} })()`, {
    context: {
      repo: { owner: "microsoft", repo: "typespec" },
      serverUrl: "https://github.com",
      runId: 123,
    },
    process: {
      env: {
        RUNNER_TEMP: "temp",
        BASELINE: "gh:base",
        STATUS: status,
        SUMMARY: "Diff summary: 2 file(s), +2 / -1",
      },
    },
    require: (name: string) => {
      if (name === "node:fs") return { mkdirSync: vi.fn(), writeFileSync };
      if (name === "node:path") return { join };
      throw new Error(`Unexpected module: ${name}`);
    },
  });
  expect(writeFileSync).toHaveBeenCalledOnce();
  const payload = JSON.parse(writeFileSync.mock.calls[0][1]);
  expect(Object.keys(payload)).toEqual(["body"]);
  expect(payload.body).toContain("actions/runs/123");
  expect(payload.body).toContain(status === "0" ? "emitter-diff-html" : "tool/build error");
});

it.each(["pull_request", "workflow_dispatch"])("gates comment relay for %s", (event) => {
  const step = producer.jobs["emitter-diff"].steps.find(
    (step) => step.name === "Save comment artifact",
  );
  expect(runInNewContext(step!.if!, { always: () => true, github: { event_name: event } })).toBe(
    event === "pull_request",
  );
  expect(
    runInNewContext(listener().jobs.commenter.if!, {
      github: { event: { workflow_run: { event } } },
    }),
  ).toBe(event === "pull_request");
});

describe("trusted PR and artifact resolution", () => {
  it.each(["contributor", "microsoft"])(
    "resolves %s head repository without artifact targeting",
    async (owner) => {
      const f = fixture();
      f.run.head_repository.owner.login = owner;
      f.run.head_repository.full_name = `${owner}/typespec`;
      await f.execute("Resolve PR and artifact");
      expect(f.outputs).toEqual({ pr: "42", artifact: "77" });
      expect(f.github.paginate).toHaveBeenCalledWith(f.github.rest.pulls.list, {
        owner: "microsoft",
        repo: "typespec",
        state: "open",
        head: `${owner}:feature`,
        per_page: 100,
      });
    },
  );

  it.each(["head_sha", "head_branch"])("rejects missing trusted %s", async (field) => {
    const f = fixture();
    f.run[field as "head_sha" | "head_branch"] = "";
    await expect(f.execute("Resolve PR and artifact")).rejects.toThrow(/trusted head/);
  });

  it.each(["stale", "branch", "head-repo", "base-repo", "closed", "ambiguous", "no-match"])(
    "skips %s PRs",
    async (kind) => {
      const f = fixture();
      if (kind === "stale") f.pr.head.sha = "new-sha";
      if (kind === "branch") f.pr.head.ref = "other";
      if (kind === "head-repo") f.pr.head.repo = { ...f.pr.head.repo, full_name: "other/typespec" };
      if (kind === "base-repo") f.pr.base.repo.full_name = "other/typespec";
      if (kind === "closed") f.pr.state = "closed";
      if (kind === "ambiguous") f.github.paginate.mockResolvedValueOnce([f.pr, f.pr]);
      if (kind === "no-match") f.github.paginate.mockResolvedValueOnce([]);
      await f.execute("Resolve PR and artifact");
      expect(f.outputs).toEqual({});
      expect(f.core.info).toHaveBeenCalled();
    },
  );

  it("rejects a different workflow path", async () => {
    const f = fixture();
    f.run.path = ".github/workflows/other.yml";
    await expect(f.execute("Resolve PR and artifact")).rejects.toThrow(/workflow/);
  });

  it("skips cancellation explicitly", async () => {
    const f = fixture();
    f.run.conclusion = "cancelled";
    await f.execute("Resolve PR and artifact");
    expect(f.github.paginate).not.toHaveBeenCalled();
    expect(f.core.info).toHaveBeenCalled();
  });

  it.each(["success", "failure"])("handles missing artifact after %s", async (conclusion) => {
    const f = fixture();
    f.run.conclusion = conclusion;
    f.github.paginate.mockResolvedValueOnce([f.pr]).mockResolvedValueOnce([]);
    if (conclusion === "success") {
      await expect(f.execute("Resolve PR and artifact")).rejects.toThrow(/artifact/);
    } else {
      await f.execute("Resolve PR and artifact");
      expect(f.core.warning).toHaveBeenCalled();
      expect(f.outputs.artifact).toBeUndefined();
    }
  });

  it("surfaces API errors", async () => {
    const f = fixture();
    f.github.paginate.mockRejectedValueOnce(new Error("API unavailable"));
    await expect(f.execute("Resolve PR and artifact")).rejects.toThrow("API unavailable");
  });

  it.each(["expired", "duplicate"])("rejects %s artifacts", async (kind) => {
    const f = fixture();
    if (kind === "expired") f.artifact.expired = true;
    else
      f.github.paginate
        .mockResolvedValueOnce([f.pr])
        .mockResolvedValueOnce([f.artifact, f.artifact]);
    await expect(f.execute("Resolve PR and artifact")).rejects.toThrow(/artifact/);
  });
});

describe("untrusted comment data", () => {
  it("creates a fixed-marker bot comment, ignoring artifact targeting fields", async () => {
    const f = fixture();
    f.fs.readFileSync.mockReturnValue(
      JSON.stringify({ ...f.payload, prNumber: 999, marker: "other" }),
    );
    await f.execute("Post PR comment");
    expect(f.github.rest.issues.createComment).toHaveBeenCalledWith({
      owner: "microsoft",
      repo: "typespec",
      issue_number: 42,
      body: expect.stringContaining(
        "<!-- emitter-diff-python -->\n<!-- emitter-diff-python-run: 123:1 -->",
      ),
    });
  });

  it("paginates and updates only the intended bot-owned marker", async () => {
    const f = fixture();
    f.comments.push(
      { id: 1, body: "<!-- emitter-diff-python -->", user: { login: "attacker", type: "User" } },
      { id: 2, body: "other comment", user: { login: "github-actions[bot]", type: "Bot" } },
      {
        id: 3,
        body: "<!-- emitter-diff-python -->\nold",
        user: { login: "github-actions[bot]", type: "Bot" },
      },
    );
    await f.execute("Post PR comment");
    expect(f.github.paginate).toHaveBeenCalledWith(f.github.rest.issues.listComments, {
      owner: "microsoft",
      repo: "typespec",
      issue_number: 42,
      per_page: 100,
    });
    expect(f.github.rest.issues.updateComment).toHaveBeenCalledWith(
      expect.objectContaining({ comment_id: 3 }),
    );
  });

  it.each(["malformed", "null", "number", "empty", "large-body", "large-file", "symlink"])(
    "rejects %s payload",
    async (kind) => {
      const f = fixture();
      if (kind === "malformed") f.fs.readFileSync.mockReturnValue("{");
      if (kind === "null") f.fs.readFileSync.mockReturnValue("null");
      if (kind === "number") f.fs.readFileSync.mockReturnValue('{"body":12}');
      if (kind === "empty") f.payload.body = " ";
      if (kind === "large-body") f.payload.body = "a".repeat(8001);
      if (kind === "large-file")
        f.fs.lstatSync.mockReturnValue({ isFile: () => true, size: 16385 });
      if (kind === "symlink") f.fs.lstatSync.mockReturnValue({ isFile: () => false, size: 100 });
      await expect(f.execute("Post PR comment")).rejects.toThrow();
      expect(f.github.rest.issues.createComment).not.toHaveBeenCalled();
      expect(f.github.rest.issues.updateComment).not.toHaveBeenCalled();
    },
  );

  it.each(["closed", "stale"])("rechecks %s PR immediately before writing", async (kind) => {
    const f = fixture();
    if (kind === "closed") f.pr.state = "closed";
    else f.pr.head.sha = "new-sha";
    await f.execute("Post PR comment");
    expect(f.github.rest.issues.createComment).not.toHaveBeenCalled();
    expect(f.core.info).toHaveBeenCalled();
  });

  it.each(["124:1", "123:2"])("does not overwrite newer run %s", async (stamp) => {
    const f = fixture();
    f.comments.push({
      id: 1,
      body: `<!-- emitter-diff-python -->\n<!-- emitter-diff-python-run: ${stamp} -->`,
      user: { login: "github-actions[bot]", type: "Bot" },
    });
    await f.execute("Post PR comment");
    expect(f.github.rest.issues.updateComment).not.toHaveBeenCalled();
    expect(f.github.rest.issues.createComment).not.toHaveBeenCalled();
    expect(f.core.info).toHaveBeenCalled();
  });

  it("rejects multiple bot-owned marker comments", async () => {
    const f = fixture();
    f.comments.push(
      ...[1, 2].map((id) => ({
        id,
        body: "<!-- emitter-diff-python -->\nold",
        user: { login: "github-actions[bot]", type: "Bot" },
      })),
    );
    await expect(f.execute("Post PR comment")).rejects.toThrow(/ambiguous/);
  });

  it("surfaces comment write failures", async () => {
    const f = fixture();
    f.github.rest.issues.createComment.mockRejectedValueOnce(new Error("Permission denied"));
    await expect(f.execute("Post PR comment")).rejects.toThrow("Permission denied");
  });
});
