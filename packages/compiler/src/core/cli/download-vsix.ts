import { mkdtemp, rm, writeFile } from "fs/promises";
import os from "os";
import { createDiagnostic } from "../messages.js";
import { joinPaths } from "../path-utils.js";
import { Diagnostic, NoTarget } from "../types.js";
import { CliCompilerHost } from "./types.js";

const MARKETPLACE_URL = "https://marketplace.visualstudio.com";

export interface MarketplaceExtension {
  /** Marketplace publisher name (e.g. `typespec`). */
  readonly publisher: string;
  /** Marketplace extension name (e.g. `typespecvs`). */
  readonly name: string;
  /** Full marketplace identifier used for diagnostics (e.g. `typespec.typespecvs`). */
  readonly id: string;
}

/**
 * Download the latest `.vsix` for the given extension from the Visual Studio Marketplace
 * into a temporary directory, invoke the `install` callback with the vsix path, then clean up.
 *
 * To debug with a locally built vsix rather than pulling from the marketplace, set the
 * `TYPESPEC_DEBUG_VSIX` environment variable to the full path of the `.vsix` file.
 */
export async function downloadVsixFromMarketplace(
  host: CliCompilerHost,
  extension: MarketplaceExtension,
  install: (vsixPath: string) => void,
): Promise<readonly Diagnostic[]> {
  const temp = await mkdtemp(joinPaths(os.tmpdir(), "typespec"));
  try {
    let vsixPath = process.env.TYPESPEC_DEBUG_VSIX;
    if (vsixPath === undefined) {
      const version = await resolveLatestVersion(extension.id);
      host.logger.trace(`Downloading ${extension.id}@${version} from the marketplace.`);
      const content = await downloadVsix(extension, version);
      vsixPath = joinPaths(temp, `${extension.name}.vsix`);
      await writeFile(vsixPath, content);
    }
    install(vsixPath);
    return [];
  } catch (error) {
    return [
      createDiagnostic({
        code: "vsix-download-failed",
        format: {
          id: extension.id,
          message: error instanceof Error ? error.message : String(error),
        },
        target: NoTarget,
      }),
    ];
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}

async function resolveLatestVersion(id: string): Promise<string> {
  const res = await fetch(`${MARKETPLACE_URL}/_apis/public/gallery/extensionquery`, {
    method: "POST",
    headers: {
      Accept: "application/json;api-version=3.0-preview.1",
      "Content-Type": "application/json",
    },
    // filterType 7 matches an extension by its full `<publisher>.<name>` id.
    // flags 0x1 (IncludeVersions) returns the versions ordered latest first.
    body: JSON.stringify({
      filters: [{ criteria: [{ filterType: 7, value: id }] }],
      flags: 0x1,
    }),
  });
  if (!res.ok) {
    throw new Error(`Marketplace query returned status ${res.status}.`);
  }
  const data: any = await res.json();
  const version = data?.results?.[0]?.extensions?.[0]?.versions?.[0]?.version;
  if (typeof version !== "string") {
    throw new Error(`Extension "${id}" was not found in the marketplace.`);
  }
  return version;
}

async function downloadVsix(extension: MarketplaceExtension, version: string): Promise<Buffer> {
  const url = `${MARKETPLACE_URL}/_apis/public/gallery/publishers/${extension.publisher}/vsextensions/${extension.name}/${version}/vspackage`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Downloading vsix returned status ${res.status}.`);
  }
  return Buffer.from(await res.arrayBuffer());
}
