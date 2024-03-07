import { Console } from "console";
import { mkdir, writeFile } from "fs/promises";
import inspector from "inspector";
import { join } from "path";
import { fileURLToPath } from "url";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  ApplyWorkspaceEditParams,
  ProposedFeatures,
  PublishDiagnosticsParams,
  TextDocuments,
  WorkspaceEdit,
  createConnection,
} from "vscode-languageserver/node.js";
import { NodeHost } from "../core/node-host.js";
import { typespecVersion } from "../utils/misc.js";
import { createServer } from "./serverlib.js";
import { Server, ServerHost } from "./types.js";

let server: Server | undefined = undefined;

const profileDir = process.env.TYPESPEC_SERVER_PROFILE_DIR;
const logTiming = process.env.TYPESPEC_SERVER_LOG_TIMING === "true";
let profileSession: inspector.Session | undefined;

process.on("unhandledRejection", fatalError);
try {
  main();
} catch (e) {
  fatalError(e);
}

function main() {
  // Redirect all console stdout output to stderr since LSP pipe uses stdout
  // and writing to stdout for anything other than LSP protocol will break
  // things badly.
  global.console = new Console(process.stderr, process.stderr);

  let clientHasWorkspaceFolderCapability = false;
  const connection = createConnection(ProposedFeatures.all);
  const documents = new TextDocuments(TextDocument);

  const host: ServerHost = {
    compilerHost: NodeHost,
    sendDiagnostics(params: PublishDiagnosticsParams) {
      void connection.sendDiagnostics(params);
    },
    log(message: string) {
      connection.console.log(message);
    },
    getOpenDocumentByURL(url: string) {
      return documents.get(url);
    },
    applyEdit(paramOrEdit: ApplyWorkspaceEditParams | WorkspaceEdit) {
      return connection.workspace.applyEdit(paramOrEdit);
    },
  };

  const s = createServer(host);
  server = s;
  s.log(`TypeSpec language server v${typespecVersion}`);
  s.log("Module", fileURLToPath(import.meta.url));
  s.log("Process ID", process.pid);
  s.log("Command Line", process.argv);

  if (profileDir) {
    s.log("CPU profiling enabled", profileDir);
    profileSession = new inspector.Session();
    profileSession.connect();
  }

  connection.onInitialize(async (params) => {
    if (params.capabilities.workspace?.workspaceFolders) {
      clientHasWorkspaceFolderCapability = true;
    }
    return await s.initialize(params);
  });

  connection.onInitialized((params) => {
    if (clientHasWorkspaceFolderCapability) {
      connection.workspace.onDidChangeWorkspaceFolders(s.workspaceFoldersChanged);
    }
    s.initialized(params);
  });

  connection.onDocumentFormatting(profile(s.formatDocument));
  connection.onDidChangeWatchedFiles(profile(s.watchedFilesChanged));
  connection.onDefinition(profile(s.gotoDefinition));
  connection.onCompletion(profile(s.complete));
  connection.onReferences(profile(s.findReferences));
  connection.onRenameRequest(profile(s.rename));
  connection.onPrepareRename(profile(s.prepareRename));
  connection.onFoldingRanges(profile(s.getFoldingRanges));
  connection.onDocumentSymbol(profile(s.getDocumentSymbols));
  connection.onDocumentHighlight(profile(s.findDocumentHighlight));
  connection.onHover(profile(s.getHover));
  connection.onSignatureHelp(profile(s.getSignatureHelp));
  connection.onCodeAction(profile(s.getCodeActions));
  connection.onExecuteCommand(profile(s.executeCommand));
  connection.languages.semanticTokens.on(profile(s.buildSemanticTokens));

  documents.onDidChangeContent(profile(s.checkChange));
  documents.onDidClose(profile(s.documentClosed));

  documents.listen(connection);
  connection.listen();
}

function fatalError(e: unknown) {
  // If we failed to send any log messages over LSP pipe, send them to
  // stderr before exiting.
  for (const pending of server?.pendingMessages ?? []) {
    // eslint-disable-next-line no-console
    console.error(pending);
  }
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
}

function profile<T extends (...args: any) => any>(func: T): T {
  const name = func.name;

  if (logTiming) {
    func = time(func);
  }

  if (!profileDir) {
    return func;
  }

  return (async (...args: any[]) => {
    profileSession!.post("Profiler.enable", () => {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      profileSession!.post("Profiler.start", async () => {
        const ret = await func.apply(undefined!, args);
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        profileSession!.post("Profiler.stop", async (err, args) => {
          if (!err && args.profile) {
            await mkdir(profileDir!, { recursive: true });
            await writeFile(join(profileDir!, name + ".cpuprofile"), JSON.stringify(args.profile));
          }
        });
        return ret;
      });
    });
  }) as T;
}

function time<T extends (...args: any) => any>(func: T): T {
  return (async (...args: any[]) => {
    const start = Date.now();
    const ret = await func.apply(undefined!, args);
    const end = Date.now();
    server!.log(func.name, end - start + " ms");
    return ret;
  }) as T;
}
