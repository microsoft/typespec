import { TextDocument } from "vscode-languageserver-textdocument";
import {
  CodeAction,
  CodeActionKind,
  CodeActionParams,
  CompletionList,
  CompletionParams,
  DefinitionParams,
  DiagnosticSeverity,
  DiagnosticTag,
  DidChangeWatchedFilesParams,
  DocumentFormattingParams,
  DocumentHighlight,
  DocumentHighlightKind,
  DocumentHighlightParams,
  DocumentSymbol,
  DocumentSymbolParams,
  ExecuteCommandParams,
  FileChangeType,
  FoldingRange,
  FoldingRangeParams,
  Hover,
  HoverParams,
  InitializedParams,
  InitializeParams,
  InitializeResult,
  Location,
  MarkupContent,
  MarkupKind,
  ParameterInformation,
  PrepareRenameParams,
  Range,
  ReferenceParams,
  RenameFilesParams,
  RenameParams,
  SemanticTokens,
  SemanticTokensBuilder,
  SemanticTokensLegend,
  SemanticTokensParams,
  ServerCapabilities,
  SignatureHelp,
  SignatureHelpParams,
  TextDocumentChangeEvent,
  TextDocumentIdentifier,
  TextDocumentSyncKind,
  TextEdit,
  Diagnostic as VSDiagnostic,
  WorkspaceEdit,
  WorkspaceFoldersChangeEvent,
} from "vscode-languageserver/node.js";
import { getSymNode } from "../core/binder.js";
import { CharCode } from "../core/charcode.js";
import { resolveCodeFix } from "../core/code-fixes.js";
import { compilerAssert, getSourceLocation } from "../core/diagnostics.js";
import { formatTypeSpec } from "../core/formatter.js";
import { getEntityName, getTypeName } from "../core/helpers/type-name-utils.js";
import { builtInLinterRule_UnusedTemplateParameter } from "../core/linter-rules/unused-template-parameter.rule.js";
import { builtInLinterRule_UnusedUsing } from "../core/linter-rules/unused-using.rule.js";
import { builtInLinterLibraryName } from "../core/linter.js";
import { formatLog } from "../core/logger/index.js";
import { CompilerOptions } from "../core/options.js";
import { getPositionBeforeTrivia } from "../core/parser-utils.js";
import { getNodeAtPosition, getNodeAtPositionDetail, visitChildren } from "../core/parser.js";
import {
  ensureTrailingDirectorySeparator,
  getDirectoryPath,
  joinPaths,
  normalizePath,
  resolvePath,
} from "../core/path-utils.js";
import type { Program } from "../core/program.js";
import { skipTrivia, skipWhiteSpace } from "../core/scanner.js";
import { createSourceFile, getSourceFileKindFromExt } from "../core/source-file.js";
import {
  AugmentDecoratorStatementNode,
  CodeFixEdit,
  CompilerHost,
  DecoratorDeclarationStatementNode,
  DecoratorExpressionNode,
  Diagnostic,
  DiagnosticTarget,
  IdentifierNode,
  Node,
  NoTarget,
  PositionDetail,
  ProcessedLog,
  SourceFile,
  SyntaxKind,
  TextRange,
  TypeReferenceNode,
  TypeSpecScriptNode,
} from "../core/types.js";
import { getTypeSpecCoreTemplates } from "../init/core-templates.js";
import { validateTemplateDefinitions } from "../init/init-template-validate.js";
import { InitTemplate } from "../init/init-template.js";
import { scaffoldNewProject } from "../init/scaffold.js";
import { typespecVersion } from "../manifest.js";
import { resolveModule, ResolveModuleHost } from "../module-resolver/module-resolver.js";
import { listAllFilesInDir } from "../utils/fs-utils.js";
import { getNormalizedRealPath, resolveTspMain } from "../utils/misc.js";
import { getSemanticTokens } from "./classify.js";
import { ClientConfigProvider } from "./client-config-provider.js";
import { createCompileService } from "./compile-service.js";
import { resolveCompletion } from "./completion.js";
import { Commands } from "./constants.js";
import { convertDiagnosticToLsp } from "./diagnostics.js";
import { createFileService } from "./file-service.js";
import { createFileSystemCache } from "./file-system-cache.js";
import { LibraryProvider } from "./lib-provider.js";
import { NpmPackageProvider } from "./npm-package-provider.js";
import { getRenameImportEdit, getUpdatedImportValue } from "./rename-file.js";
import { getSymbolStructure } from "./symbol-structure.js";
import { provideTspconfigCompletionItems } from "./tspconfig/completion.js";
import {
  getParameterDocumentation,
  getSymbolDetails,
  getTemplateParameterDocumentation,
} from "./type-details.js";
import {
  CompileResult,
  InitProjectConfig,
  InitProjectContext,
  InternalCompileResult,
  SemanticTokenKind,
  Server,
  ServerCustomCapacities,
  ServerDiagnostic,
  ServerHost,
  ServerInitializeResult,
  ServerLog,
  ServerSourceFile,
  ServerWorkspaceFolder,
} from "./types.js";

export function createServer(
  host: ServerHost,
  clientConfigsProvider?: ClientConfigProvider,
): Server {
  const fileService = createFileService({ serverHost: host });

  // Cache all file I/O. Only open documents are sent over the LSP pipe. When
  // the compiler reads a file that isn't open, we use this cache to avoid
  // hitting the disk. Entries are invalidated when LSP client notifies us of
  // a file change.
  const fileSystemCache = createFileSystemCache({
    fileService,
    log,
  });
  const compilerHost = createCompilerHost();
  const npmPackageProvider = new NpmPackageProvider(compilerHost);
  const emitterProvider = new LibraryProvider(
    npmPackageProvider,
    (exports) => exports.$onEmit !== undefined,
  );
  const linterProvider = new LibraryProvider(
    npmPackageProvider,
    (exports) => exports.$linter !== undefined,
  );

  const compileService = createCompileService({
    fileService,
    fileSystemCache,
    compilerHost,
    serverHost: host,
    log,
    clientConfigsProvider,
  });
  const currentDiagnosticIndex = new Map<number, Diagnostic>();
  let diagnosticIdCounter = 0;
  compileService.on("compileEnd", (result) => reportDiagnostics(result));

  let workspaceFolders: ServerWorkspaceFolder[] = [];
  let isInitialized = false;
  let pendingMessages: ServerLog[] = [];

  return {
    get pendingMessages() {
      return pendingMessages;
    },
    get workspaceFolders() {
      return workspaceFolders;
    },
    compile: compileService.compile,
    initialize,
    initialized,
    workspaceFoldersChanged,
    watchedFilesChanged,
    formatDocument,
    gotoDefinition,
    documentClosed,
    complete,
    findReferences,
    findDocumentHighlight,
    prepareRename,
    rename,
    renameFiles,
    getSemanticTokens: getSemanticTokensForDocument,
    buildSemanticTokens,
    checkChange,
    getFoldingRanges,
    getHover,
    getSignatureHelp,
    getDocumentSymbols,
    getCodeActions,
    executeCommand,
    log,

    getInitProjectContext,
    validateInitProjectTemplate,
    initProject,
    internalCompile,
  };

  async function initialize(params: InitializeParams): Promise<InitializeResult> {
    const tokenLegend: SemanticTokensLegend = {
      tokenTypes: Object.keys(SemanticTokenKind)
        .filter((x) => Number.isNaN(Number(x)))
        .map((x) => x.slice(0, 1).toLocaleLowerCase() + x.slice(1)),
      tokenModifiers: [],
    };

    const capabilities: ServerCapabilities = {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      definitionProvider: true,
      foldingRangeProvider: true,
      hoverProvider: true,
      documentSymbolProvider: true,
      documentHighlightProvider: true,
      completionProvider: {
        resolveProvider: false,
        triggerCharacters: [".", "@", "/"],
      },
      semanticTokensProvider: {
        full: true,
        legend: tokenLegend,
      },
      referencesProvider: true,
      renameProvider: {
        prepareProvider: true,
      },
      documentFormattingProvider: true,
      signatureHelpProvider: {
        triggerCharacters: ["(", ",", "<"],
        retriggerCharacters: [")"],
      },
      codeActionProvider: {
        codeActionKinds: ["quickfix"],
      },
      executeCommandProvider: {
        commands: [Commands.APPLY_CODE_FIX],
      },
    };

    if (params.capabilities.workspace?.workspaceFolders) {
      for (const w of params.workspaceFolders ?? []) {
        workspaceFolders.push({
          ...w,
          path: ensureTrailingDirectorySeparator(await fileService.fileURLToRealPath(w.uri)),
        });
      }
      capabilities.workspace = {
        workspaceFolders: {
          supported: true,
          changeNotifications: true,
        },
        fileOperations: {
          didRename: {
            filters: [
              {
                scheme: "file",
                pattern: { glob: "**/*.tsp", matches: "file" },
              },
              {
                scheme: "file",
                pattern: { glob: "**/*", matches: "folder" },
              },
            ],
          },
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-deprecated
    } else if (params.rootUri) {
      workspaceFolders = [
        {
          name: "<root>",
          // eslint-disable-next-line @typescript-eslint/no-deprecated
          uri: params.rootUri,
          path: ensureTrailingDirectorySeparator(
            // eslint-disable-next-line @typescript-eslint/no-deprecated
            await fileService.fileURLToRealPath(params.rootUri),
          ),
        },
      ];
      // eslint-disable-next-line @typescript-eslint/no-deprecated
    } else if (params.rootPath) {
      workspaceFolders = [
        {
          name: "<root>",
          // eslint-disable-next-line @typescript-eslint/no-deprecated
          uri: compilerHost.pathToFileURL(params.rootPath),
          path: ensureTrailingDirectorySeparator(
            // eslint-disable-next-line @typescript-eslint/no-deprecated
            await getNormalizedRealPath(compilerHost, params.rootPath),
          ),
        },
      ];
    }

    log({ level: "info", message: `Workspace Folders`, detail: workspaceFolders });
    const customCapacities: ServerCustomCapacities = {
      getInitProjectContext: true,
      initProject: true,
      validateInitProjectTemplate: true,
      internalCompile: true,
    };
    // the file path is expected to be .../@typespec/compiler/dist/src/server/serverlib.js
    const curFile = normalizePath(compilerHost.fileURLToPath(import.meta.url));
    const SERVERLIB_PATH_ENDWITH = "/dist/src/server/serverlib.js";
    let compilerRootFolder = undefined;
    if (!curFile.endsWith(SERVERLIB_PATH_ENDWITH)) {
      log({ level: "warning", message: `Unexpected path for serverlib found: ${curFile}` });
    } else {
      compilerRootFolder = curFile.slice(0, curFile.length - SERVERLIB_PATH_ENDWITH.length);
    }
    const result: ServerInitializeResult = {
      serverInfo: {
        name: "TypeSpec Language Server",
        version: typespecVersion,
      },
      capabilities,
      customCapacities,
      compilerRootFolder,
      compilerCliJsPath: compilerRootFolder
        ? joinPaths(compilerRootFolder, "cmd", "tsp.js")
        : undefined,
    };
    return result;
  }

  function initialized(params: InitializedParams): void {
    isInitialized = true;
    log({ level: "info", message: "Initialization complete." });
  }

  async function getInitProjectContext(): Promise<InitProjectContext> {
    return {
      coreInitTemplates: await getTypeSpecCoreTemplates(host.compilerHost),
    };
  }

  async function validateInitProjectTemplate(param: { template: InitTemplate }): Promise<boolean> {
    const { template } = param;
    // even when the strict validation fails, we still try to proceed with relaxed validation
    // so just do relaxed validation directly here
    const validationResult = validateTemplateDefinitions(template, NoTarget, false);
    if (!validationResult.valid) {
      for (const diag of validationResult.diagnostics) {
        log({
          level: diag.severity,
          message: diag.message,
          detail: {
            code: diag.code,
            url: diag.url,
          },
        });
      }
    }
    return validationResult.valid;
  }

  async function initProject(param: { config: InitProjectConfig }): Promise<boolean> {
    try {
      await scaffoldNewProject(compilerHost, param.config);
      return true;
    } catch (e) {
      log({ level: "error", message: "Unexpected error when initializing project", detail: e });
      return false;
    }
  }

  async function internalCompile(param: {
    doc: TextDocumentIdentifier;
    options: CompilerOptions;
  }): Promise<InternalCompileResult> {
    const option: CompilerOptions = {
      ...param.options,
    };

    const result = await compileService.compile(param.doc, option, {
      bypassCache: true,
      trackAction: true,
    });
    if (result === undefined) {
      return {
        hasError: true,
        diagnostics: [
          {
            code: "internal-error",
            message:
              "Failed to get compiler result, please check the compilation output for details",
            severity: "error",
            target: NoTarget,
            url: undefined,
          },
        ],
        entrypoint: undefined,
        options: undefined,
      };
    } else {
      return {
        hasError: result.program.hasError(),
        diagnostics: result.program.diagnostics.map((diagnostic) => {
          const target = getSourceLocation(diagnostic.target, { locateId: true });
          let position = undefined;
          if (target?.file) {
            const lineAndCharacter = target.file.getLineAndCharacterOfPosition(target.pos);
            position = {
              line: lineAndCharacter.line + 1,
              column: lineAndCharacter.character + 1,
            };
          }
          return {
            code: diagnostic.code,
            message: diagnostic.message,
            severity: diagnostic.severity,
            target: { ...target, position: position },
            url: diagnostic.url,
          } as ServerDiagnostic;
        }),
        entrypoint: result.document?.uri,
        options: result.program.compilerOptions,
      };
    }
  }

  async function renameFiles(params: RenameFilesParams): Promise<void> {
    const firstFilePath = params.files[0];
    if (!firstFilePath) {
      return;
    }

    // Update cache for renamed folders.
    for (const file of params.files) {
      const oldFilePath = await fileService.getPath({ uri: file.oldUri });
      const newFilePath = await fileService.getPath({ uri: file.newUri });
      const isDirRename = !file.oldUri.endsWith(".tsp");

      if (isDirRename) {
        const files = await listAllFilesInDir(compilerHost, newFilePath);
        for (const file of files) {
          const oldFile = resolvePath(oldFilePath, file);

          fileSystemCache.notify([
            { uri: fileService.getURL(oldFile), type: FileChangeType.Deleted },
          ]);
        }
      }
    }

    const mainFile = await compileService.getMainFileForDocument(
      await fileService.getPath({ uri: firstFilePath.newUri }),
    );

    // Add this method to resolve timing issues between renamed files and `fs.stat`
    // to prevent `fs.stat` from getting the files before modification.
    // Currently the test requires a delay of 300ms
    await new Promise((resolve) => setTimeout(resolve, 300));
    const result = await compileService.compile({ uri: fileService.getURL(mainFile) });
    if (!result) {
      log({
        level: "debug",
        message: `The main tsp file '${mainFile}' compilation failed, please check the detailed compilation message`,
      });
      return;
    }

    for (const file of params.files) {
      const oldFilePath = await fileService.getPath({ uri: file.oldUri });
      const newFilePath = await fileService.getPath({ uri: file.newUri });
      const isDirRename = !file.oldUri.endsWith(".tsp");

      for (const diagnostic of result.program.diagnostics) {
        if (diagnostic.code !== "import-not-found") continue;
        const target = diagnostic.target as Node;
        if (target.kind === SyntaxKind.ImportStatement) {
          const result = getUpdatedImportValue(target, {
            oldPath: oldFilePath,
            newPath: newFilePath,
            isDirRename,
          });

          if (result) {
            log({
              level: "info",
              message: `The imports content '${target.path.value}' needs to be modified in tsp file '${result.filePath}' to '${result.newValue}'`,
            });

            const edit = getRenameImportEdit(target, result.newValue);
            await host.applyEdit({ changes: { [fileService.getURL(result.filePath)]: [edit] } });
          }
        }
      }
    }
  }

  async function workspaceFoldersChanged(e: WorkspaceFoldersChangeEvent) {
    log({ level: "info", message: "Workspace Folders Changed", detail: e });
    const map = new Map(workspaceFolders.map((f) => [f.uri, f]));
    for (const folder of e.removed) {
      map.delete(folder.uri);
    }
    for (const folder of e.added) {
      map.set(folder.uri, {
        ...folder,
        path: ensureTrailingDirectorySeparator(await fileService.fileURLToRealPath(folder.uri)),
      });
    }
    workspaceFolders = Array.from(map.values());
    log({ level: "info", message: `Workspace Folders`, detail: workspaceFolders });
  }

  function watchedFilesChanged(params: DidChangeWatchedFilesParams) {
    fileSystemCache.notify(params.changes);
    npmPackageProvider.notify(params.changes);
  }

  function isTspConfigFile(doc: TextDocument | TextDocumentIdentifier) {
    return doc.uri.endsWith("tspconfig.yaml");
  }

  async function getFoldingRanges(params: FoldingRangeParams): Promise<FoldingRange[]> {
    if (isTspConfigFile(params.textDocument)) return [];

    const ast = await compileService.getScript(params.textDocument);
    if (!ast) {
      return [];
    }
    const file = ast.file;
    const ranges: FoldingRange[] = [];
    let rangeStartSingleLines = -1;
    for (let i = 0; i < ast.comments.length; i++) {
      const comment = ast.comments[i];
      if (
        comment.kind === SyntaxKind.LineComment &&
        i + 1 < ast.comments.length &&
        ast.comments[i + 1].kind === SyntaxKind.LineComment &&
        ast.comments[i + 1].pos === skipWhiteSpace(file.text, comment.end)
      ) {
        if (rangeStartSingleLines === -1) {
          rangeStartSingleLines = comment.pos;
        }
      } else if (rangeStartSingleLines !== -1) {
        addRange(rangeStartSingleLines, comment.end);
        rangeStartSingleLines = -1;
      } else {
        addRange(comment.pos, comment.end);
      }
    }
    visitChildren(ast, addRangesForNode);
    function addRangesForNode(node: Node) {
      if (node.kind === SyntaxKind.Doc) {
        return; // fold doc comments as regular comments
      }
      let nodeStart = node.pos;
      if ("decorators" in node && node.decorators.length > 0) {
        const decoratorEnd = node.decorators[node.decorators.length - 1].end;
        addRange(nodeStart, decoratorEnd);
        nodeStart = skipTrivia(file.text, decoratorEnd);
      }

      addRange(nodeStart, node.end);
      visitChildren(node, addRangesForNode);
    }
    return ranges;
    function addRange(startPos: number, endPos: number) {
      const start = file.getLineAndCharacterOfPosition(startPos);
      const end = file.getLineAndCharacterOfPosition(endPos);
      if (start.line !== end.line) {
        ranges.push({
          startLine: start.line,
          startCharacter: start.character,
          endLine: end.line,
          endCharacter: end.character,
        });
      }
    }
  }

  async function getDocumentSymbols(params: DocumentSymbolParams): Promise<DocumentSymbol[]> {
    if (isTspConfigFile(params.textDocument)) return [];

    const ast = await compileService.getScript(params.textDocument);
    if (!ast) {
      return [];
    }

    return getSymbolStructure(ast);
  }

  async function findDocumentHighlight(
    params: DocumentHighlightParams,
  ): Promise<DocumentHighlight[]> {
    if (isTspConfigFile(params.textDocument)) return [];

    const result = await compileService.compile(params.textDocument);
    if (result === undefined) {
      return [];
    }
    const { program, document, script } = result;
    if (!document) {
      return [];
    }

    const identifiers = findReferenceIdentifiers(
      program,
      script,
      document.offsetAt(params.position),
      [script],
    );
    return identifiers.map((identifier) => ({
      range: getRange(identifier, script.file),
      kind: DocumentHighlightKind.Read,
    }));
  }

  async function checkChange(change: TextDocumentChangeEvent<TextDocument>) {
    if (isTspConfigFile(change.document)) return undefined;

    compileService.notifyChange(change.document);
  }

  async function reportDiagnostics({ program, document, optionsFromConfig }: CompileResult) {
    if (!document) return undefined;
    if (isTspConfigFile(document)) return undefined;

    currentDiagnosticIndex.clear();
    // Group diagnostics by file.
    //
    // Initialize diagnostics for all source files in program to empty array
    // as we must send an empty array when a file has no diagnostics or else
    // stale diagnostics from a previous run will stick around in the IDE.
    //
    const diagnosticMap: Map<TextDocument, VSDiagnostic[]> = new Map();
    diagnosticMap.set(document, []);
    for (const each of program.sourceFiles.values()) {
      const document = (each.file as ServerSourceFile)?.document;
      if (document) {
        diagnosticMap.set(document, []);
      }
    }

    for (const each of program.diagnostics) {
      const results = convertDiagnosticToLsp(fileService, program, document, each);
      for (const result of results) {
        const [diagnostic, diagDocument] = result;
        if (each.url) {
          diagnostic.codeDescription = {
            href: each.url,
          };
        }
        const unusedUsingRule = `${builtInLinterLibraryName}/${builtInLinterRule_UnusedUsing}`;
        const unusedTemlateParameterRule = `${builtInLinterLibraryName}/${builtInLinterRule_UnusedTemplateParameter}`;
        if (each.code === "deprecated") {
          diagnostic.tags = [DiagnosticTag.Deprecated];
        } else if (each.code === unusedUsingRule) {
          // Unused or unnecessary code. Diagnostics with this tag are rendered faded out, so no extra work needed from IDE side
          // https://vscode-api.js.org/enums/vscode.DiagnosticTag.html#google_vignette
          // https://learn.microsoft.com/en-us/dotnet/api/microsoft.visualstudio.languageserver.protocol.diagnostictag?view=visualstudiosdk-2022
          diagnostic.tags = [DiagnosticTag.Unnecessary];
          if (
            optionsFromConfig.linterRuleSet?.enable?.[unusedUsingRule] === undefined &&
            optionsFromConfig.linterRuleSet?.disable?.[unusedUsingRule] === undefined
          ) {
            // if the unused using is not configured by user explicitly, report it as hint by default
            diagnostic.severity = DiagnosticSeverity.Hint;
          }
        } else if (each.code === unusedTemlateParameterRule) {
          // Unused or unnecessary code. Diagnostics with this tag are rendered faded out, so no extra work needed from IDE side
          // https://vscode-api.js.org/enums/vscode.DiagnosticTag.html#google_vignette
          // https://learn.microsoft.com/en-us/dotnet/api/microsoft.visualstudio.languageserver.protocol.diagnostictag?view=visualstudiosdk-2022
          diagnostic.tags = [DiagnosticTag.Unnecessary];
          if (
            optionsFromConfig.linterRuleSet?.enable?.[unusedTemlateParameterRule] === undefined &&
            optionsFromConfig.linterRuleSet?.disable?.[unusedTemlateParameterRule] === undefined
          ) {
            // if the unused template parameter is not configured by user explicitly, report it as hint by default
            diagnostic.severity = DiagnosticSeverity.Hint;
          }
        }
        diagnostic.data = {
          id: diagnosticIdCounter++,
          file: diagDocument.uri,
        };
        const diagnostics = diagnosticMap.get(diagDocument);
        compilerAssert(
          diagnostics,
          "Diagnostic reported against a source file that was not added to the program.",
        );
        diagnostics.push(diagnostic);
        currentDiagnosticIndex.set(diagnostic.data.id, each);
      }
    }

    for (const [document, diagnostics] of diagnosticMap) {
      sendDiagnostics(document, diagnostics);
    }
  }

  async function getHover(params: HoverParams): Promise<Hover> {
    if (isTspConfigFile(params.textDocument)) return { contents: [] };

    const result = await compileService.compile(params.textDocument);
    if (result === undefined) {
      return { contents: [] };
    }
    const { program, document, script } = result;

    if (!document) {
      return { contents: [] };
    }

    const id = getNodeAtPosition(script, document.offsetAt(params.position));
    const sym =
      id?.kind === SyntaxKind.Identifier ? program.checker.resolveRelatedSymbols(id) : undefined;

    if (!sym || sym.length === 0) {
      return { contents: { kind: MarkupKind.Markdown, value: "" } };
    } else {
      // Only show full definition if the symbol is a model or interface that has extends or is clauses.
      // Avoid showing full definition in other cases which can be long and not useful
      let includeExpandedDefinition = false;
      const sn = getSymNode(sym[0]);
      if (sn.kind !== SyntaxKind.AliasStatement) {
        const type = sym[0].type ?? program.checker.getTypeOrValueForNode(sn);
        if (type && "kind" in type) {
          const modelHasExtendOrIs: boolean =
            type.kind === "Model" &&
            (type.baseModel !== undefined ||
              type.sourceModel !== undefined ||
              type.sourceModels.length > 0);
          const interfaceHasExtend: boolean =
            type.kind === "Interface" && type.sourceInterfaces.length > 0;
          includeExpandedDefinition = modelHasExtendOrIs || interfaceHasExtend;
        }
      }

      const markdown: MarkupContent = {
        kind: MarkupKind.Markdown,
        value:
          sym && sym.length > 0
            ? getSymbolDetails(program, sym[0], {
                includeSignature: true,
                includeParameterTags: true,
                includeExpandedDefinition,
              })
            : "",
      };
      return {
        contents: markdown,
      };
    }
  }

  async function getSignatureHelp(params: SignatureHelpParams): Promise<SignatureHelp | undefined> {
    if (isTspConfigFile(params.textDocument)) return undefined;

    const result = await compileService.compile(params.textDocument);
    if (result === undefined) {
      return undefined;
    }
    const { script, document, program } = result;
    if (!document) {
      return undefined;
    }
    const data = getSignatureHelpNodeAtPosition(script, document.offsetAt(params.position));
    if (data === undefined) {
      return undefined;
    }
    const { node, argumentIndex } = data;
    switch (node.kind) {
      case SyntaxKind.TypeReference:
        return getSignatureHelpForTemplate(program, node, argumentIndex);
      case SyntaxKind.DecoratorExpression:
      case SyntaxKind.AugmentDecoratorStatement:
        return getSignatureHelpForDecorator(program, node, argumentIndex);
      default:
        const _assertNever: never = node;
        compilerAssert(false, "Unreachable");
    }
  }

  function getSignatureHelpForTemplate(
    program: Program,
    node: TypeReferenceNode,
    argumentIndex: number,
  ): SignatureHelp | undefined {
    const sym = program.checker.resolveRelatedSymbols(
      node.target.kind === SyntaxKind.MemberExpression ? node.target.id : node.target,
    );
    if (!sym || sym.length <= 0) {
      return undefined;
    }
    const templateDeclNode = sym[0].declarations[0];
    if (
      !templateDeclNode ||
      !("templateParameters" in templateDeclNode) ||
      templateDeclNode.templateParameters.length === 0
    ) {
      return undefined;
    }

    const parameterDocs = getTemplateParameterDocumentation(templateDeclNode);
    const parameters = templateDeclNode.templateParameters.map((x) => {
      const info: ParameterInformation = { label: x.id.sv };
      const doc = parameterDocs.get(x.id.sv);
      if (doc) {
        info.documentation = { kind: MarkupKind.Markdown, value: doc };
      }
      return info;
    });

    const help: SignatureHelp = {
      signatures: [
        {
          label: `${sym[0].name}<${parameters.map((x) => x.label).join(", ")}>`,
          parameters,
          activeParameter: Math.min(parameters.length - 1, argumentIndex),
        },
      ],
      activeSignature: 0,
      activeParameter: 0,
    };

    const doc = getSymbolDetails(program, sym[0], {
      includeSignature: false,
      includeParameterTags: false,
    });
    if (doc) {
      help.signatures[0].documentation = { kind: MarkupKind.Markdown, value: doc };
    }

    return help;
  }

  function getSignatureHelpForDecorator(
    program: Program,
    node: DecoratorExpressionNode | AugmentDecoratorStatementNode,
    argumentIndex: number,
  ): SignatureHelp | undefined {
    const sym = program.checker.resolveRelatedSymbols(
      node.target.kind === SyntaxKind.MemberExpression ? node.target.id : node.target,
    );
    if (!sym || sym.length <= 0) {
      return undefined;
    }

    const decoratorDeclNode: DecoratorDeclarationStatementNode | undefined =
      sym[0].declarations.find(
        (x): x is DecoratorDeclarationStatementNode =>
          x.kind === SyntaxKind.DecoratorDeclarationStatement,
      );
    if (decoratorDeclNode === undefined) {
      return undefined;
    }

    const type = program.checker.getTypeForNode(decoratorDeclNode);
    compilerAssert(type.kind === "Decorator", "Expected type to be a decorator.");

    const parameterDocs = getParameterDocumentation(program, type);
    let labelPrefix = "";
    const parameters: ParameterInformation[] = [];
    if (node.kind === SyntaxKind.AugmentDecoratorStatement) {
      const targetType = decoratorDeclNode.target.type
        ? program.checker.getTypeForNode(decoratorDeclNode.target.type)
        : undefined;

      parameters.push({
        label: `${decoratorDeclNode.target.id.sv}: ${
          targetType ? getTypeName(targetType) : "unknown"
        }`,
      });

      labelPrefix = "@";
    }

    parameters.push(
      ...type.parameters.map((x) => {
        const info: ParameterInformation = {
          // prettier-ignore
          label: `${x.rest ? "..." : ""}${x.name}${x.optional ? "?" : ""}: ${getEntityName(x.type)}`,
        };
        const doc = parameterDocs.get(x.name);
        if (doc) {
          info.documentation = { kind: MarkupKind.Markdown, value: doc };
        }
        return info;
      }),
    );

    const help: SignatureHelp = {
      signatures: [
        {
          label: `${labelPrefix}${type.name}(${parameters.map((x) => x.label).join(", ")})`,
          parameters,
          activeParameter: Math.min(parameters.length - 1, argumentIndex),
        },
      ],
      activeSignature: 0,
      activeParameter: 0,
    };

    const doc = getSymbolDetails(program, sym[0], {
      includeSignature: false,
      includeParameterTags: false,
    });
    if (doc) {
      help.signatures[0].documentation = { kind: MarkupKind.Markdown, value: doc };
    }

    return help;
  }

  async function formatDocument(params: DocumentFormattingParams): Promise<TextEdit[]> {
    if (isTspConfigFile(params.textDocument)) return [];

    const document = host.getOpenDocumentByURL(params.textDocument.uri);
    if (document === undefined) {
      return [];
    }
    const path = await fileService.fileURLToRealPath(params.textDocument.uri);
    const prettierConfig = await resolvePrettierConfig(path);
    const resolvedConfig = prettierConfig ?? {
      tabWidth: params.options.tabSize,
      useTabs: !params.options.insertSpaces,
    };
    log({
      level: "info",
      message: `Formatting TypeSpec document: ${JSON.stringify({ fileUri: params.textDocument.uri, vscodeOptions: params.options, prettierConfig, resolvedConfig }, null, 2)}`,
    });
    const formattedText = await formatTypeSpec(document.getText(), resolvedConfig);
    return [minimalEdit(document, formattedText)];
  }

  async function resolvePrettierConfig(path: string) {
    try {
      // Resolve prettier if it is installed.
      const prettier = await import("prettier");
      return prettier.resolveConfig(path);
    } catch (e) {
      return null;
    }
  }

  function minimalEdit(document: TextDocument, string1: string): TextEdit {
    const string0 = document.getText();
    // length of common prefix
    let i = 0;
    while (i < string0.length && i < string1.length && string0[i] === string1[i]) {
      ++i;
    }
    // length of common suffix
    let j = 0;
    while (
      i + j < string0.length &&
      i + j < string1.length &&
      string0[string0.length - j - 1] === string1[string1.length - j - 1]
    ) {
      ++j;
    }
    const newText = string1.substring(i, string1.length - j);
    const pos0 = document.positionAt(i);
    const pos1 = document.positionAt(string0.length - j);

    return TextEdit.replace(Range.create(pos0, pos1), newText);
  }

  async function gotoDefinition(params: DefinitionParams): Promise<Location[]> {
    if (isTspConfigFile(params.textDocument)) return [];

    const result = await compileService.compile(params.textDocument);
    if (result === undefined || result.document === undefined) {
      return [];
    }
    const node = getNodeAtPosition(result.script, result.document.offsetAt(params.position));
    switch (node?.kind) {
      case SyntaxKind.Identifier:
        const sym = result.program.checker.resolveRelatedSymbols(node);
        return getLocations(sym && sym.length > 0 ? sym[0].declarations : undefined);
      case SyntaxKind.StringLiteral:
        if (node.parent?.kind === SyntaxKind.ImportStatement) {
          return [await getImportLocation(node.value, result.script)];
        } else {
          return [];
        }
    }
    return [];
  }

  async function getImportLocation(
    importPath: string,
    currentFile: TypeSpecScriptNode,
  ): Promise<Location> {
    const host: ResolveModuleHost = {
      realpath: compilerHost.realpath,
      readFile: async (path) => {
        const file = await compilerHost.readFile(path);
        return file.text;
      },
      stat: compilerHost.stat,
    };
    const resolved = await resolveModule(host, importPath, {
      baseDir: getDirectoryPath(currentFile.file.path),
      resolveMain(pkg) {
        // this lets us follow node resolve semantics more-or-less exactly
        // but using tspMain instead of main.
        return resolveTspMain(pkg) ?? pkg.main;
      },
    });
    return {
      uri: fileService.getURL(resolved.type === "file" ? resolved.path : resolved.mainFile),
      range: Range.create(0, 0, 0, 0),
    };
  }

  async function complete(params: CompletionParams): Promise<CompletionList> {
    if (isTspConfigFile(params.textDocument)) {
      const doc = host.getOpenDocumentByURL(params.textDocument.uri);
      if (doc) {
        const items = await provideTspconfigCompletionItems(doc, params.position, {
          fileService,
          compilerHost,
          emitterProvider,
          linterProvider,
          log,
        });
        return CompletionList.create(items);
      }
      return CompletionList.create([]);
    }

    const completions: CompletionList = {
      isIncomplete: false,
      items: [],
    };
    const result = await compileService.compile(params.textDocument);
    if (result) {
      const { script, document, program } = result;
      if (!document) {
        return completions;
      }
      const posDetail = getCompletionNodeAtPosition(script, document.offsetAt(params.position));

      return await resolveCompletion(
        {
          program,
          file: script,
          completions,
          params,
        },
        posDetail,
      );
    }

    return completions;
  }

  async function findReferences(params: ReferenceParams): Promise<Location[]> {
    if (isTspConfigFile(params.textDocument)) return [];

    const result = await compileService.compile(params.textDocument);
    if (result === undefined || result.document === undefined) {
      return [];
    }
    const identifiers = findReferenceIdentifiers(
      result.program,
      result.script,
      result.document.offsetAt(params.position),
    );
    return getLocations(identifiers);
  }

  async function prepareRename(params: PrepareRenameParams): Promise<Range | undefined> {
    if (isTspConfigFile(params.textDocument)) return undefined;

    const result = await compileService.compile(params.textDocument);
    if (result === undefined || result.document === undefined) {
      return undefined;
    }
    const id = getNodeAtPosition(result.script, result.document.offsetAt(params.position));
    return id?.kind === SyntaxKind.Identifier ? getLocation(id)?.range : undefined;
  }

  async function rename(params: RenameParams): Promise<WorkspaceEdit> {
    if (isTspConfigFile(params.textDocument)) return { changes: {} };

    const changes: Record<string, TextEdit[]> = {};
    const result = await compileService.compile(params.textDocument);
    if (result && result.document) {
      const identifiers = findReferenceIdentifiers(
        result.program,
        result.script,
        result.document.offsetAt(params.position),
      );
      for (const id of identifiers) {
        const location = getLocation(id);
        if (!location) {
          continue;
        }
        const change = TextEdit.replace(location.range, params.newName);
        if (location.uri in changes) {
          changes[location.uri].push(change);
        } else {
          changes[location.uri] = [change];
        }
      }
    }
    return { changes };
  }

  function findReferenceIdentifiers(
    program: Program,
    file: TypeSpecScriptNode,
    pos: number,
    searchFiles: Iterable<TypeSpecScriptNode> = program.sourceFiles.values(),
  ): IdentifierNode[] {
    const id = getNodeAtPosition(file, pos);
    if (id?.kind !== SyntaxKind.Identifier) {
      return [];
    }

    const sym = program.checker.resolveRelatedSymbols(id);
    if (!sym || sym.length <= 0) {
      return [id];
    }

    const references: IdentifierNode[] = [];
    for (const searchFile of searchFiles) {
      visitChildren(searchFile, function visit(node) {
        if (node.kind === SyntaxKind.Identifier) {
          const s = program.checker.resolveRelatedSymbols(node);
          if (!s || s.length <= 0) {
            return;
          }
          if (s[0] === sym[0] || (sym[0].type && s[0].type === sym[0].type)) {
            references.push(node);
          }
        }
        visitChildren(node, visit);
      });
    }
    return references;
  }

  async function getSemanticTokensForDocument(params: SemanticTokensParams) {
    if (isTspConfigFile(params.textDocument)) return [];

    const ast = await compileService.getScript(params.textDocument);
    if (!ast) {
      return [];
    }

    return getSemanticTokens(ast);
  }

  async function buildSemanticTokens(params: SemanticTokensParams): Promise<SemanticTokens> {
    if (isTspConfigFile(params.textDocument)) return { data: [] };

    const builder = new SemanticTokensBuilder();
    const tokens = await getSemanticTokensForDocument(params);
    const file = await compilerHost.readFile(await fileService.getPath(params.textDocument));
    const starts = file.getLineStarts();

    for (const token of tokens) {
      const start = file.getLineAndCharacterOfPosition(token.pos);
      const end = file.getLineAndCharacterOfPosition(token.end);

      for (let pos = token.pos, line = start.line; line <= end.line; line++) {
        const endPos = line === end.line ? token.end : starts[line + 1];
        const character = line === start.line ? start.character : 0;
        builder.push(line, character, endPos - pos, token.kind, 0);
        pos = endPos;
      }
    }

    return builder.build();
  }

  async function getCodeActions(params: CodeActionParams): Promise<CodeAction[]> {
    if (isTspConfigFile(params.textDocument)) return [];

    const actions = [];
    for (const vsDiag of params.context.diagnostics) {
      const tspDiag = currentDiagnosticIndex.get(vsDiag.data?.id);
      if (tspDiag === undefined || tspDiag.codefixes === undefined) continue;

      for (const fix of tspDiag.codefixes ?? []) {
        const codeAction: CodeAction = {
          ...CodeAction.create(
            fix.label,
            {
              title: fix.label,
              command: Commands.APPLY_CODE_FIX,
              arguments: [params.textDocument.uri, vsDiag.data?.id, fix.id],
            },
            CodeActionKind.QuickFix,
          ),
          diagnostics: [vsDiag],
        };
        actions.push(codeAction);
      }
    }

    return actions;
  }

  async function executeCommand(params: ExecuteCommandParams) {
    if (params.command === Commands.APPLY_CODE_FIX) {
      const [documentUri, diagId, fixId] = params.arguments ?? [];
      if (documentUri && diagId && fixId) {
        const diag = currentDiagnosticIndex.get(diagId);
        const codeFix = diag?.codefixes?.find((x) => x.id === fixId);
        if (codeFix) {
          const edits = await resolveCodeFix(codeFix);
          const vsEdits = convertCodeFixEdits(edits);
          await host.applyEdit({ changes: { [documentUri]: vsEdits } });
        }
      }
    }
  }
  function convertCodeFixEdits(edits: CodeFixEdit[]): TextEdit[] {
    return edits.map(convertCodeFixEdit);
  }
  function convertCodeFixEdit(edit: CodeFixEdit): TextEdit {
    switch (edit.kind) {
      case "insert-text":
        return TextEdit.insert(edit.file.getLineAndCharacterOfPosition(edit.pos), edit.text);
      case "replace-text":
        return TextEdit.replace(getRange(edit, edit.file), edit.text);
    }
  }

  function documentClosed(change: TextDocumentChangeEvent<TextDocument>) {
    // clear diagnostics on file close
    sendDiagnostics(change.document, []);
  }

  function getLocations(targets: readonly DiagnosticTarget[] | undefined): Location[] {
    return targets?.map(getLocation).filter((x): x is Location => !!x) ?? [];
  }

  function getLocation(target: DiagnosticTarget): Location | undefined {
    const location = getSourceLocation(target);
    if (location.isSynthetic) {
      return undefined;
    }

    return {
      uri: fileService.getURL(location.file.path),
      range: getRange(location, location.file),
    };
  }

  function getRange(location: TextRange, file: SourceFile): Range {
    const start = file.getLineAndCharacterOfPosition(location.pos);
    const end = file.getLineAndCharacterOfPosition(location.end);
    return Range.create(start, end);
  }

  function log(log: ServerLog) {
    if (!isInitialized) {
      pendingMessages.push(log);
      return;
    }

    for (const pending of pendingMessages) {
      host.log(pending);
    }

    pendingMessages = [];
    host.log(log);
  }

  function sendDiagnostics(document: TextDocument, diagnostics: VSDiagnostic[]) {
    host.sendDiagnostics({
      uri: document.uri,
      version: document.version,
      diagnostics,
    });
  }

  function createCompilerHost(): CompilerHost {
    const base = host.compilerHost;
    return {
      ...base,
      parseCache: new WeakMap(),
      readFile,
      stat,
      getSourceFileKind,
      logSink: {
        log: (log: ProcessedLog) => {
          const msg = formatLog(log, { excludeLogLevel: true });
          const sLog: ServerLog = {
            level: log.level,
            message: msg,
          };
          host.log(sLog);
        },
      },
    };

    async function readFile(path: string): Promise<ServerSourceFile> {
      const document = fileService.getOpenDocument(path);
      const cached = await fileSystemCache.get(path);

      // Try cache
      if (cached && (!document || document.version === cached.version)) {
        if (cached.type === "error") {
          throw cached.error;
        }
        return cached.file;
      }

      // Try open document, although this is cheap, the instance still needs
      // to be cached so that the compiler can reuse parse and bind results.
      if (document) {
        const file = {
          document,
          ...createSourceFile(document.getText(), path),
        };
        fileSystemCache.set(path, { type: "file", file, version: document.version });
        return file;
      }

      // Hit the disk and cache
      try {
        const file = await base.readFile(path);
        fileSystemCache.set(path, { type: "file", file });
        return file;
      } catch (error) {
        fileSystemCache.set(path, { type: "error", error });
        throw error;
      }
    }

    async function stat(path: string): Promise<{ isDirectory(): boolean; isFile(): boolean }> {
      // if we have an open document for the path or a cache entry, then we know
      // it's a file and not a directory and needn't hit the disk.
      if (fileService.getOpenDocument(path) || (await fileSystemCache.get(path))?.type === "file") {
        return {
          isFile() {
            return true;
          },
          isDirectory() {
            return false;
          },
        };
      }
      return await base.stat(path);
    }

    function getSourceFileKind(path: string) {
      const document = fileService.getOpenDocument(path);
      if (document?.languageId === "typespec") {
        return "typespec";
      }
      return getSourceFileKindFromExt(path);
    }
  }
}

type SignatureHelpNode =
  | DecoratorExpressionNode
  | AugmentDecoratorStatementNode
  | TypeReferenceNode;

function getSignatureHelpNodeAtPosition(
  script: TypeSpecScriptNode,
  position: number,
): { node: SignatureHelpNode; argumentIndex: number } | undefined {
  // Move back over any trailing trivia. Otherwise, if there is no
  // closing paren/angle bracket, we can find ourselves outside the desired
  // node altogether in cases like `@dec(test, |`.
  position = getPositionBeforeTrivia(script, position);

  const node = getNodeAtPosition<SignatureHelpNode>(
    script,
    position,
    (n): n is SignatureHelpNode => {
      switch (n.kind) {
        case SyntaxKind.DecoratorExpression:
        case SyntaxKind.AugmentDecoratorStatement:
        case SyntaxKind.TypeReference:
          // Do not consider node if positioned before the argument list.
          // This is the standard behavior for signature help and further
          // deals with nesting such as `Outer<Inner|> where we do not want
          // we want help with the `Outer` arguments, not the `Inner` ones.
          if (position <= n.target.end) {
            return false;
          }

          // Likewise, no signature help at the end of argument list unless the
          // it has no closing paren/angle bracket.
          if (position === n.end) {
            const endChar = script.file.text.charCodeAt(position - 1);
            const closeChar =
              n.kind === SyntaxKind.TypeReference ? CharCode.GreaterThan : CharCode.CloseParen;
            if (endChar === closeChar) {
              return false;
            }
          }
          return true;
        default:
          return false;
      }
    },
  );

  if (!node) {
    return undefined;
  }

  const argumentIndex = getSignatureHelpArgumentIndex(script, node, position);
  if (argumentIndex < 0) {
    return undefined;
  }

  return { node, argumentIndex };
}

function getSignatureHelpArgumentIndex(
  script: TypeSpecScriptNode,
  node: SignatureHelpNode,
  position: number,
) {
  // Normalize arguments into a single list to avoid special case for
  // augment decorators.
  const args =
    node.kind === SyntaxKind.AugmentDecoratorStatement
      ? [node.targetType, ...node.arguments]
      : node.arguments;

  // Find the first argument that ends after the position. We don't look at
  // the argument start position since the cursor might be in leading
  // trivia, and we skip trivia to get the effective argument end position
  // since the cursor might be in trailing trivia.
  for (let i = 0; i < args.length; i++) {
    if (position <= skipTrivia(script.file.text, args[i].end)) {
      return i;
    }
  }

  // If we reach here, we must be at the next argument after any that are in
  // the syntax tree. There won't be a missing identifier for this argument
  // in the tree since the parser error recovery will have assumed a
  // trailing delimiter or empty list.
  return args.length;
}

/**
 * Resolve the node that should be auto completed at the given position.
 * It will try to guess what node it could be as during auto complete the ast might not be complete.
 * @internal
 */
export function getCompletionNodeAtPosition(
  script: TypeSpecScriptNode,
  position: number,
  filter: (node: Node) => boolean = (node: Node) => true,
): PositionDetail {
  return getNodeAtPositionDetail(script, position, filter);
}
