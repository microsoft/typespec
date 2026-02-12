import { TextDocumentChangeEvent, TextDocumentIdentifier } from "vscode-languageserver";
import { DocumentUri, TextDocument } from "vscode-languageserver-textdocument";
import { getNormalizedRealPath } from "../utils/misc.js";
import { ServerHost } from "./types.js";

/**
 * Service managing files in the language server.
 */
export interface FileService {
  upToDate(document: TextDocument | TextDocumentIdentifier): boolean;
  fileURLToRealPath(url: string): Promise<string>;
  getPath(document: TextDocument | TextDocumentIdentifier): Promise<string>;
  getOpenDocument(path: string): TextDocument | undefined;
  getURL(path: string): string;
  getOpenDocumentInitVersion(uri: string): number | undefined;
  notifyDocumentOpened(arg: TextDocumentChangeEvent<TextDocument>): void;
  notifyDocumentClosed(arg: TextDocumentChangeEvent<TextDocument>): void;
}

export interface FileServiceOptions {
  serverHost: ServerHost;
}

export function createFileService({ serverHost }: FileServiceOptions): FileService {
  const compilerHost = serverHost.compilerHost;
  // Remember original URL when we convert it to a local path so that we can
  // get it back. We can't convert it back because things like URL-encoding
  // could give us back an equivalent but non-identical URL but the original
  // URL is used as a key into the opened documents and so we must reproduce
  // it exactly.
  const pathToURLMap = new Map<string, string>();
  /** Track the init version when a doc is opened so that we can distinguish whether the doc is opened or changed */
  const documentsOpenedInitVersion = new Map<string, number>();

  return {
    upToDate,
    fileURLToRealPath,
    getPath,
    getURL,
    getOpenDocument,
    getOpenDocumentInitVersion,
    notifyDocumentOpened,
    notifyDocumentClosed,
  };

  /**
   * Determine if the given document is the latest version.
   *
   * A document can become out-of-date if a change comes in during an async
   * operation.
   */
  function upToDate(document: TextDocument | TextDocumentIdentifier) {
    if (!("version" in document)) {
      return true;
    }
    return document.version === serverHost.getOpenDocumentByURL(document.uri)?.version;
  }

  async function fileURLToRealPath(url: string) {
    return getNormalizedRealPath(compilerHost, compilerHost.fileURLToPath(url));
  }

  async function getPath(document: TextDocument | TextDocumentIdentifier) {
    if (isUntitled(document.uri)) {
      return document.uri;
    }
    const path = await fileURLToRealPath(document.uri);
    pathToURLMap.set(path, document.uri);
    return path;
  }

  function getURL(path: string) {
    if (isUntitled(path)) {
      return path;
    }
    return pathToURLMap.get(path) ?? compilerHost.pathToFileURL(path);
  }

  function getOpenDocument(path: string): TextDocument | undefined {
    const url = getURL(path);
    return url ? serverHost.getOpenDocumentByURL(url) : undefined;
  }

  function getOpenDocumentInitVersion(uri: DocumentUri): number | undefined {
    return documentsOpenedInitVersion.get(uri) ?? undefined;
  }

  function notifyDocumentOpened(arg: TextDocumentChangeEvent<TextDocument>) {
    if (documentsOpenedInitVersion.has(arg.document.uri)) {
      // not expected, log something for troubleshooting
      serverHost.log({
        level: "debug",
        message: "Document already opened",
        detail: arg.document.uri,
      });
    }
    documentsOpenedInitVersion.set(arg.document.uri, arg.document.version);
  }

  function notifyDocumentClosed(arg: TextDocumentChangeEvent<TextDocument>) {
    if (!documentsOpenedInitVersion.has(arg.document.uri)) {
      // not expected, log something for troubleshooting
      serverHost.log({
        level: "debug",
        message: "Document already closed",
        detail: arg.document.uri,
      });
    }
    documentsOpenedInitVersion.delete(arg.document.uri);
  }
}

function isUntitled(pathOrUrl: string): pathOrUrl is `untitled:${string}` {
  return pathOrUrl.startsWith("untitled:");
}
