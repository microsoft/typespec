// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.customization;

import java.util.List;
import java.util.stream.Collectors;

/**
 * The package level customization for an AutoRest generated client library.
 */
public final class PackageCustomization {
    private final Editor editor;
    private final String packageName;

    PackageCustomization(Editor editor, String packageName) {
        this.editor = editor;
        this.packageName = packageName;
    }

    /**
     * Gets the class level customization for a Java class in the package.
     *
     * @param className the simple name of the class
     * @return the class level customization
     */
    public ClassCustomization getClass(String className) {
        if (!editor.classExists(packageName, className)) {
            throw new IllegalArgumentException(className + " does not exist in package " + packageName);
        }

        return new ClassCustomization(editor, packageName, className);
    }

    /**
     * This method lists all the classes in this package.
     * 
     * @return A list of classes that are in this package.
     */
    public List<ClassCustomization> listClasses() {
        return editor.classesInPackage(packageName)
            .stream()
            .map(className -> new ClassCustomization(editor, packageName, className))
            .collect(Collectors.toList());
    }
}
