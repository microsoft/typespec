import { TokenCredential } from "@azure/identity";
import {
  AnonymousCredential,
  BlobServiceClient,
  ContainerClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { BundleManifest, TypeSpecBundle, TypeSpecBundleFile } from "@typespec/bundler";
import { join } from "path/posix";
import { pkgsContainer, storageAccountName } from "./constants.js";

export interface UploadBundleResult {
  status: "uploaded" | "already-exists";
  /** Resolve imports with absolute url. */
  imports: Record<string, string>;
}

export interface PackageIndex {
  version: string;
  imports: Record<string, string>;
}

export class TypeSpecBundledPackageUploader {
  #container: ContainerClient;

  constructor(credential?: StorageSharedKeyCredential | AnonymousCredential | TokenCredential) {
    this.#container = getCoverageContainer(storageAccountName, credential);
  }

  async createIfNotExists() {
    await this.#container.createIfNotExists({
      access: "blob",
    });
  }

  async upload({ manifest, files }: TypeSpecBundle): Promise<UploadBundleResult> {
    const imports = Object.fromEntries(
      Object.entries(manifest.imports).map(([key, value]) => {
        return [
          key,
          this.#container.url + "/" + normalizePath(join(manifest.name, manifest.version, value)),
        ];
      }),
    );
    const created = await this.#uploadManifest(manifest);
    if (!created) {
      return { status: "already-exists", imports };
    }
    for (const file of files) {
      await this.#uploadJsFile(manifest.name, manifest.version, file);
    }
    return { status: "uploaded", imports };
  }

  async getIndex(name: string, version: string): Promise<PackageIndex | undefined> {
    const blob = this.#container.getBlockBlobClient(`indexes/${name}/${version}.json`);
    if (await blob.exists()) {
      const response = await blob.download();
      const body = await response.blobBody;
      const existingContent = await body?.text();
      if (existingContent) {
        const parsed = JSON.parse(existingContent);
        return parsed;
      }
    }
    return undefined;
  }
  async updateIndex(name: string, index: PackageIndex) {
    const blob = this.#container.getBlockBlobClient(`indexes/${name}/${index.version}.json`);
    const content = JSON.stringify(index);
    await blob.upload(content, content.length, {
      blobHTTPHeaders: {
        blobContentType: "application/json; charset=utf-8",
      },
    });
  }

  async #uploadManifest(manifest: BundleManifest) {
    try {
      const blob = this.#container.getBlockBlobClient(
        normalizePath(join(manifest.name, manifest.version, "manifest.json")),
      );
      const content = JSON.stringify(manifest);
      await blob.upload(content, content.length, {
        blobHTTPHeaders: {
          blobContentType: "application/json; charset=utf-8",
        },
        conditions: {
          ifNoneMatch: "*",
        },
      });
    } catch (e: any) {
      if (e.code === "BlobAlreadyExists") {
        return false;
      }
      throw e;
    }
    return true;
  }

  async #uploadJsFile(pkgName: string, version: string, file: TypeSpecBundleFile) {
    const blob = this.#container.getBlockBlobClient(
      normalizePath(join(pkgName, version, file.filename)),
    );
    await blob.uploadData(Buffer.from(file.content), {
      blobHTTPHeaders: {
        blobContentType: "application/javascript; charset=utf-8",
      },
      conditions: {
        ifNoneMatch: "*",
      },
    });
  }
}

function getCoverageContainer(
  storageAccountName: string,
  credential?: StorageSharedKeyCredential | AnonymousCredential | TokenCredential,
): ContainerClient {
  const blobSvc = new BlobServiceClient(
    `https://${storageAccountName}.blob.core.windows.net`,
    credential,
  );
  const containerClient = blobSvc.getContainerClient(pkgsContainer);
  return containerClient;
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}
