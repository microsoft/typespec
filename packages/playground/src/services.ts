import {
  createScanner,
  createServer,
  createSourceFile,
  ServerHost,
  Token,
} from "@cadl-lang/compiler";
import * as monaco from "monaco-editor";
import { TextDocument } from "vscode-languageserver-textdocument";
import { BrowserHost } from "./browserHost";
import "./style.css";

export function attachServices(host: BrowserHost) {
  monaco.languages.register({ id: "cadl" });

  const serverHost: ServerHost = {
    compilerHost: host,
    getDocumentByURL(url: string) {
      const model = monaco.editor.getModel(monaco.Uri.parse(url));
      if (model) {
        return TextDocument.create(url, "cadl", 1, model.getValue());
      }

      return undefined;
    },
    sendDiagnostics() {},
    // eslint-disable-next-line no-console
    log: console.log,
  };
  const serverLib = createServer(serverHost);
  function textDocumentForModel(model: monaco.editor.IModel) {
    return TextDocument.create(model.uri.toString(), "cadl", 1, model.getValue());
  }

  monaco.languages.registerDefinitionProvider("cadl", {
    async provideDefinition(model, position) {
      const result = await serverLib.gotoDefinition({
        position: {
          line: position.lineNumber - 1,
          character: position.column - 1,
        },
        textDocument: textDocumentForModel(model),
      });

      if (!result) return;

      const loc: monaco.languages.Location = {
        uri: monaco.Uri.parse(result.uri),
        range: {
          startColumn: result.range.start.character + 1,
          startLineNumber: result.range.start.line + 1,
          endColumn: result.range.end.character + 1,
          endLineNumber: result.range.end.line + 1,
        },
      };

      return loc;
    },
  });

  const lsConfig = serverLib.initialize({
    capabilities: {},
    processId: 1,
    workspaceFolders: [],
    rootUri: "inmemory://",
  });
  serverLib.initialized(lsConfig);

  monaco.languages.registerCompletionItemProvider("cadl", {
    triggerCharacters: lsConfig.capabilities.completionProvider!.triggerCharacters,
    async provideCompletionItems(model, position) {
      const result = await serverLib.complete({
        position: {
          line: position.lineNumber - 1,
          character: position.column - 1,
        },
        textDocument: textDocumentForModel(model),
      });
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
        });
      }

      return { suggestions };
    },
  });

  const tokenTypes = [
    "comment",
    "string",
    "number",
    "keyword",
    "namespace",
    "variable",
    "type",
    "function",
    "operator",
    "source",
  ];

  function mapToken(tok: Token) {
    switch (tok) {
      case Token.SingleLineComment:
      case Token.MultiLineComment:
        return 0;
      case Token.StringLiteral:
        return 1;
      case Token.NumericLiteral:
        return 2;
      case Token.TrueKeyword:
      case Token.FalseKeyword:
      case Token.IfKeyword:
      case Token.IsKeyword:
      case Token.AliasKeyword:
      case Token.OpKeyword:
      case Token.ElseKeyword:
      case Token.EnumKeyword:
      case Token.VoidKeyword:
      case Token.ModelKeyword:
      case Token.NeverKeyword:
      case Token.UnionKeyword:
      case Token.UsingKeyword:
      case Token.ImportKeyword:
      case Token.ReturnKeyword:
      case Token.ExtendsKeyword:
      case Token.InterfaceKeyword:
      case Token.NamespaceKeyword:
      case Token.ProjectionKeyword:
        return 3;
      default:
        return 9;
    }
  }
  monaco.languages.registerDocumentSemanticTokensProvider("cadl", {
    getLegend() {
      return {
        tokenTypes,
        tokenModifiers: [],
      };
    },
    provideDocumentSemanticTokens(model) {
      const content = model.getValue();
      const file = createSourceFile(content, "");
      const scanner = createScanner(file, () => {});
      const tokens = [];
      let prevLine = 0;
      let prevChar = 0;

      let tok = scanner.scan();
      while (tok !== Token.EndOfFile) {
        const pos = file.getLineAndCharacterOfPosition(scanner.tokenPosition);

        tokens.push(
          pos.line - prevLine,
          prevLine === pos.line ? pos.character - prevChar : pos.character,
          scanner.position - scanner.tokenPosition,
          mapToken(tok),
          0
        );
        prevLine = pos.line;
        prevChar = pos.character;

        tok = scanner.scan();
      }

      return {
        data: new Uint32Array(tokens),
      };
    },
    releaseDocumentSemanticTokens() {},
  });
}
