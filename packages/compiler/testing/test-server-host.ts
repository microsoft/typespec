import { ok } from "assert";
import { pathToFileURL } from "url";
import { TextDocument } from "vscode-languageserver-textdocument";
import { Diagnostic } from "vscode-languageserver/node.js";
import { parse, visitChildren } from "../core/parser.js";
import { IdentifierNode, SyntaxKind } from "../core/types.js";
import { createStringMap } from "../core/util.js";
import { createServer, Server, ServerHost } from "../server/index.js";
import {
  createTestFileSystem,
  resolveVirtualPath,
  StandardTestLibrary,
  TestHostOptions,
} from "./test-host.js";
import { TestFileSystem } from "./types.js";

export interface TestServerHost extends ServerHost, TestFileSystem {
  server: Server;
  logMessages: readonly string[];
  getOpenDocument(path: string): TextDocument | undefined;
  addOrUpdateDocument(path: string, content: string): TextDocument;
  getDiagnostics(path: string): readonly Diagnostic[];
  getURL(path: string): string;
}

export async function createTestServerHost(options?: TestHostOptions) {
  const logMessages: string[] = [];
  const documents = createStringMap<TextDocument>(!!options?.caseInsensitiveFileSystem);
  const diagnostics = createStringMap<Diagnostic[]>(!!options?.caseInsensitiveFileSystem);
  const fileSystem = await createTestFileSystem({ ...options, excludeTestLib: true });
  await fileSystem.addCadlLibrary(StandardTestLibrary);

  const serverHost: TestServerHost = {
    ...fileSystem,
    server: undefined!, // initialized later due to cycle
    logMessages,
    getOpenDocumentByURL(url) {
      return documents.get(url);
    },
    getOpenDocument(path: string) {
      return this.getOpenDocumentByURL(this.getURL(path));
    },
    addOrUpdateDocument(path: string, content: string) {
      const url = this.getURL(path);
      const version = documents.get(url)?.version ?? 1;
      const document = TextDocument.create(url, "cadl", version, content);
      documents.set(url, document);
      return document;
    },
    getDiagnostics(path) {
      return diagnostics.get(this.getURL(path)) ?? [];
    },
    sendDiagnostics(params) {
      if (params.version && documents.get(params.uri)?.version !== params.version) {
        return;
      }
      diagnostics.set(params.uri, params.diagnostics);
    },
    log(message) {
      logMessages.push(message);
    },
    getURL(path: string) {
      if (path.startsWith("untitled:")) {
        return path;
      }
      return pathToFileURL(resolveVirtualPath(path)).href;
    },
  };

  const rootUri = serverHost.getURL("./");
  const server = createServer(serverHost);
  await server.initialize({
    rootUri: options?.caseInsensitiveFileSystem ? rootUri.toUpperCase() : rootUri,
    capabilities: {},
    processId: null,
    workspaceFolders: null,
  });
  server.initialized({});
  serverHost.server = server;
  return serverHost;
}

/**
 * Takes source code with a cursor position indicated by the given marker
 * ("┆" by default), and returns the source without the marker along with
 * the cursor position.
 */
export function extractCursor(
  sourceWithCursor: string,
  marker = "┆"
): { source: string; pos: number } {
  const pos = sourceWithCursor.indexOf(marker);
  ok(pos >= 0, "marker not found");
  const source = sourceWithCursor.replace(marker, "");
  return { source, pos };
}

/**
 * Takes source code with start and end positions indicated by given marker
 * ("~~~" by default) and returns the source without the markers along with
 * the start and end positions.
 */
export function extractSquiggles(
  sourceWithSquiggles: string,
  marker = "~~~"
): { source: string; pos: number; end: number } {
  const { source: sourceWithoutFistSquiggle, pos } = extractCursor(sourceWithSquiggles, marker);
  const { source, pos: end } = extractCursor(sourceWithoutFistSquiggle, marker);
  return { source, pos, end };
}

/**
 * Extracts all identifiers marked with trailing empty comments from source
 */
export function getTestIdentifiers(source: string): IdentifierNode[] {
  const identifiers: IdentifierNode[] = [];
  const ast = parse(source);
  visitChildren(ast, function visit(node) {
    if (node.kind === SyntaxKind.Identifier) {
      if (source.substring(node.end, node.end + "/**/".length) === "/**/") {
        identifiers.push(node);
      }
    }
    visitChildren(node, visit);
  });
  identifiers.sort((x, y) => x.pos - y.pos);
  return identifiers;
}
