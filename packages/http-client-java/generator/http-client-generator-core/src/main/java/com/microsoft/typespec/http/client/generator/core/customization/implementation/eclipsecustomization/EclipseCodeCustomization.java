// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.customization.implementation.eclipsecustomization;

import com.microsoft.typespec.http.client.generator.core.customization.CodeCustomization;
import com.microsoft.typespec.http.client.generator.core.customization.Editor;
import com.microsoft.typespec.http.client.generator.core.customization.implementation.ls.EclipseLanguageClient;
import org.eclipse.lsp4j.SymbolInformation;

/**
 * Base class for all code based customizations.
 */
public abstract class EclipseCodeCustomization implements CodeCustomization {
    final Editor editor;
    final EclipseLanguageClient languageClient;
    final SymbolInformation symbol;
    final String fileUri;
    final String fileName;

    @SuppressWarnings("deprecation")
    EclipseCodeCustomization(Editor editor, EclipseLanguageClient languageClient, SymbolInformation symbol) {
        this.editor = editor;
        this.languageClient = languageClient;
        this.symbol = symbol;
        this.fileUri = symbol.getLocation().getUri();
        this.fileName = fileUri.substring(fileUri.indexOf("src/main/java/"));
    }

    @Override
    public final Editor getEditor() {
        return editor;
    }

    @Override
    public final EclipseLanguageClient getLanguageClient() {
        return languageClient;
    }

    @Override
    public final SymbolInformation getSymbol() {
        return symbol;
    }

    @Override
    public final String getFileUri() {
        return fileUri;
    }

    @Override
    public final String getFileName() {
        return fileName;
    }
}
