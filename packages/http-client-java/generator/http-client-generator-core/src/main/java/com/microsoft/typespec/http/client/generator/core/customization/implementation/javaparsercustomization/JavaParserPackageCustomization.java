// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.customization.implementation.javaparsercustomization;

import com.microsoft.typespec.http.client.generator.core.customization.ClassCustomization;
import com.microsoft.typespec.http.client.generator.core.customization.Editor;
import com.microsoft.typespec.http.client.generator.core.customization.PackageCustomization;
import java.util.List;
import java.util.stream.Collectors;

/**
 * The package level customization for an AutoRest generated client library.
 */
public final class JavaParserPackageCustomization implements PackageCustomization {
    private final Editor editor;
    private final String packageName;

    JavaParserPackageCustomization(Editor editor, String packageName) {
        this.editor = editor;
        this.packageName = packageName;
    }

    @Override
    public JavaParserClassCustomization getClass(String className) {
        if (!editor.classExists(packageName, className)) {
            throw new IllegalArgumentException(className + " does not exist in package " + packageName);
        }

        return new JavaParserClassCustomization(editor, packageName, className);
    }

    @Override
    public List<ClassCustomization> listClasses() {
        return editor.classesInPackage(packageName)
            .stream()
            .map(className -> new JavaParserClassCustomization(editor, packageName, className))
            .collect(Collectors.toList());
    }
}
