import { CadlLanguageConfiguration, ServerHost } from "@cadl-lang/compiler";
import * as monaco from "monaco-editor";
import * as lsp from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { BrowserHost } from "./browser-host";
import { importCadlCompiler } from "./core";
import "./style.css";

function getIndentAction(
  value: "none" | "indent" | "indentOutdent" | "outdent"
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
function getCadlLanguageConfiguration(): monaco.languages.LanguageConfiguration {
  return {
    ...(CadlLanguageConfiguration as any),
    onEnterRules: CadlLanguageConfiguration.onEnterRules.map((rule) => {
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

export async function attachServices(host: BrowserHost) {
  monaco.languages.register({ id: "cadl" });
  monaco.languages.setLanguageConfiguration("cadl", getCadlLanguageConfiguration());

  const serverHost: ServerHost = {
    compilerHost: host,
    getOpenDocumentByURL(url: string) {
      const model = monaco.editor.getModel(monaco.Uri.parse(url));
      return model ? textDocumentForModel(model) : undefined;
    },
    sendDiagnostics() {},
    // eslint-disable-next-line no-console
    log: console.log,
  };

  const { createServer } = await importCadlCompiler();
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
      "cadl",
      model.getVersionId(),
      model.getValue()
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

  function monacoLocation(loc: lsp.Location): monaco.languages.Location {
    return {
      uri: monaco.Uri.parse(loc.uri),
      range: monacoRange(loc.range),
    };
  }

  function monacoDocumentHighlight(
    highlight: lsp.DocumentHighlight
  ): monaco.languages.DocumentHighlight {
    return {
      range: monacoRange(highlight.range),
      kind: highlight.kind,
    };
  }

  function monacoRange(range: lsp.Range): monaco.IRange {
    return {
      startColumn: range.start.character + 1,
      startLineNumber: range.start.line + 1,
      endColumn: range.end.character + 1,
      endLineNumber: range.end.line + 1,
    };
  }

  function monacoFoldingRange(range: lsp.FoldingRange): monaco.languages.FoldingRange {
    return {
      start: range.startLine + 1,
      end: range.endLine + 1,
      kind: range.kind ? new monaco.languages.FoldingRangeKind(range.kind) : undefined,
    };
  }

  function monacoTextEdit(edit: lsp.TextEdit): monaco.languages.TextEdit {
    return {
      range: monacoRange(edit.range),
      text: edit.newText,
    };
  }

  function monacoWorkspaceEdit(edit: lsp.WorkspaceEdit): monaco.languages.WorkspaceEdit {
    const edits: monaco.languages.WorkspaceTextEdit[] = [];
    for (const [uri, changes] of Object.entries(edit.changes ?? {})) {
      const resource = monaco.Uri.parse(uri);
      for (const change of changes) {
        edits.push({ resource, edit: monacoTextEdit(change) });
      }
    }
    return { edits };
  }

  monaco.languages.registerDefinitionProvider("cadl", {
    async provideDefinition(model, position) {
      const results = await serverLib.gotoDefinition(lspArgs(model, position));
      return results.map(monacoLocation);
    },
  });

  monaco.languages.registerReferenceProvider("cadl", {
    async provideReferences(model, position, context) {
      const results = await serverLib.findReferences({ ...lspArgs(model, position), context });
      return results.map(monacoLocation);
    },
  });

  monaco.languages.registerRenameProvider("cadl", {
    async resolveRenameLocation(model, position): Promise<monaco.languages.RenameLocation> {
      const result = await serverLib.prepareRename(lspArgs(model, position));
      if (!result) {
        throw new Error("This element can't be renamed.");
      }
      const text = model.getWordAtPosition(position)?.word;
      if (!text) {
        throw new Error("Failed to obtain word at position.");
      }
      return { text, range: monacoRange(result) };
    },

    async provideRenameEdits(model, position, newName) {
      const result = await serverLib.rename({ ...lspArgs(model, position), newName });
      return monacoWorkspaceEdit(result);
    },
  });

  monaco.languages.registerFoldingRangeProvider("cadl", {
    async provideFoldingRanges(model) {
      const ranges = await serverLib.getFoldingRanges(lspDocumentArgs(model));
      const output = ranges.map(monacoFoldingRange);
      return output;
    },
  });

  monaco.languages.registerDocumentHighlightProvider("cadl", {
    async provideDocumentHighlights(model, position) {
      const highlights = await serverLib.findDocumentHighlight(lspArgs(model, position));
      return highlights.map(monacoDocumentHighlight);
    },
  });

  monaco.languages.registerCompletionItemProvider("cadl", {
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
        suggestions.push({
          label: item.label,
          kind: item.kind as any,
          documentation: item.documentation,
          insertText: item.insertText!,
          range,
          commitCharacters:
            item.commitCharacters ?? lsConfig.capabilities.completionProvider!.allCommitCharacters,
          tags: item.tags,
        });
      }

      return { suggestions };
    },
  });

  monaco.editor.defineTheme("cadl", {
    base: "vs",
    inherit: true,
    colors: {},
    rules: [
      { token: "macro", foreground: "#800000" },
      { token: "function", foreground: "#795E26" },
    ],
  });
  monaco.editor.setTheme("cadl");

  monaco.languages.registerDocumentSemanticTokensProvider("cadl", {
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
