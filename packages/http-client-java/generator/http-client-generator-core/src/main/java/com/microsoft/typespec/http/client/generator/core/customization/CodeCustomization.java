// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.customization;

/**
 * Base interface for all code based customizations.
 */
public abstract class CodeCustomization {
    final Editor editor;
    final String fileName;

    CodeCustomization(Editor editor, String packageName, String className) {
        this.editor = editor;
        this.fileName = "src/main/java/" + packageName.replace('.', '/') + "/" + className + ".java";
    }

    /**
     * The Editor managing the state of the CodeCustomization.
     *
     * @return The Editor.
     */
    public Editor getEditor() {
        return editor;
    }

    /**
     * The name of the file containing where the code for the CodeCustomization exists.
     *
     * @return The name of the file.
     */
    public String getFileName() {
        return fileName;
    }
}
