import { log } from "console";
import { chmod, mkdir, stat, writeFile } from "node:fs/promises";
import ora from "ora";
import { homedir } from "os";
import { join } from "path";

export interface GetNodeExecutableOptions {
  useSystemNode?: boolean;
  nodeVersion?: string;
  arch?: string;
  withIntl?: string;
}
/**
 * Get node executable path
 * @param  options
 * @returns the path to node executable
 */
export async function getNodeExecutable({
  useSystemNode,
  nodeVersion,
  arch,
  withIntl,
}: GetNodeExecutableOptions = {}) {
  if (useSystemNode) {
    return process.execPath;
  }
  const platformMapping = {
    win32: "windows",
    linux: "linux",
    darwin: "macos",
  } as Record<string, string>;
  // check if the node_executable exists in the local cache directory in ~/.node-sea
  const cache_directory = join(homedir(), ".node-sea");
  await mkdir(cache_directory, { recursive: true });
  const node_executable_filename = `node-${platformMapping[process.platform]}-${arch}-v${nodeVersion}-with-intl-${withIntl}${process.platform === "win32" ? ".exe" : ""}`;
  const expected_node_executable_path = join(cache_directory, node_executable_filename);
  if (await isFile(expected_node_executable_path)) {
    log(`Found cached node executable at ${expected_node_executable_path}`);
    return expected_node_executable_path;
  }
  log(`Downloading node executable from github release or specified mirror url`);
  // download the node executable from github release or specified mirror url named NODE_SEA_NODE_MIRROR_URL
  const download_url_prefix =
    process.env.NODE_SEA_NODE_MIRROR_URL ??
    `https://github.com/liudonghua123/node-sea/releases/download/node/`;
  try {
    const download_spinner = ora(`[ 0.00%] Downloading node executable ...`).start();
    log(`try to download file from ${`${download_url_prefix}${node_executable_filename}`}`);
    const response = await fetch(`${download_url_prefix}${node_executable_filename}`);
    const content_length = +(response.headers.get("Content-Length") ?? 0);
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error(`Failed to get reader from response body`);
    }
    let received_length = 0;
    let chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      chunks.push(value);
      received_length += value.length;
      download_spinner.text = `[${((received_length / content_length) * 100).toFixed(2)}%] Downloading node executable ...`;
    }
    download_spinner.succeed(`[100.00%] Download node executable completed!`);
    let chunks_all = new Uint8Array(received_length); // (4.1)
    let position = 0;
    for (let chunk of chunks) {
      chunks_all.set(chunk, position); // (4.2)
      position += chunk.length;
    }
    await writeFile(expected_node_executable_path, chunks_all);
    await chmod(expected_node_executable_path, 0o755);
    return expected_node_executable_path;
  } catch (error) {
    throw new Error(
      `Failed to download node executable from ${download_url_prefix}${node_executable_filename}`,
    );
  }
}

export async function isFile(path: string) {
  try {
    return (await stat(path)).isFile();
  } catch (e) {
    return false;
  }
}
