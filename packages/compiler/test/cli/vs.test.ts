import { beforeEach, expect, it, vi } from "vitest";

const mockRun = vi.fn();
vi.mock(import("../../src/core/cli/utils.js"), async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, run: (...args: any[]) => mockRun(...args) };
});

const { installVSExtension, uninstallVSExtension } =
  await import("../../src/core/cli/actions/vs.js");

function createHost() {
  return { logger: { trace: vi.fn(), warn: vi.fn() } } as any;
}

beforeEach(() => {
  mockRun.mockReset();
  // `run` is mocked; return a spawnSync-like result so Windows code paths
  // (e.g. isVSInstalled reading `proc.status`) don't throw.
  mockRun.mockReturnValue({ status: 1, stdout: "" });
});

it("warns that `tsp vs install` is deprecated and points to the docs", async () => {
  const host = createHost();
  await installVSExtension(host);
  expect(host.logger.warn).toHaveBeenCalledWith(expect.stringContaining("tsp vs install"));
  expect(host.logger.warn).toHaveBeenCalledWith(
    expect.stringContaining("https://typespec.io/docs/introduction/editor/vs"),
  );
});

it("warns that `tsp vs uninstall` is deprecated and points to the docs", async () => {
  const host = createHost();
  await uninstallVSExtension(host);
  expect(host.logger.warn).toHaveBeenCalledWith(expect.stringContaining("tsp vs uninstall"));
  expect(host.logger.warn).toHaveBeenCalledWith(
    expect.stringContaining("https://typespec.io/docs/introduction/editor/vs"),
  );
});
