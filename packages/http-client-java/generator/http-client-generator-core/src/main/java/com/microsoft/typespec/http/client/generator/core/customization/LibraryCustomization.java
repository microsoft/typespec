// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.customization;

import com.microsoft.typespec.http.client.generator.core.customization.implementation.Utils;
import com.microsoft.typespec.http.client.generator.core.customization.implementation.ls.EclipseLanguageClient;
import org.eclipse.lsp4j.SymbolInformation;

import java.util.Optional;

/**
 * The top level customization for an AutoRest generated client library.
 */
public final class LibraryCustomization {
    private final EclipseLanguageClient languageClient;
    private final Editor editor;

    LibraryCustomization(Editor editor, EclipseLanguageClient languageClient) {
        this.editor = editor;
        this.languageClient = languageClient;
    }

    /**
     * Gets the package level customization for a Java package in the client library.
     *
     * @param packageName the fully qualified name of the package
     * @return the package level customization.
     */
    public PackageCustomization getPackage(String packageName) {
        return new PackageCustomization(editor, languageClient, packageName);
    }

    /**
     * Gets the class level customization for a Java class in the client library.
     *
     * @param packageName the fully qualified name of the package
     * @param className the simple name of the class
     * @return the class level customization
     */
    public ClassCustomization getClass(String packageName, String className) {
        String packagePath = packageName.replace(".", "/");
        Optional<SymbolInformation> classSymbol = languageClient.findWorkspaceSymbol(className).stream()
            // findWorkspace symbol finds all classes that contain the classname term
            // The filter that checks the filename only works if there are no nested classes
            // So, when customizing client classes that contain service interface, this can incorrectly return
            // the service interface instead of the client class. So, we should add another check for exact name match
            .filter(si -> si.getName().equals(className))
            .filter(si -> si.getLocation().getUri().toString().endsWith(packagePath + "/" + className + ".java"))
            .findFirst();

        return Utils.returnIfPresentOrThrow(classSymbol,
            symbol -> new ClassCustomization(editor, languageClient, packageName, className, symbol),
            () -> new IllegalArgumentException(className + " does not exist in package " + packageName));
    }

    /**
     * Gets the raw editor containing the current files being edited and eventually emitted to the disk.
     *
     * @return the raw editor
     */
    public Editor getRawEditor() {
        return editor;
    }
}
