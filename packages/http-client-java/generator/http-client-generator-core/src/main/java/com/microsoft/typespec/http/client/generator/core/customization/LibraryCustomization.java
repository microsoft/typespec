// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.customization;

/**
 * The top level customization for an AutoRest generated client library.
 */
public final class LibraryCustomization {
    private final Editor editor;

    LibraryCustomization(Editor editor) {
        this.editor = editor;
    }

    /**
     * Gets the package level customization for a Java package in the client library.
     *
     * @param packageName the fully qualified name of the package
     * @return the package level customization.
     */
    public PackageCustomization getPackage(String packageName) {
        if (!editor.packageExists(packageName)) {
            throw new IllegalArgumentException(packageName + " does not exist");
        }
        return new PackageCustomization(editor, packageName);
    }

    /**
     * Gets the class level customization for a Java class in the client library.
     *
     * @param packageName the fully qualified name of the package
     * @param className the simple name of the class
     * @return the class level customization
     */
    public ClassCustomization getClass(String packageName, String className) {
        return getPackage(packageName).getClass(className);
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
