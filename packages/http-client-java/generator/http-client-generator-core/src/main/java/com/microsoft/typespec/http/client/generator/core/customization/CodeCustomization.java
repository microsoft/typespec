// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.customization;

import com.microsoft.typespec.http.client.generator.core.customization.implementation.ls.EclipseLanguageClient;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import org.eclipse.lsp4j.SymbolInformation;

/**
 * Base interface for all code based customizations.
 */
public interface CodeCustomization {

    /**
     * The Editor managing the state of the CodeCustomization.
     *
     * @return The Editor.
     */
    Editor getEditor();

    /**
     * The EclipseLanguageClient managing validation of the CodeCustomization.
     * <p>
     * If {@link JavaSettings#isUseEclipseLanguageServer()} returns true, an {@link EclipseLanguageClient} instance will
     * be returned, otherwise this returns null.
     *
     * @return The EclipseLanguageClient.
     */
    EclipseLanguageClient getLanguageClient();

    /**
     * The SymbolInformation managing information about the CodeCustomization.
     * <p>
     * If {@link JavaSettings#isUseEclipseLanguageServer()} returns true, a {@link SymbolInformation} instance will be
     * returned, otherwise this returns null.
     *
     * @return The SymbolInformation.
     */
    SymbolInformation getSymbol();

    /**
     * The URI of the file containing where the code for the CodeCustomization exists.
     *
     * @return The URI of the file.
     */
    String getFileUri();

    /**
     * The name of the file containing where the code for the CodeCustomization exists.
     *
     * @return The name of the file.
     */
    String getFileName();
}
