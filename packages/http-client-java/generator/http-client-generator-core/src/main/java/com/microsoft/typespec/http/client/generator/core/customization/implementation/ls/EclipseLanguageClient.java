// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.customization.implementation.ls;

import com.microsoft.typespec.http.client.generator.core.customization.implementation.ls.models.JavaCodeActionKind;
import com.microsoft.typespec.http.client.generator.core.extension.jsonrpc.Connection;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import org.eclipse.lsp4j.ClientCapabilities;
import org.eclipse.lsp4j.CodeAction;
import org.eclipse.lsp4j.CodeActionCapabilities;
import org.eclipse.lsp4j.CodeActionContext;
import org.eclipse.lsp4j.CodeActionKind;
import org.eclipse.lsp4j.CodeActionKindCapabilities;
import org.eclipse.lsp4j.CodeActionLiteralSupportCapabilities;
import org.eclipse.lsp4j.CodeActionParams;
import org.eclipse.lsp4j.DidChangeWatchedFilesParams;
import org.eclipse.lsp4j.DocumentSymbolParams;
import org.eclipse.lsp4j.FileEvent;
import org.eclipse.lsp4j.InitializeParams;
import org.eclipse.lsp4j.InitializeResult;
import org.eclipse.lsp4j.Position;
import org.eclipse.lsp4j.Range;
import org.eclipse.lsp4j.RenameParams;
import org.eclipse.lsp4j.ShowDocumentCapabilities;
import org.eclipse.lsp4j.SymbolCapabilities;
import org.eclipse.lsp4j.SymbolInformation;
import org.eclipse.lsp4j.SymbolKind;
import org.eclipse.lsp4j.SymbolKindCapabilities;
import org.eclipse.lsp4j.TextDocumentClientCapabilities;
import org.eclipse.lsp4j.TextDocumentIdentifier;
import org.eclipse.lsp4j.TextEdit;
import org.eclipse.lsp4j.WindowClientCapabilities;
import org.eclipse.lsp4j.WindowShowMessageRequestActionItemCapabilities;
import org.eclipse.lsp4j.WindowShowMessageRequestCapabilities;
import org.eclipse.lsp4j.WorkspaceClientCapabilities;
import org.eclipse.lsp4j.WorkspaceEdit;
import org.eclipse.lsp4j.WorkspaceFolder;
import org.eclipse.lsp4j.WorkspaceSymbolParams;
import org.eclipse.lsp4j.jsonrpc.json.MessageJsonHandler;
import org.slf4j.Logger;

import java.io.File;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.EnumSet;
import java.util.List;

public class EclipseLanguageClient implements AutoCloseable {
    private static final Gson GSON = new MessageJsonHandler(null).getDefaultGsonBuilder().create();

    private static final Type LIST_SYMBOL_INFORMATION = createParameterizedType(List.class, SymbolInformation.class);
    private static final Type LIST_CODE_ACTION = createParameterizedType(List.class, CodeAction.class);

    private final EclipseLanguageServerFacade server;
    private final Connection connection;
    private final String workspaceDir;

    public EclipseLanguageClient(String pathToLanguageServerPlugin, String workspaceDir, Logger logger) {
        try {
            this.workspaceDir = new File(workspaceDir).toURI().toString();
            this.server = new EclipseLanguageServerFacade(pathToLanguageServerPlugin, logger);
            this.connection = new Connection(server.getOutputStream(), server.getInputStream());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        if (!server.isAlive()) {
            server.shutdown();
            logger.error("Language server failed to start: " + server.getServerError());
            throw new RuntimeException("Language server failed to start: " + server.getServerError());
        }
    }

    public void initialize() {
        int pid = (int) ProcessHandle.current().pid();

        InitializeParams initializeParams = new InitializeParams();
        initializeParams.setProcessId(pid);
        initializeParams.setRootUri(workspaceDir);
        initializeParams.setWorkspaceFolders(new ArrayList<>());
        WorkspaceFolder workspaceFolder = new WorkspaceFolder();
        workspaceFolder.setName("root");
        workspaceFolder.setUri(workspaceDir);
        initializeParams.getWorkspaceFolders().add(workspaceFolder);
        initializeParams.setTrace("message");
        initializeParams.setCapabilities(new ClientCapabilities());

        // Configure window capabilities to disable everything as the server is run in headless mode.
        WindowClientCapabilities windowClientCapabilities = new WindowClientCapabilities();
        windowClientCapabilities.setWorkDoneProgress(false);
        windowClientCapabilities.setShowDocument(new ShowDocumentCapabilities(false));
        windowClientCapabilities.setShowMessage(new WindowShowMessageRequestCapabilities());
        windowClientCapabilities.getShowMessage().setMessageActionItem(new WindowShowMessageRequestActionItemCapabilities(false));
        initializeParams.getCapabilities().setWindow(windowClientCapabilities);

        // Configure workspace capabilities to support workspace folders and all symbol kinds.
        WorkspaceClientCapabilities workspaceClientCapabilities = new WorkspaceClientCapabilities();
        workspaceClientCapabilities.setWorkspaceFolders(true);
        workspaceClientCapabilities.setSymbol(new SymbolCapabilities(
            new SymbolKindCapabilities(Arrays.asList(SymbolKind.values())), false));

        // Configure text document capabilities to support code actions and all code action kinds.
        List<String> supportedCodeActions = new ArrayList<>(Arrays.asList(CodeActionKind.QuickFix,
            CodeActionKind.Refactor, CodeActionKind.RefactorExtract, CodeActionKind.RefactorInline,
            CodeActionKind.RefactorRewrite, CodeActionKind.Source, CodeActionKind.SourceOrganizeImports));
        EnumSet.allOf(JavaCodeActionKind.class)
            .forEach(javaCodeActionKind -> supportedCodeActions.add(javaCodeActionKind.toString()));
        TextDocumentClientCapabilities textDocumentClientCapabilities = new TextDocumentClientCapabilities();
        textDocumentClientCapabilities.setCodeAction(new CodeActionCapabilities(
            new CodeActionLiteralSupportCapabilities(new CodeActionKindCapabilities(supportedCodeActions)), false));
        initializeParams.getCapabilities().setTextDocument(textDocumentClientCapabilities);

        sendRequest(connection, "initialize", initializeParams, InitializeResult.class);
        connection.notifyWithSerializedObject("initialized", "null");
        try {
            Thread.sleep(2500);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    public void notifyWatchedFilesChanged(List<FileEvent> changes) {
        if (changes == null || changes.isEmpty()) {
            return;
        }

        DidChangeWatchedFilesParams params = new DidChangeWatchedFilesParams(changes);
        connection.notifyWithSerializedObject("workspace/didChangeWatchedFiles", GSON.toJson(params));
        try {
            // Wait for a moment as notify requests don't have a response. So, they're effectively fire and forget,
            // which can result in some race conditions with customizations.
            Thread.sleep(100);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    public List<SymbolInformation> findWorkspaceSymbol(String query) {
        WorkspaceSymbolParams workspaceSymbolParams = new WorkspaceSymbolParams();
        workspaceSymbolParams.setQuery(query);

        return sendRequest(connection, "workspace/symbol", workspaceSymbolParams, LIST_SYMBOL_INFORMATION);
    }

    public List<SymbolInformation> listDocumentSymbols(String fileUri) {
        DocumentSymbolParams documentSymbolParams = new DocumentSymbolParams();
        documentSymbolParams.setTextDocument(new TextDocumentIdentifier(fileUri));

        return sendRequest(connection, "textDocument/documentSymbol", documentSymbolParams, LIST_SYMBOL_INFORMATION);
    }

    public WorkspaceEdit renameSymbol(String fileUri, Position symbolPosition, String newName) {
        RenameParams renameParams = new RenameParams();
        renameParams.setTextDocument(new TextDocumentIdentifier(fileUri));
        renameParams.setPosition(symbolPosition);
        renameParams.setNewName(newName);

        return replaceTabsWithSpaces(sendRequest(connection, "textDocument/rename", renameParams, WorkspaceEdit.class));
    }

    public List<CodeAction> listCodeActions(String fileUri, Range range, String codeActionKind) {
        CodeActionContext context = new CodeActionContext(Collections.emptyList());
        context.setOnly(Collections.singletonList(codeActionKind));
        CodeActionParams codeActionParams = new CodeActionParams(new TextDocumentIdentifier(fileUri), range, context);

        List<CodeAction> codeActions = sendRequest(connection, "textDocument/codeAction", codeActionParams, LIST_CODE_ACTION);
        for (CodeAction codeAction : codeActions) {
            if (codeAction.getEdit() != null) {
                continue;
            }

            if ("java.apply.workspaceEdit".equals(codeAction.getCommand().getCommand())) {
                codeAction.setEdit(replaceTabsWithSpaces(
                    GSON.fromJson((JsonObject) codeAction.getCommand().getArguments().get(0), WorkspaceEdit.class)));
            }
        }

        return codeActions;
    }

    private WorkspaceEdit replaceTabsWithSpaces(WorkspaceEdit workspaceEdit) {
        if (workspaceEdit.getChanges() == null) {
            return workspaceEdit;
        }

        for (List<TextEdit> textEdits : workspaceEdit.getChanges().values()) {
            for (TextEdit textEdit : textEdits) {
                textEdit.setNewText(textEdit.getNewText().replace("\t", "    "));
            }
        }

        return workspaceEdit;
    }

    public void close() {
        try {
            connection.request("shutdown");
            connection.notifyWithSerializedObject("exit", "null");
            connection.stop();
            server.shutdown();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private static <T> T sendRequest(Connection connection, String method, Object param, Type responseType) {
        return GSON.fromJson(connection.requestWithSerializedObject(method, GSON.toJson(param)), responseType);
    }

    private static Type createParameterizedType(Type rawType, Type... typeArguments) {
        return new ParameterizedType() {
            @Override
            public Type[] getActualTypeArguments() {
                return typeArguments;
            }

            @Override
            public Type getRawType() {
                return rawType;
            }

            @Override
            public Type getOwnerType() {
                return null;
            }
        };
    }
}
