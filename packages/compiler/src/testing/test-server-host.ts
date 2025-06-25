import { pathToFileURL } from "url";
import { TextDocument } from "vscode-languageserver-textdocument";
import { Diagnostic, FileChangeType } from "vscode-languageserver/node.js";
import { parse, visitChildren } from "../core/parser.js";
import { resolvePath } from "../core/path-utils.js";
import { IdentifierNode, SyntaxKind } from "../core/types.js";
import { createClientConfigProvider } from "../server/client-config-provider.js";
import { Server, ServerHost, createServer } from "../server/index.js";
import { createStringMap } from "../utils/misc.js";
import { createTestFileSystem } from "./fs.js";
import { StandardTestLibrary, TestHostOptions } from "./test-compiler-host.js";
import { resolveVirtualPath } from "./test-utils.js";
import { TestFileSystem } from "./types.js";

export interface TestServerHost extends ServerHost, TestFileSystem {
  server: Server;
  logMessages: readonly string[];
  getOpenDocument(path: string): TextDocument | undefined;
  addOrUpdateDocument(path: string, content: string): TextDocument;
  openDocument(path: string): TextDocument;
  getDiagnostics(path: string): readonly Diagnostic[];
  getURL(path: string): string;
}

export async function createTestServerHost(options?: TestHostOptions & { workspaceDir?: string }) {
  const logMessages: string[] = [];
  const documents = createStringMap<TextDocument>(!!options?.caseInsensitiveFileSystem);
  const diagnostics = createStringMap<Diagnostic[]>(!!options?.caseInsensitiveFileSystem);
  const fileSystem = await createTestFileSystem({ ...options, excludeTestLib: true });
  await fileSystem.addTypeSpecLibrary(StandardTestLibrary);

  const serverHost: TestServerHost = {
    ...fileSystem,
    throwInternalErrors: true,
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

      let version = 1;
      const oldDocument = documents.get(url);
      if (oldDocument) {
        version = oldDocument.version;
        if (oldDocument.getText() !== content) {
          version++;
        }
      }

      const document = TextDocument.create(url, "typespec", version, content);
      documents.set(url, document);
      fileSystem.addTypeSpecFile(path, ""); // force virtual file system to create directory where document lives.
      return document;
    },
    openDocument(path) {
      const content = fileSystem.fs.get(resolveVirtualPath(path)) ?? "";
      return this.addOrUpdateDocument(path, content);
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
    log(log) {
      logMessages.push(`[${log.level}] ${log.message}`);
    },
    getURL(path: string) {
      if (path.startsWith("untitled:")) {
        return path;
      }
      return pathToFileURL(resolveVirtualPath(path)).href;
    },
    async applyEdit(paramOrEdit) {
      if ("changes" in paramOrEdit) {
        const changes = paramOrEdit.changes || {};
        for (const uri in changes) {
          const path = resolvePath(this.compilerHost.fileURLToPath(uri));
          const document = this.fs.get(path);
          if (document) {
            const lines = document.split("\n");
            changes[uri].map((edit) => {
              const curLineIdx = edit.range.start.line;
              lines[curLineIdx] =
                lines[curLineIdx].slice(0, edit.range.start.character) +
                edit.newText +
                lines[curLineIdx].slice(edit.range.end.character);

              this.fs.set(path, lines.join("\n"));
            });
          }

          server.watchedFilesChanged({
            changes: [{ uri, type: FileChangeType.Changed }],
          });
        }
      }

      return Promise.resolve({ applied: true });
    },
  };

  const workspaceDir = options?.workspaceDir ?? "./";
  const rootUri = serverHost.getURL(workspaceDir);
  const clientConfigProvider = createClientConfigProvider();
  const server = createServer(serverHost, clientConfigProvider);
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
