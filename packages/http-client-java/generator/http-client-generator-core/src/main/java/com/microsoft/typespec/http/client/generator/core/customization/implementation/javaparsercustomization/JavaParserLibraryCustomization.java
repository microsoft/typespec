// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
package com.microsoft.typespec.http.client.generator.core.customization.implementation.javaparsercustomization;

import com.microsoft.typespec.http.client.generator.core.customization.Editor;
import com.microsoft.typespec.http.client.generator.core.customization.LibraryCustomization;

/**
 * Implementation of {@link LibraryCustomization} that uses the JavaParser library for customizations.
 */
public final class JavaParserLibraryCustomization implements LibraryCustomization {
    private final Editor editor;

    /**
     * Constructor for JavaParserLibraryCustomization.
     *
     * @param editor The editor to use for customization.
     */
    public JavaParserLibraryCustomization(Editor editor) {
        this.editor = editor;
    }

    @Override
    public JavaParserPackageCustomization getPackage(String packageName) {
        if (!editor.packageExists(packageName)) {
            throw new IllegalArgumentException(packageName + " does not exist");
        }
        return new JavaParserPackageCustomization(editor, packageName);
    }

    @Override
    public JavaParserClassCustomization getClass(String packageName, String className) {
        return getPackage(packageName).getClass(className);
    }

    @Override
    public Editor getRawEditor() {
        return editor;
    }
}
