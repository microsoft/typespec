// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
package com.microsoft.typespec.http.client.generator.core.customization.implementation.eclipsecustomization;

import com.microsoft.typespec.http.client.generator.core.customization.Editor;
import com.microsoft.typespec.http.client.generator.core.customization.LibraryCustomization;
import com.microsoft.typespec.http.client.generator.core.customization.implementation.Utils;
import com.microsoft.typespec.http.client.generator.core.customization.implementation.ls.EclipseLanguageClient;
import java.util.Optional;
import org.eclipse.lsp4j.SymbolInformation;

/**
 * Implementation of {@link LibraryCustomization} that uses the Eclipse Language Server for customizations.
 */
public final class EclipseLibraryCustomization implements LibraryCustomization {
    private final Editor editor;
    private final EclipseLanguageClient languageClient;

    public EclipseLibraryCustomization(Editor editor, EclipseLanguageClient languageClient) {
        this.editor = editor;
        this.languageClient = languageClient;
    }

    @Override
    public EclipsePackageCustomization getPackage(String packageName) {
        return new EclipsePackageCustomization(editor, languageClient, packageName);
    }

    @SuppressWarnings("deprecation")
    @Override
    public EclipseClassCustomization getClass(String packageName, String className) {
        String packagePath = packageName.replace(".", "/");
        Optional<SymbolInformation> classSymbol = languageClient.findWorkspaceSymbol(className)
            .stream()
            // findWorkspace symbol finds all classes that contain the classname term
            // The filter that checks the filename only works if there are no nested classes
            // So, when customizing client classes that contain service interface, this can incorrectly return
            // the service interface instead of the client class. So, we should add another check for exact name match
            .filter(si -> si.getName().equals(className))
            .filter(si -> si.getLocation().getUri().endsWith(packagePath + "/" + className + ".java"))
            .findFirst();

        return Utils.returnIfPresentOrThrow(classSymbol,
            symbol -> new EclipseClassCustomization(getRawEditor(), languageClient, packageName, className, symbol),
            () -> new IllegalArgumentException(className + " does not exist in package " + packageName));
    }

    @Override
    public Editor getRawEditor() {
        return editor;
    }
}
