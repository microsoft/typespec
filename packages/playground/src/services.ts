import {
  TypeSpecLanguageConfiguration,
  type DiagnosticTarget,
  type NoTarget,
  type ServerHost,
} from "@typespec/compiler";
import * as monaco from "monaco-editor";
import * as lsp from "vscode-languageserver";
import { DocumentHighlightKind, FormattingOptions } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { LspToMonaco } from "./lsp/lsp-to-monaco.js";
import type { BrowserHost } from "./types.js";

function getIndentAction(
  value: "none" | "indent" | "indentOutdent" | "outdent",
): monaco.languages.IndentAction {
  switch (value) {
    case "none":
      return monaco.languages.IndentAction.None;
    case "indent":
      return monaco.languages.IndentAction.Indent;
    case "indentOutdent":
      return monaco.languages.IndentAction.IndentOutdent;
    case "outdent":
      return monaco.languages.IndentAction.Outdent;
  }
}

function getTypeSpecLanguageConfiguration(): monaco.languages.LanguageConfiguration {
  return {
    ...(TypeSpecLanguageConfiguration as any),
    onEnterRules: TypeSpecLanguageConfiguration.onEnterRules.map((rule) => {
      return {
        beforeText: new RegExp(rule.beforeText.pattern),
        previousLineText:
          "previousLineText" in rule ? new RegExp(rule.previousLineText.pattern) : undefined,
        action: {
          indentAction: getIndentAction(rule.action.indent),
          appendText: "appendText" in rule.action ? rule.action.appendText : undefined,
          removeText: "removeText" in rule.action ? rule.action.removeText : undefined,
        },
      };
    }),
  };
}

export async function registerMonacoLanguage(host: BrowserHost) {
  if (monaco.languages.getLanguages().some((x) => x.id === "typespec")) {
    return;
  }
  monaco.languages.register({ id: "typespec", extensions: [".tsp"] });
  monaco.languages.setLanguageConfiguration("typespec", getTypeSpecLanguageConfiguration());

  const serverHost: ServerHost = {
    compilerHost: host,
    getOpenDocumentByURL(url: string) {
      const model = monaco.editor.getModel(monaco.Uri.parse(url));
      return model ? textDocumentForModel(model) : undefined;
    },
    sendDiagnostics() {},
    log: (log) => {
      switch (log.level) {
        case "error":
          // eslint-disable-next-line no-console
          console.error(log);
          break;
        case "warning":
          // eslint-disable-next-line no-console
          console.warn(log);
          break;
        case "info":
          // eslint-disable-next-line no-console
          console.info(log);
          break;
        case "debug":
          // corresponding to Verbose LogLevel in Edge/Chrome which is off by default
          // eslint-disable-next-line no-console
          console.debug(log);
          break;
        case "trace":
        default:
          // just skip traces in playground
          break;
      }
    },
    applyEdit(param) {
      return Promise.resolve({ applied: false });
    },
  };

  const { createServer } = host.compiler;
  const serverLib = createServer(serverHost);
  const lsConfig = await serverLib.initialize({
    capabilities: {},
    processId: 1,
    workspaceFolders: [],
    rootUri: "inmemory://",
  });
  serverLib.initialized({});

  function textDocumentForModel(model: monaco.editor.IModel) {
    return TextDocument.create(
      model.uri.toString(),
      "typespec",
      model.getVersionId(),
      model.getValue(),
    );
  }

  function lspDocumentArgs(model: monaco.editor.ITextModel) {
    return {
      textDocument: textDocumentForModel(model),
    };
  }

  function lspArgs(model: monaco.editor.ITextModel, pos: monaco.Position) {
    return {
      ...lspDocumentArgs(model),
      position: lspPosition(pos),
    };
  }

  function lspPosition(pos: monaco.Position): lsp.Position {
    return {
      line: pos.lineNumber - 1,
      character: pos.column - 1,
    };
  }

  function lspFormattingOptions(options: monaco.languages.FormattingOptions) {
    return FormattingOptions.create(options.tabSize, options.insertSpaces);
  }

  function monacoLocation(loc: lsp.Location): monaco.languages.Location {
    return {
      uri: monaco.Uri.parse(loc.uri),
      range: LspToMonaco.range(loc.range),
    };
  }

  function monacoDocumentHighlight(
    highlight: lsp.DocumentHighlight,
  ): monaco.languages.DocumentHighlight {
    return {
      range: LspToMonaco.range(highlight.range),
      kind: monacoDocumentHighlightKind(highlight.kind),
    };
  }

  function monacoDocumentHighlightKind(kind: DocumentHighlightKind | undefined) {
    switch (kind) {
      case DocumentHighlightKind.Text:
        return monaco.languages.DocumentHighlightKind.Text;
      case DocumentHighlightKind.Read:
        return monaco.languages.DocumentHighlightKind.Read;
      case DocumentHighlightKind.Write:
        return monaco.languages.DocumentHighlightKind.Write;
      default:
        return undefined;
    }
  }

  function monacoHoverContents(contents: lsp.MarkupContent): monaco.IMarkdownString[] {
    return [{ value: contents.value }];
  }

  function monacoHover(hover: lsp.Hover): monaco.languages.Hover {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    if (Array.isArray(hover.contents) || lsp.MarkedString.is(hover.contents)) {
      throw new Error("MarkedString (deprecated) not supported.");
    }

    return {
      contents: monacoHoverContents(hover.contents),
      range: hover.range ? LspToMonaco.range(hover.range) : undefined,
    };
  }

  function monacoWorkspaceEdit(edit: lsp.WorkspaceEdit): monaco.languages.WorkspaceEdit {
    const edits: monaco.languages.IWorkspaceTextEdit[] = [];
    for (const [uri, changes] of Object.entries(edit.changes ?? {})) {
      const resource = monaco.Uri.parse(uri);
      for (const change of changes) {
        edits.push({ resource, textEdit: LspToMonaco.textEdit(change), versionId: undefined });
      }
    }
    return { edits };
  }

  monaco.languages.registerDefinitionProvider("typespec", {
    async provideDefinition(model, position) {
      const results = await serverLib.gotoDefinition(lspArgs(model, position));
      return results.map(monacoLocation);
    },
  });

  monaco.languages.registerReferenceProvider("typespec", {
    async provideReferences(model, position, context) {
      const results = await serverLib.findReferences({ ...lspArgs(model, position), context });
      return results.map(monacoLocation);
    },
  });

  monaco.languages.registerRenameProvider("typespec", {
    async resolveRenameLocation(model, position): Promise<monaco.languages.RenameLocation> {
      const result = await serverLib.prepareRename(lspArgs(model, position));
      if (!result) {
        throw new Error("This element can't be renamed.");
      }
      const text = model.getWordAtPosition(position)?.word;
      if (!text) {
        throw new Error("Failed to obtain word at position.");
      }
      return { text, range: LspToMonaco.range(result) };
    },

    async provideRenameEdits(model, position, newName) {
      const result = await serverLib.rename({ ...lspArgs(model, position), newName });
      return monacoWorkspaceEdit(result);
    },
  });

  monaco.languages.registerFoldingRangeProvider("typespec", {
    async provideFoldingRanges(model) {
      const ranges = await serverLib.getFoldingRanges(lspDocumentArgs(model));
      const output = ranges.map(LspToMonaco.foldingRange);
      return output;
    },
  });

  monaco.languages.registerHoverProvider("typespec", {
    async provideHover(model, position) {
      const hover = await serverLib.getHover(lspArgs(model, position));
      return monacoHover(hover);
    },
  });

  monaco.languages.registerSignatureHelpProvider("typespec", {
    signatureHelpTriggerCharacters: ["(", ",", "<"],
    signatureHelpRetriggerCharacters: [")"],
    async provideSignatureHelp(model, position) {
      const help = await serverLib.getSignatureHelp(lspArgs(model, position));
      return { value: LspToMonaco.signatureHelp(help), dispose: () => {} };
    },
  });

  monaco.languages.registerDocumentFormattingEditProvider("typespec", {
    async provideDocumentFormattingEdits(model, options, token) {
      const edits = await serverLib.formatDocument({
        ...lspDocumentArgs(model),
        options: lspFormattingOptions(options),
      });
      return LspToMonaco.textEdits(edits);
    },
  });

  monaco.languages.registerDocumentHighlightProvider("typespec", {
    async provideDocumentHighlights(model, position) {
      const highlights = await serverLib.findDocumentHighlight(lspArgs(model, position));
      return highlights.map(monacoDocumentHighlight);
    },
  });

  monaco.languages.registerCompletionItemProvider("typespec", {
    triggerCharacters: lsConfig.capabilities.completionProvider!.triggerCharacters,
    async provideCompletionItems(model, position) {
      const result = await serverLib.complete(lspArgs(model, position));
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const suggestions: monaco.languages.CompletionItem[] = [];
      for (const item of result.items) {
        let itemRange = range;
        let insertText = item.insertText ?? item.label;
        if (item.textEdit && "range" in item.textEdit) {
          itemRange = LspToMonaco.range(item.textEdit.range);
          insertText = item.textEdit.newText;
        }
        suggestions.push({
          label: item.label,
          kind: item.kind as any,
          documentation: item.documentation,
          insertText,
          range: itemRange,
          commitCharacters:
            item.commitCharacters ?? lsConfig.capabilities.completionProvider!.allCommitCharacters,
          tags: item.tags,
        });
      }

      return { suggestions };
    },
  });

  // This doesn't actually work because the lsp is not aware of the diagnostics here as we make our own compilation in the playground.
  // monaco.languages.registerCodeActionProvider("typespec", {
  //   async provideCodeActions(model, range, context, token) {
  //     const result = await serverLib.getCodeActions({
  //       range: MonacoToLsp.range(range),
  //       context: MonacoToLsp.codeActionContext(context),
  //       textDocument: textDocumentForModel(model),
  //     });
  //     return { actions: result.map(LspToMonaco.codeAction), dispose: () => {} };
  //   },
  // });

  monaco.editor.defineTheme("typespec", {
    base: "vs",
    inherit: true,
    colors: {},
    rules: [
      { token: "macro", foreground: "#800000" },
      { token: "function", foreground: "#795E26" },
    ],
  });
  monaco.editor.defineTheme("typespec-dark", {
    base: "vs-dark",
    inherit: true,
    colors: {},
    rules: [
      { token: "macro", foreground: "#E06C75" },
      { token: "function", foreground: "#E06C75" },
    ],
  });
  monaco.editor.setTheme("typespec");

  monaco.languages.registerDocumentSemanticTokensProvider("typespec", {
    getLegend() {
      const legend = lsConfig.capabilities.semanticTokensProvider!.legend;
      return {
        tokenModifiers: legend.tokenModifiers,
        tokenTypes: legend.tokenTypes.map((entry) => {
          switch (entry) {
            case "namespace":
            case "class":
            case "enum":
            case "typeParameter":
            case "struct":
            case "interface":
              return "type";
            case "property":
            case "enumMember":
              return "variable";
            case "docCommentTag":
              return "keyword";
            default:
              return entry;
          }
        }),
      };
    },
    async provideDocumentSemanticTokens(model) {
      const result = await serverLib.buildSemanticTokens(lspDocumentArgs(model));
      return {
        resultId: result.resultId,
        data: new Uint32Array(result.data),
      };
    },
    releaseDocumentSemanticTokens() {},
  });
}

export function getMonacoRange(
  typespecCompiler: typeof import("@typespec/compiler"),
  target: DiagnosticTarget | typeof NoTarget,
): monaco.IRange {
  const loc = typespecCompiler.getSourceLocation(target);
  if (loc === undefined || loc.file.path !== "/test/main.tsp") {
    return {
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 1,
      endColumn: 1,
    };
  }
  const start = loc.file.getLineAndCharacterOfPosition(loc.pos);
  const end = loc.file.getLineAndCharacterOfPosition(loc.end);
  return {
    startLineNumber: start.line + 1,
    startColumn: start.character + 1,
    endLineNumber: end.line + 1,
    endColumn: end.character + 1,
  };
}
