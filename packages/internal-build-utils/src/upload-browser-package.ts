import { AzureCliCredential, TokenCredential } from "@azure/identity";
import {
  AnonymousCredential,
  BlobServiceClient,
  ContainerClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { readFile } from "fs/promises";
import { join, resolve } from "path/posix";

const storageAccountName = "tsppackages";
const pkgsContainer = "pkgs";

interface BundleManifest {
  name: string;
  version: string;
  imports: Record<string, string>;
}

export async function uploadBundledPackage(dir: string) {
  const manifest = await readManifest(dir);
  const uploader = new TypeSpecBundledPackageUploader(new AzureCliCredential());
  await uploader.createIfNotExists();
  const uploaded = await uploader.upload(dir, manifest);

  if (uploaded) {
    // eslint-disable-next-line no-console
    console.log(`Bundle for package ${manifest.name}@${manifest.version} uploaded.`);
  } else {
    // eslint-disable-next-line no-console
    console.log(
      `Bundle for package ${manifest.name} already exist for version ${manifest.version}.`
    );
  }
}
async function readManifest(dir: string) {
  const path = resolve(dir, "manifest.json");
  let content;
  try {
    content = await readFile(path);
  } catch (e) {
    throw new Error(`Couldn't find bundle manifest at ${path}`);
  }

  return JSON.parse(content.toString());
}

class TypeSpecBundledPackageUploader {
  #container: ContainerClient;

  constructor(credential?: StorageSharedKeyCredential | AnonymousCredential | TokenCredential) {
    this.#container = getCoverageContainer(storageAccountName, credential);
  }

  async createIfNotExists() {
    await this.#container.createIfNotExists({
      access: "blob",
    });
  }

  async upload(rootDir: string, manifest: BundleManifest): Promise<boolean> {
    const created = await this.#uploadManifest(manifest);
    if (!created) {
      return false;
    }
    for (const file of Object.values(manifest.imports)) {
      await this.#uploadJsFile(manifest.name, manifest.version, rootDir, file);
    }
    return true;
  }

  async #uploadManifest(manifest: BundleManifest) {
    try {
      const blob = this.#container.getBlockBlobClient(
        normalizePath(join(manifest.name, manifest.version, "manifest.json"))
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

  async #uploadJsFile(pkgName: string, version: string, rootDir: string, relativePath: string) {
    const filePath = resolve(rootDir, relativePath);

    const blob = this.#container.getBlockBlobClient(
      normalizePath(join(pkgName, version, relativePath))
    );
    await blob.uploadFile(filePath, {
      blobHTTPHeaders: {
        blobContentType: "application/js; charset=utf-8",
      },
      conditions: {
        ifNoneMatch: "*",
      },
    });
  }
}

function getCoverageContainer(
  storageAccountName: string,
  credential?: StorageSharedKeyCredential | AnonymousCredential | TokenCredential
): ContainerClient {
  const blobSvc = new BlobServiceClient(
    `https://${storageAccountName}.blob.core.windows.net`,
    credential
  );
  const containerClient = blobSvc.getContainerClient(pkgsContainer);
  return containerClient;
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}
