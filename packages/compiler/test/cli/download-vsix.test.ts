import { existsSync } from "fs";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  MarketplaceExtension,
  downloadVsixFromMarketplace,
} from "../../src/core/cli/download-vsix.js";

const EXTENSION: MarketplaceExtension = {
  publisher: "typespec",
  name: "typespecvs",
  id: "typespec.typespecvs",
};

function createHost() {
  return { logger: { trace: vi.fn() } } as any;
}

const fetchMock = vi.fn();

beforeEach(() => {
  delete process.env.TYPESPEC_DEBUG_VSIX;
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

function mockMarketplace(version: string, vsixContent: Uint8Array) {
  fetchMock.mockImplementation((url: string) => {
    if (url.endsWith("/extensionquery")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            results: [{ extensions: [{ versions: [{ version }] }] }],
          }),
      });
    }
    return Promise.resolve({
      ok: true,
      arrayBuffer: () => Promise.resolve(vsixContent.buffer),
    });
  });
}

it("downloads the latest vsix from the marketplace and installs it", async () => {
  const content = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
  mockMarketplace("1.2.3", content);
  const install = vi.fn();

  const diagnostics = await downloadVsixFromMarketplace(createHost(), EXTENSION, install);

  expect(diagnostics).toEqual([]);
  expect(install).toHaveBeenCalledOnce();
  const vsixPath = install.mock.calls[0][0];
  expect(vsixPath).toContain("typespecvs.vsix");

  // the version was resolved via the gallery query, then the vspackage was downloaded
  const downloadUrl = fetchMock.mock.calls[1][0];
  expect(downloadUrl).toBe(
    "https://marketplace.visualstudio.com/_apis/public/gallery/publishers/typespec/vsextensions/typespecvs/1.2.3/vspackage",
  );
});

it("cleans up the temporary directory after installing", async () => {
  mockMarketplace("1.2.3", new Uint8Array([0x50, 0x4b]));
  let vsixPath: string | undefined;
  await downloadVsixFromMarketplace(createHost(), EXTENSION, (p) => (vsixPath = p));
  expect(vsixPath).toBeDefined();
  expect(existsSync(vsixPath!)).toBe(false);
});

it("uses TYPESPEC_DEBUG_VSIX override instead of downloading", async () => {
  process.env.TYPESPEC_DEBUG_VSIX = "/local/path/typespecvs.vsix";
  const install = vi.fn();
  const diagnostics = await downloadVsixFromMarketplace(createHost(), EXTENSION, install);
  expect(diagnostics).toEqual([]);
  expect(fetchMock).not.toHaveBeenCalled();
  expect(install).toHaveBeenCalledWith("/local/path/typespecvs.vsix");
});

it("reports vsix-download-failed when the extension is not found", async () => {
  fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve({ results: [{}] }) });
  const install = vi.fn();
  const diagnostics = await downloadVsixFromMarketplace(createHost(), EXTENSION, install);
  expect(install).not.toHaveBeenCalled();
  expect(diagnostics).toHaveLength(1);
  expect(diagnostics[0].code).toBe("vsix-download-failed");
});

it("reports vsix-download-failed when the marketplace query fails", async () => {
  fetchMock.mockResolvedValue({ ok: false, status: 500 });
  const install = vi.fn();
  const diagnostics = await downloadVsixFromMarketplace(createHost(), EXTENSION, install);
  expect(install).not.toHaveBeenCalled();
  expect(diagnostics).toHaveLength(1);
  expect(diagnostics[0].code).toBe("vsix-download-failed");
});
